export interface PhoneHubScore {
  total: number;        // 0-100
  display: number;      // 0-100
  camera: number;       // 0-100
  performance: number;  // 0-100
  battery: number;      // 0-100
  value: number;        // 0-100 (spec-to-price ratio)
  build: number;        // 0-100
}

interface BenchmarkLike {
  geekbench?: { single?: number; multi?: number };
  antutu?: { total?: number; cpu?: number; gpu?: number; mem?: number; ux?: number };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function extractNumber(str: string, re: RegExp): number | null {
  const m = str.match(re);
  return m ? parseFloat(m[1]) : null;
}

function extractAllNumbers(str: string, re: RegExp): number[] {
  return [...str.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))]
    .map(m => parseFloat(m[1]))
    .filter(n => !isNaN(n));
}

// ─── spec accessors ────────────────────────────────────────────────────────────

function getSpecSection(specs: Record<string, Record<string, string>>, section: string): Record<string, string> {
  return specs[section] || {};
}

function getSpecValue(specs: Record<string, Record<string, string>>, section: string, key: string): string {
  return (specs[section]?.[key] || '').toLowerCase();
}

function getQuickSpec(product: any, key: string): string {
  return (product?.quickSpecs?.[key] || '').toLowerCase();
}

// ─── Display Score ──────────────────────────────────────────────────────────────

function calcDisplayScore(product: any, specs: Record<string, Record<string, string>>): number {
  let score = 25; // baseline

  const displaySection = getSpecSection(specs, 'Display');
  const displayType = (displaySection['Type'] || '').toLowerCase();
  const displaySize = (displaySection['Size'] || '').toLowerCase();
  const displayRes = (displaySection['Resolution'] || '').toLowerCase();
  const quickDisplay = getQuickSpec(product, 'display');

  // AMOLED / OLED detection (+30)
  if (/amoled|oled|super retina|dynamic amoled|amoled|p-oled|plastic oled/.test(displayType)) {
    score += 30;
  } else if (/ips|lcd|tft/.test(displayType)) {
    score += 10;
  }

  // High refresh rate: +20 per 30Hz above 60
  const refreshMatch = displayType.match(/(\d+)\s*hz/) ||
    quickDisplay.match(/(\d+)\s*hz/) ||
    getQuickSpec(product, 'refreshrate').match(/(\d+)/);
  if (refreshMatch) {
    const hz = parseInt(refreshMatch[1]);
    const above60 = Math.max(0, hz - 60);
    score += Math.min(40, Math.floor(above60 / 30) * 20);
  }

  // HDR (+15)
  if (/hdr|dolby vision|hdr10/.test(displayType)) {
    score += 15;
  }

  // Resolution
  const ppiMatch = displayRes.match(/~?(\d+)\s*ppi/) || displayRes.match(/(\d{3,4})\s*x\s*(\d{3,4})/);
  if (ppiMatch) {
    if (ppiMatch[2]) {
      // Use pixel dimensions
      const w = parseInt(ppiMatch[1]);
      const h = parseInt(ppiMatch[2]);
      const maxDim = Math.max(w, h);
      if (maxDim >= 2560) score += 20;       // 1440p+
      else if (maxDim >= 1920) score += 10;  // 1080p
    } else {
      const ppi = parseInt(ppiMatch[1]);
      if (ppi >= 450) score += 20;
      else if (ppi >= 350) score += 15;
      else if (ppi >= 280) score += 10;
    }
  }

  // Large size (+10 for 6.5"+)
  const sizeMatch = displaySize.match(/([\d.]+)\s*inches?/) || quickDisplay.match(/([\d.]+)\s*inches?/);
  if (sizeMatch) {
    const inches = parseFloat(sizeMatch[1]);
    if (inches >= 6.5) score += 10;
    else if (inches >= 6.0) score += 5;
  }

  return clamp(score);
}

// ─── Camera Score ────────────────────────────────────────────────────────────────

function calcCameraScore(product: any, specs: Record<string, Record<string, string>>): number {
  let score = 20; // baseline

  const mainCam = getSpecSection(specs, 'Main Camera');
  const selfieCam = getSpecSection(specs, 'Selfie Camera') || getSpecSection(specs, 'Selfie camera');
  const mainSingle = (mainCam['Single'] || mainCam['Dual'] || mainCam['Triple'] || mainCam['Quad'] || '').toLowerCase();
  const mainVideo = (mainCam['Video'] || '').toLowerCase();
  const quickCam = getQuickSpec(product, 'camera');
  const combined = mainSingle + ' ' + quickCam;

  // High MP: +20 per 50MP
  const mpValues = extractAllNumbers(combined, /(\d+)\s*mp/gi);
  const maxMp = mpValues.length ? Math.max(...mpValues) : 0;
  score += Math.min(40, Math.floor(maxMp / 50) * 20);
  if (maxMp >= 40 && maxMp < 50) score += 10;

  // OIS (+15)
  if (/ois|optical image stab/i.test(combined)) {
    score += 15;
  }

  // Ultrawide (+10)
  if (/ultrawide|ultra.?wide|120°|123°|114°/.test(combined + ' ' + (mainCam['Triple'] || '') + ' ' + (mainCam['Quad'] || ''))) {
    score += 10;
  }

  // Telephoto (+15)
  if (/telephoto|periscope|zoom|optical zoom/.test(combined + ' ' + (mainCam['Triple'] || '') + ' ' + (mainCam['Quad'] || ''))) {
    score += 15;
  }

  // Video resolution
  if (/8k/.test(mainVideo)) {
    score += 15;
  } else if (/4k|2160p/.test(mainVideo)) {
    score += 10;
  }

  // Multiple cameras (+5 per extra, up to 3 extras = +15)
  const camCount = (combined.match(/(\d+)\s*mp/gi) || []).length;
  score += Math.min(15, Math.max(0, (camCount - 1)) * 5);

  return clamp(score);
}

// ─── Performance Score ───────────────────────────────────────────────────────────

function calcPerformanceScore(
  product: any,
  specs: Record<string, Record<string, string>>,
  benchmark?: BenchmarkLike | null
): number {
  let score = 15; // baseline

  // Use benchmark data if available
  if (benchmark?.antutu?.total) {
    const antutu = benchmark.antutu.total;
    // Normalize: 2,000,000 = 100
    score = Math.round((antutu / 2_000_000) * 100);
    // Mix in geekbench if available
    if (benchmark.geekbench?.single && benchmark.geekbench?.multi) {
      const gbScore = Math.round(
        ((benchmark.geekbench.single / 3000) * 50 + (benchmark.geekbench.multi / 8000) * 50)
      );
      score = Math.round(score * 0.7 + gbScore * 0.3);
    }
    return clamp(score);
  }

  // Fallback scoring
  const memorySection = getSpecSection(specs, 'Memory');
  const platformSection = getSpecSection(specs, 'Platform');
  const quickRam = getQuickSpec(product, 'ram');
  const quickStorage = getQuickSpec(product, 'storage');
  const quickProcessor = getQuickSpec(product, 'processor');

  // RAM tier: +15 per tier (2/4/6/8/12/16 GB)
  const ramMatch = quickRam.match(/(\d+)\s*gb\s*ram/i) ||
    (memorySection['Internal'] || '').match(/(\d+)\s*gb\s*ram/i);
  if (ramMatch) {
    const ram = parseInt(ramMatch[1]);
    if (ram >= 16) score += 60;
    else if (ram >= 12) score += 50;
    else if (ram >= 8) score += 40;
    else if (ram >= 6) score += 30;
    else if (ram >= 4) score += 20;
    else score += 10;
  }

  // Storage tier (+10 per tier: 64/128/256/512/1TB)
  const storageMatch = quickStorage.match(/(\d+)\s*gb/i) ||
    (memorySection['Internal'] || '').match(/(\d+)\s*gb/i);
  if (storageMatch) {
    const storage = parseInt(storageMatch[1]);
    if (storage >= 1000) score += 40;
    else if (storage >= 512) score += 30;
    else if (storage >= 256) score += 20;
    else if (storage >= 128) score += 15;
    else score += 10;
  }

  // Flagship chipset (+25)
  const chipset = (platformSection['Chipset'] || quickProcessor).toLowerCase();
  if (/snapdragon 8|dimensity 9|exynos 2[1-9]|apple a1[5-9]|apple a[2-9]\d|google tensor g[3-9]|snapdragon 7\+|dimensity 8[0-9]/.test(chipset)) {
    score += 25;
  } else if (/snapdragon 7|dimensity 7|exynos 1[3-9]|apple a1[3-4]|google tensor g[1-2]|helio g9/.test(chipset)) {
    score += 15;
  } else if (/snapdragon 6|dimensity 6|helio g[5-8]/.test(chipset)) {
    score += 8;
  }

  return clamp(score);
}

// ─── Battery Score ───────────────────────────────────────────────────────────────

function calcBatteryScore(product: any, specs: Record<string, Record<string, string>>): number {
  const batterySection = getSpecSection(specs, 'Battery');
  const batteryType = (batterySection['Type'] || '').toLowerCase();
  const charging = (batterySection['Charging'] || '').toLowerCase();
  const quickBattery = getQuickSpec(product, 'battery');
  const combined = batteryType + ' ' + quickBattery;

  // Capacity: 5000mAh = 80 baseline, scale up/down
  const mahMatch = combined.match(/(\d{3,5})\s*mah/i);
  let score = 40; // default if no capacity found
  if (mahMatch) {
    const mah = parseInt(mahMatch[1]);
    score = Math.round((mah / 5000) * 80);
  }

  // Fast charging: +10 per 25W
  const wattMatch = charging.match(/(\d+)\s*w/);
  if (wattMatch) {
    const watts = parseInt(wattMatch[1]);
    score += Math.min(30, Math.floor(watts / 25) * 10);
  }

  // Wireless charging (+10)
  if (/wireless|qi|magsafe|qi2/.test(charging)) {
    score += 10;
  }

  // Removable (+5)
  if (/removable/.test(batteryType)) {
    score += 5;
  }

  return clamp(score);
}

// ─── Value Score ─────────────────────────────────────────────────────────────────

function calcValueScore(
  product: any,
  specScores: { display: number; camera: number; performance: number; battery: number; build: number },
  categoryAvgPrice: number
): number {
  const price = product?.basePrice || 0;
  if (price <= 0) return 50; // No price data — neutral

  const specTotal = (specScores.display + specScores.camera + specScores.performance + specScores.battery + specScores.build) / 5;

  // Value = how much spec you get per dollar, relative to category average
  // High spec + low price = high value
  // Clamp the ratio so expensive flagships aren't crushed and ultra-cheap
  // devices aren't inflated beyond reason.
  const priceRatio = categoryAvgPrice / price; // >1 means cheaper than average
  const clampedRatio = Math.max(0.5, Math.min(2.0, priceRatio));
  const raw = specTotal * clampedRatio;

  // Normalize: raw of 100 = excellent value, 50 = average
  return clamp(Math.round(raw * 0.9));
}

// ─── Build Score ─────────────────────────────────────────────────────────────────

function calcBuildScore(product: any, specs: Record<string, Record<string, string>>): number {
  let score = 35; // baseline

  const bodySection = getSpecSection(specs, 'Body');
  const buildStr = (bodySection['Build'] || '').toLowerCase();
  const bodyOther = (bodySection['Other'] || '').toLowerCase();
  const protection = (bodySection['Protection'] || (specs['Display'] || {})['Protection'] || '').toLowerCase();
  const combined = buildStr + ' ' + bodyOther;

  // IP rating
  if (/ip68|ip69/.test(combined)) {
    score += 25;
  } else if (/ip67|ip66/.test(combined)) {
    score += 15;
  } else if (/ip5[0-9]|ip6[0-5]/.test(combined)) {
    score += 8;
  }

  // Premium materials: glass + metal (+20)
  const hasGlass = /glass/.test(buildStr);
  const hasMetal = /aluminum|aluminium|steel|metal|titanium/.test(buildStr);
  if (hasGlass && hasMetal) {
    score += 20;
  } else if (hasGlass || hasMetal) {
    score += 10;
  } else if (/plastic|polycarbonate/.test(buildStr)) {
    score += 0;
  }

  // Gorilla Glass (+10)
  if (/gorilla glass|corning/.test(protection + ' ' + combined)) {
    score += 10;
  }

  // Ceramic Shield / Sapphire (+10 bonus for premium protection)
  if (/ceramic shield|sapphire/.test(protection + ' ' + combined)) {
    score += 10;
  }

  return clamp(score);
}

// ─── Monitor Score ───────────────────────────────────────────────────────────────

function calcMonitorScore(product: any): PhoneHubScore {
  const qs = product?.quickSpecs || {};
  const display = (qs.display || '').toLowerCase();
  const refreshRate = (qs.refreshrate || '').toLowerCase();
  const panelType = (qs.paneltype || '').toLowerCase();
  const responseTime = (qs.responsetime || '').toLowerCase();
  const connectivity = (qs.connectivity || '').toLowerCase();
  const price = product?.basePrice || 0;

  // Display (panel + resolution + size)
  let displayScore = 30;
  if (/oled|mini.?led/.test(panelType + ' ' + display)) displayScore += 35;
  else if (/ips black/.test(panelType)) displayScore += 25;
  else if (/ips|nano ips/.test(panelType)) displayScore += 15;
  else if (/va/.test(panelType)) displayScore += 10;

  if (/4k|3840\s*x\s*2160|uhd/.test(display)) displayScore += 20;
  else if (/2560\s*x\s*1440|qhd|1440p/.test(display)) displayScore += 12;

  const sizeMatch = display.match(/(\d+)\s*inch/);
  if (sizeMatch) {
    const inches = parseInt(sizeMatch[1]);
    if (inches >= 32) displayScore += 10;
    else if (inches >= 27) displayScore += 7;
    else if (inches >= 24) displayScore += 4;
  }
  displayScore = clamp(displayScore);

  // Camera slot → repurpose as "Color Accuracy" — use refresh rate for performance
  let cameraScore = 40;
  // Color accuracy proxy: panel quality indicators
  if (/factory calibrat|hdr ?600|hdr ?1000|dci-p3|99%|100%|adobe rgb/.test(
    (product?.review || '').toLowerCase() + ' ' + display + ' ' + connectivity
  )) cameraScore += 30;
  if (/hdr/.test(display + ' ' + connectivity)) cameraScore += 15;
  cameraScore = clamp(cameraScore);

  // Performance → refresh rate + response time
  let perfScore = 20;
  const hzMatch = refreshRate.match(/(\d+)/);
  if (hzMatch) {
    const hz = parseInt(hzMatch[1]);
    if (hz >= 240) perfScore += 70;
    else if (hz >= 180) perfScore += 55;
    else if (hz >= 144) perfScore += 45;
    else if (hz >= 120) perfScore += 35;
    else if (hz >= 90) perfScore += 20;
    else if (hz >= 75) perfScore += 10;
  }
  const msMatch = responseTime.match(/([\d.]+)\s*ms/);
  if (msMatch) {
    const ms = parseFloat(msMatch[1]);
    if (ms <= 1) perfScore += 15;
    else if (ms <= 2) perfScore += 10;
    else if (ms <= 5) perfScore += 5;
  }
  perfScore = clamp(perfScore);

  // Battery → connectivity / features
  let batteryScore = 40;
  if (/usb-?c/.test(connectivity)) batteryScore += 20;
  if (/(\d+)\s*w/.test(connectivity)) {
    const w = parseInt(RegExp.$1);
    if (w >= 65) batteryScore += 20;
    else if (w >= 40) batteryScore += 15;
    else if (w >= 15) batteryScore += 10;
  }
  if (/hdmi|dp|displayport/.test(connectivity)) batteryScore += 10;
  batteryScore = clamp(batteryScore);

  // Build (materials, stand)
  let buildScore = 55;
  if (/ergonomic|height adjust|vrr|g-sync|freesync/.test(
    (product?.review || '').toLowerCase() + ' ' + connectivity
  )) buildScore += 20;
  buildScore = clamp(buildScore);

  // Value
  let valueScore = 50;
  if (price > 0) {
    const specAvg = (displayScore + cameraScore + perfScore + batteryScore + buildScore) / 5;
    const avgMonitorPrice = 400;
    valueScore = clamp(Math.round((specAvg * (avgMonitorPrice / price)) * 0.85));
  }

  const total = Math.round(
    displayScore * 0.25 +
    cameraScore * 0.15 +
    perfScore * 0.30 +
    batteryScore * 0.10 +
    valueScore * 0.12 +
    buildScore * 0.08
  );

  return {
    total: clamp(total),
    display: displayScore,
    camera: cameraScore,
    performance: perfScore,
    battery: batteryScore,
    value: valueScore,
    build: buildScore,
  };
}

// ─── Router Score ────────────────────────────────────────────────────────────────

function calcRouterScore(product: any): PhoneHubScore {
  const qs = product?.quickSpecs || {};
  const wifiStandard = (qs.wifistandard || qs.wifiStandard || '').toLowerCase();
  const maxSpeed = (qs.maxspeed || qs.maxSpeed || '').toLowerCase();
  const bands = (qs.bands || '').toLowerCase();
  const ports = (qs.ports || '').toLowerCase();
  const price = product?.basePrice || 0;

  // Display → Wi-Fi capability
  let displayScore = 30;
  if (/wi-?fi 7|802\.11be/.test(wifiStandard)) displayScore += 50;
  else if (/wi-?fi 6e|802\.11axe/.test(wifiStandard)) displayScore += 40;
  else if (/wi-?fi 6|802\.11ax/.test(wifiStandard)) displayScore += 30;
  else if (/wi-?fi 5|802\.11ac/.test(wifiStandard)) displayScore += 15;
  displayScore = clamp(displayScore);

  // Camera → Speed
  let cameraScore = 20;
  const speedMatch = maxSpeed.match(/([\d.]+)\s*gbps/i);
  if (speedMatch) {
    const gbps = parseFloat(speedMatch[1]);
    if (gbps >= 20) cameraScore += 60;
    else if (gbps >= 10) cameraScore += 45;
    else if (gbps >= 5) cameraScore += 30;
    else if (gbps >= 2) cameraScore += 15;
  }
  cameraScore = clamp(cameraScore);

  // Performance → Bands + channels
  let perfScore = 25;
  if (/quad.?band|tri.?band/.test(bands)) perfScore += 40;
  else if (/dual.?band/.test(bands)) perfScore += 20;
  if (/320\s*mhz|160\s*mhz/.test(bands)) perfScore += 20;
  perfScore = clamp(perfScore);

  // Battery → Ports & features
  let batteryScore = 30;
  const portCount = (ports.match(/\d+x/g) || []).reduce((sum: number, m: string) => sum + parseInt(m), 0);
  batteryScore += Math.min(40, portCount * 6);
  if (/10g/.test(ports)) batteryScore += 15;
  batteryScore = clamp(batteryScore);

  // Build
  let buildScore = 50;
  if (/mesh|aimesh|easymesh/.test((product?.review || '').toLowerCase() + ' ' + bands)) buildScore += 20;
  buildScore = clamp(buildScore);

  // Value
  let valueScore = 50;
  if (price > 0) {
    const specAvg = (displayScore + cameraScore + perfScore + batteryScore + buildScore) / 5;
    const avgRouterPrice = 250;
    valueScore = clamp(Math.round((specAvg * (avgRouterPrice / price)) * 0.85));
  }

  const total = Math.round(
    displayScore * 0.22 +
    cameraScore * 0.18 +
    perfScore * 0.25 +
    batteryScore * 0.15 +
    valueScore * 0.12 +
    buildScore * 0.08
  );

  return {
    total: clamp(total),
    display: displayScore,
    camera: cameraScore,
    performance: perfScore,
    battery: batteryScore,
    value: valueScore,
    build: buildScore,
  };
}

// ─── Generic Score (other categories) ────────────────────────────────────────────

function calcGenericScore(product: any): PhoneHubScore {
  const rating = product?.rating || 3.5;
  const baseScore = Math.round((rating / 5) * 80);
  const price = product?.basePrice || 0;

  const valueScore = price > 0
    ? clamp(Math.round(baseScore * Math.max(0.5, Math.min(2, 200 / Math.max(price, 50)))))
    : 50;

  const s = clamp(baseScore);
  const total = Math.round(s * 0.75 + valueScore * 0.25);

  return {
    total: clamp(total),
    display: s,
    camera: s,
    performance: s,
    battery: s,
    value: clamp(valueScore),
    build: s,
  };
}

// ─── Main entry point ────────────────────────────────────────────────────────────

export function calculateScore(
  product: any,
  specs: Record<string, Record<string, string>> = {},
  benchmarkData?: BenchmarkLike | null,
  categoryAvgPrice?: number
): PhoneHubScore {
  const category = (product?.category || '').toLowerCase();

  if (category === 'monitor') return calcMonitorScore(product);
  if (category === 'router') return calcRouterScore(product);
  if (category !== 'phone') return calcGenericScore(product);

  // Phone scoring
  const display = calcDisplayScore(product, specs);
  const camera = calcCameraScore(product, specs);
  const performance = calcPerformanceScore(product, specs, benchmarkData);
  const battery = calcBatteryScore(product, specs);
  const build = calcBuildScore(product, specs);

  const avgPrice = categoryAvgPrice ?? 600;
  const value = calcValueScore(product, { display, camera, performance, battery, build }, avgPrice);

  // ─── Rating/price prior ──────────────────────────────────────────────
  // Many catalog entries lack detailed spec sections, which would otherwise
  // collapse their scores to bare baselines (~25). Anchor such products to a
  // prior derived from user rating and price tier so flagships land ~80–95
  // and budget devices ~40–65 instead of looking broken.
  const rating = typeof product?.rating === 'number' && product.rating > 0 ? product.rating : 4.0;
  const price = product?.basePrice || 0;
  const ratingNorm = Math.max(0, Math.min(1, (rating - 3.5) / 1.5));
  const priceTier = price >= 1000 ? 1 : price >= 700 ? 0.8 : price >= 450 ? 0.55 : price >= 250 ? 0.3 : price > 0 ? 0.15 : 0.3;
  const prior = clamp(48 + ratingNorm * 30 + priceTier * 22);

  // A section only counts as real data if it holds at least one non-stub value
  const isStubValue = (v: unknown) => {
    const s = (typeof v === 'string' ? v : '').trim();
    return !s || s === '—' || s === '-' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'unknown';
  };
  const coreSections = ['Display', 'Platform', 'Main Camera', 'Battery', 'Memory', 'Body'];
  const meaningfulSections = coreSections.filter((name) => {
    const key = Object.keys(specs).find((k) => k.toLowerCase() === name.toLowerCase());
    if (!key) return false;
    return Object.values(specs[key]).some((v) => !isStubValue(v));
  });
  const dataRich = Boolean(benchmarkData?.antutu?.total) || meaningfulSections.length >= 2;

  if (!dataRich) {
    // Spec-poor product: anchor each component to the prior (spec-derived
    // values are bare baselines here, so they get minimal weight).
    const anchor = (c: number) => clamp(Math.round(c * 0.1 + prior * 0.9));
    const aDisplay = anchor(display);
    const aCamera = anchor(camera);
    const aPerformance = anchor(performance);
    const aBattery = anchor(battery);
    const aValue = anchor(value);
    const aBuild = anchor(build);

    const total = Math.round(
      aDisplay * 0.20 +
      aCamera * 0.18 +
      aPerformance * 0.22 +
      aBattery * 0.15 +
      aValue * 0.15 +
      aBuild * 0.10
    );

    return {
      total: clamp(total),
      display: aDisplay,
      camera: aCamera,
      performance: aPerformance,
      battery: aBattery,
      value: aValue,
      build: aBuild,
    };
  }

  const total = Math.max(
    Math.round(
      display * 0.20 +
      camera * 0.18 +
      performance * 0.22 +
      battery * 0.15 +
      value * 0.15 +
      build * 0.10
    ),
    // Lift: never let a product crater far below its rating/price prior,
    // while never exceeding its honest computed score by more than the blend.
    Math.round(
      (display * 0.20 +
      camera * 0.18 +
      performance * 0.22 +
      battery * 0.15 +
      value * 0.15 +
      build * 0.10) * 0.45 + prior * 0.55
    )
  );

  return {
    total: clamp(total),
    display,
    camera,
    performance,
    battery,
    value,
    build,
  };
}
