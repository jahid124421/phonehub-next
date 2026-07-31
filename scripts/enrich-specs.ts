/**
 * enrich-specs.ts — Enrich products.json with normalized filterSpecs
 * Reads products.json + specs.json, derives filter-friendly fields via pattern matching.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "..", "src", "data");
const products = JSON.parse(readFileSync(join(DATA_DIR, "products.json"), "utf-8"));
const specs: Record<string, Record<string, Record<string, string>>> = JSON.parse(
  readFileSync(join(DATA_DIR, "specs.json"), "utf-8")
);

// ─── Helpers ───────────────────────────────────────────────────────────────

function num(s: string | undefined | null): number | null {
  if (!s) return null;
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function firstMatch(s: string | undefined, patterns: RegExp[]): string | null {
  if (!s) return null;
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1] || m[0];
  }
  return null;
}

function includes(s: string | undefined, ...terms: string[]): boolean {
  if (!s) return false;
  const lower = s.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

// ─── Display parsing ───────────────────────────────────────────────────────

function parseDisplayTech(qs: string, spec: Record<string, string> | undefined): string | null {
  const typeStr = spec?.["Type"] || qs || "";
  if (includes(typeStr, "Super AMOLED")) return "Super AMOLED";
  if (includes(typeStr, "Dynamic AMOLED")) return "Dynamic AMOLED";
  if (includes(typeStr, "AMOLED")) return "AMOLED";
  if (includes(typeStr, "LTPO OLED") || includes(typeStr, "LTPO")) return "LTPO OLED";
  if (includes(typeStr, "OLED")) return "OLED";
  if (includes(typeStr, "Super Retina XDR")) return "Super Retina XDR OLED";
  if (includes(typeStr, "IPS LCD") || includes(typeStr, "IPS")) return "IPS LCD";
  if (includes(typeStr, "TFT")) return "TFT";
  if (includes(typeStr, "LCD")) return "LCD";
  return null;
}

function parseRefreshRate(qs: string, spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Type"] || qs || "";
  const m = s.match(/(\d+)\s*Hz/i);
  return m ? parseInt(m[1]) : null;
}

function parseDisplaySize(qs: string, spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Size"] || qs || "";
  const m = s.match(/([\d.]+)\s*inches?/i);
  return m ? parseFloat(m[1]) : null;
}

function parseDisplayResolution(qs: string, spec: Record<string, string> | undefined): string | null {
  const s = spec?.["Resolution"] || qs || "";
  const m = s.match(/(\d+)\s*x\s*(\d+)/i);
  return m ? `${m[1]}x${m[2]}` : null;
}

function parseHdr(spec: Record<string, string> | undefined, qs: string): boolean {
  const s = (spec?.["Type"] || "") + " " + qs;
  return includes(s, "HDR", "HDR10", "Dolby Vision");
}

function parseBrightness(spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Type"] || "";
  // Look for peak or HBM brightness
  const peak = s.match(/(\d+)\s*nits\s*\(peak\)/i);
  if (peak) return parseInt(peak[1]);
  const hbm = s.match(/(\d+)\s*nits\s*\(HBM\)/i);
  if (hbm) return parseInt(hbm[1]);
  const typical = s.match(/(\d+)\s*nits/i);
  return typical ? parseInt(typical[1]) : null;
}

// ─── Camera parsing ────────────────────────────────────────────────────────

function parseMainCameraMP(qs: string, spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Single"] || spec?.["Dual"] || spec?.["Triple"] || spec?.["Quad"] || qs || "";
  const m = s.match(/(\d+)\s*MP/i);
  return m ? parseInt(m[1]) : null;
}

function parseCameraCount(qs: string, spec: Record<string, string> | undefined): number | null {
  const camStr = spec?.["Single"] || spec?.["Dual"] || spec?.["Triple"] || spec?.["Quad"] || qs || "";
  if (includes(camStr, "Quad")) return 4;
  if (includes(camStr, "Triple")) return 3;
  if (includes(camStr, "Dual") && !includes(camStr, "dual pixel")) return 2;
  // Count newlines for multi-line camera specs
  const lines = camStr.split("\n").filter((l) => l.trim().match(/\d+\s*MP/i));
  if (lines.length > 1) return lines.length;
  if (lines.length === 1) return 1;
  return null;
}

function parseOIS(qs: string, spec: Record<string, string> | undefined): boolean {
  const s = (spec?.["Single"] || spec?.["Dual"] || spec?.["Triple"] || spec?.["Quad"] || "") + " " + qs;
  return includes(s, "OIS");
}

function parseUltrawide(qs: string, spec: Record<string, string> | undefined): boolean {
  const s = (spec?.["Single"] || spec?.["Dual"] || spec?.["Triple"] || spec?.["Quad"] || "") + " " + qs;
  return includes(s, "ultrawide", "ultra-wide", "ultra wide");
}

function parseTelephoto(qs: string, spec: Record<string, string> | undefined): boolean {
  const s = (spec?.["Single"] || spec?.["Dual"] || spec?.["Triple"] || spec?.["Quad"] || "") + " " + qs;
  return includes(s, "telephoto", "periscope");
}

function parseVideoResolution(spec: Record<string, string> | undefined, qs: string): string | null {
  const s = (spec?.["Video"] || "") + " " + qs;
  if (includes(s, "8K")) return "8K";
  if (includes(s, "4K") || includes(s, "2160p")) return "4K";
  if (includes(s, "1440p")) return "1440p";
  if (includes(s, "1080p")) return "1080p";
  return null;
}

function parseFlash(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["Features"] || "";
  if (includes(s, "Dual-LED")) return "Dual-LED";
  if (includes(s, "LED flash") || includes(s, "LED")) return "LED";
  if (includes(s, "flash")) return "LED";
  return null;
}

function parseSelfieType(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["Single"] || "";
  if (includes(s, "motorized") || includes(s, "pop-up")) return "Motorized";
  if (includes(s, "under")) return "Under-display";
  if (s) return "Standard";
  return null;
}

// ─── Battery parsing ───────────────────────────────────────────────────────

function parseBatteryCapacity(qs: string, spec: Record<string, string> | undefined): number | null {
  const s = (spec?.["Type"] || "") + " " + qs;
  const m = s.match(/(\d{3,5})\s*mAh/i);
  return m ? parseInt(m[1]) : null;
}

function parseChargingWatt(qs: string, spec: Record<string, string> | undefined): number | null {
  const s = (spec?.["Charging"] || "") + " " + qs;
  const m = s.match(/(\d+)\s*W\s*(wired|charging)?/i);
  return m ? parseInt(m[1]) : null;
}

function parseWirelessCharging(spec: Record<string, string> | undefined): boolean {
  const s = spec?.["Charging"] || "";
  return includes(s, "wireless", "MagSafe", "Qi");
}

function parseRemovableBattery(spec: Record<string, string> | undefined): boolean {
  const s = spec?.["Type"] || "";
  return includes(s, "Removable");
}

function parseBatteryType(spec: Record<string, string> | undefined, qs: string): string | null {
  const s = (spec?.["Type"] || "") + " " + qs;
  if (includes(s, "Li-Po")) return "Li-Po";
  if (includes(s, "Li-Ion")) return "Li-Ion";
  return null;
}

// ─── Performance parsing ───────────────────────────────────────────────────

function parseChipset(spec: Record<string, string> | undefined, qs: string): string | null {
  const s = spec?.["Chipset"] || qs || "";
  if (!s) return null;
  // Normalize common chipsets
  const snapdragon = s.match(/Snapdragon\s+[\w\s]+?(?=\s*\(|\s*$)/i);
  if (snapdragon) return snapdragon[0].trim();
  const dimensity = s.match(/Dimensity\s+\d+/i);
  if (dimensity) return dimensity[0].trim();
  const exynos = s.match(/Exynos\s+\d+/i);
  if (exynos) return exynos[0].trim();
  const apple = s.match(/Apple\s+\w+\s*\w*/i);
  if (apple) return apple[0].trim();
  const tensor = s.match(/Google\s+Tensor\s+\w*/i) || s.match(/Tensor\s+\w+/i);
  if (tensor) return tensor[0].trim();
  const helio = s.match(/Helio\s+\w+\s*\d*/i);
  if (helio) return helio[0].trim();
  const unisoc = s.match(/Unisoc\s+\w+/i);
  if (unisoc) return unisoc[0].trim();
  return s.split("(")[0].trim() || null;
}

function parseChipsetFamily(chipset: string | null): string | null {
  if (!chipset) return null;
  if (includes(chipset, "Snapdragon")) return "Snapdragon";
  if (includes(chipset, "Dimensity")) return "MediaTek Dimensity";
  if (includes(chipset, "Exynos")) return "Exynos";
  if (includes(chipset, "Apple")) return "Apple A-series";
  if (includes(chipset, "Tensor")) return "Google Tensor";
  if (includes(chipset, "Helio")) return "MediaTek Helio";
  if (includes(chipset, "Unisoc")) return "Unisoc";
  return null;
}

function parseRAM(qs: string, spec: Record<string, string> | undefined): number[] {
  const s = spec?.["Internal"] || qs || "";
  const matches = [...s.matchAll(/(\d+)\s*GB\s*RAM/gi)];
  const vals = matches.map((m) => parseInt(m[1]));
  return [...new Set(vals)].sort((a, b) => a - b);
}

function parseStorage(qs: string, spec: Record<string, string> | undefined): number[] {
  const s = spec?.["Internal"] || qs || "";
  // Match storage values like "256GB", "1TB"
  const gbMatches = [...s.matchAll(/(\d+)\s*GB(?!\s*RAM)/gi)].map((m) => parseInt(m[1]));
  const tbMatches = [...s.matchAll(/(\d+)\s*TB/gi)].map((m) => parseInt(m[1]) * 1024);
  const vals = [...gbMatches, ...tbMatches].filter((v) => v >= 16); // filter out tiny values
  return [...new Set(vals)].sort((a, b) => a - b);
}

function parseCPUCores(spec: Record<string, string> | undefined): number | null {
  const s = spec?.["CPU"] || "";
  const m = s.match(/(\w+)-core/i);
  if (m) {
    const map: Record<string, number> = {
      hexa: 6, "hexa-core": 6, octa: 8, "octa-core": 8,
      quad: 4, "quad-core": 4, deca: 10, "deca-core": 10,
    };
    return map[m[1].toLowerCase()] || null;
  }
  // Count GHz clusters: (2x... + 4x...)
  const clusters = [...s.matchAll(/(\d+)x/g)];
  if (clusters.length > 0) {
    return clusters.reduce((sum, c) => sum + parseInt(c[1]), 0);
  }
  return null;
}

function parseGPU(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["GPU"] || "";
  if (!s) return null;
  return s.trim() || null;
}

// ─── Build parsing ─────────────────────────────────────────────────────────

function parseIPRating(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["Other"] || spec?.["Build"] || "";
  const m = s.match(/(IP\d{2})/i);
  return m ? m[1].toUpperCase() : null;
}

function parseBodyMaterial(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["Build"] || "";
  if (!s) return null;
  const parts: string[] = [];
  if (includes(s, "Glass") || includes(s, "ceramic")) parts.push("Glass");
  if (includes(s, "aluminum") || includes(s, "aluminium") || includes(s, "metal") || includes(s, "steel")) parts.push("Metal");
  if (includes(s, "plastic") || includes(s, "polycarbonate")) parts.push("Plastic");
  if (includes(s, "leather") || includes(s, "vegan leather") || includes(s, "silicone")) parts.push("Leather");
  if (parts.length === 0) return null;
  return [...new Set(parts)].join("/");
}

function parseWeight(spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Weight"] || "";
  const m = s.match(/(\d+)\s*g\s*[\(/]/);
  return m ? parseInt(m[1]) : null;
}

function parseDimensions(spec: Record<string, string> | undefined): { w: number | null; h: number | null; d: number | null } {
  const s = spec?.["Dimensions"] || "";
  const m = s.match(/([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)\s*mm/);
  if (m) {
    return { h: parseFloat(m[1]), w: parseFloat(m[2]), d: parseFloat(m[3]) };
  }
  return { w: null, h: null, d: null };
}

// ─── Connectivity parsing ──────────────────────────────────────────────────

function parse5G(spec: Record<string, string> | undefined): boolean {
  const s = spec?.["Technology"] || spec?.["Speed"] || "";
  return includes(s, "5G");
}

function parseWiFiStandard(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["WLAN"] || "";
  if (!s) return null;
  if (includes(s, "802.11be") || includes(s, "Wi-Fi 7")) return "Wi-Fi 7";
  if (includes(s, "802.11ax") || includes(s, "Wi-Fi 6") || /[/\s]6[,\s]/.test(s) || includes(s, "ac/6")) return "Wi-Fi 6";
  if (includes(s, "802.11ac") || includes(s, "Wi-Fi 5") || includes(s, "/ac")) return "Wi-Fi 5";
  if (includes(s, "802.11n") || includes(s, "Wi-Fi 4") || includes(s, "/n")) return "Wi-Fi 4";
  if (includes(s, "802.11")) return "Legacy";
  return null;
}

function parseNFC(spec: Record<string, string> | undefined): boolean {
  const s = spec?.["NFC"] || "";
  return includes(s, "Yes");
}

function parseBluetoothVersion(spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Bluetooth"] || "";
  const m = s.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

function parseUSBType(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["USB"] || "";
  if (includes(s, "Type-C 3") || includes(s, "Type-C 3.1") || includes(s, "Type-C 3.2")) return "USB-C 3.x";
  if (includes(s, "Type-C")) return "USB-C";
  if (includes(s, "microUSB")) return "microUSB";
  if (includes(s, "Lightning")) return "Lightning";
  return null;
}

function parse35mmJack(spec: Record<string, string> | undefined): boolean {
  const s = spec?.["3.5mm jack"] || "";
  return includes(s, "Yes");
}

function parseSIMType(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["SIM"] || "";
  if (!s) return null;
  const hasNano = includes(s, "Nano-SIM") || includes(s, "Nano");
  const hasESIM = includes(s, "eSIM");
  if (hasNano && hasESIM) return "Nano-SIM + eSIM";
  if (hasESIM) return "eSIM";
  if (hasNano) return "Nano-SIM";
  return s.split("\n")[0].trim() || null;
}

function parseSIMCount(spec: Record<string, string> | undefined): number | null {
  const s = spec?.["SIM"] || "";
  if (!s) return null;
  const nanoMatches = s.match(/Nano-SIM/gi);
  const count = nanoMatches ? nanoMatches.length : 0;
  if (count > 0) return count;
  if (includes(s, "Dual SIM") || includes(s, "dual")) return 2;
  return 1;
}

function parseESIM(spec: Record<string, string> | undefined): boolean {
  const s = spec?.["SIM"] || "";
  return includes(s, "eSIM");
}

// ─── Other parsing ─────────────────────────────────────────────────────────

function parseFingerprintLocation(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["Sensors"] || "";
  if (includes(s, "under display") || includes(s, "under-display") || includes(s, "optical under")) return "under-display";
  if (includes(s, "side-mounted") || includes(s, "side mounted")) return "side-mounted";
  if (includes(s, "rear") || includes(s, "back")) return "rear";
  if (includes(s, "Face ID") || includes(s, "face recognition")) return "face-id";
  if (includes(s, "Fingerprint")) return "unspecified";
  return null;
}

function parseOS(spec: Record<string, string> | undefined): string | null {
  const s = spec?.["OS"] || "";
  if (!s) return null;
  const android = s.match(/Android\s+([\d.]+)/i);
  if (android) return `Android ${android[1]}`;
  const ios = s.match(/iOS\s+([\d.]+)/i);
  if (ios) return `iOS ${ios[1]}`;
  if (includes(s, "HarmonyOS")) return "HarmonyOS";
  if (includes(s, "Android")) return "Android";
  if (includes(s, "iOS")) return "iOS";
  return null;
}

function parseOSFamily(os: string | null): string | null {
  if (!os) return null;
  if (includes(os, "Android")) return "Android";
  if (includes(os, "iOS")) return "iOS";
  if (includes(os, "HarmonyOS")) return "HarmonyOS";
  return null;
}

function parseLaunchYear(releaseDate: string, spec: Record<string, string> | undefined): number | null {
  const s = spec?.["Announced"] || releaseDate || "";
  const m = s.match(/(20\d{2})/);
  return m ? parseInt(m[1]) : null;
}

function parseFormFactor(product: any, spec: Record<string, string> | undefined): string | null {
  const name = (product.name || "").toLowerCase();
  const cat = product.category || "";
  if (cat !== "phone") return null;
  if (includes(name, "fold") || includes(name, "z fold")) return "Foldable";
  if (includes(name, "flip") || includes(name, "z flip")) return "Clamshell";
  if (includes(spec?.["Build"] || "", "hinge")) return "Foldable";
  return "Standard";
}

function parseColors(spec: Record<string, string> | undefined): string[] {
  const s = spec?.["Colors"] || "";
  if (!s) return [];
  return s.split(",").map((c) => c.trim()).filter(Boolean);
}

// ─── Main enrichment ───────────────────────────────────────────────────────

interface FilterSpecs {
  // Display
  displayTechnology: string | null;
  refreshRate: number | null;
  displaySize: number | null;
  displayResolution: string | null;
  hdr: boolean;
  brightnessNits: number | null;
  // Camera
  mainCameraMP: number | null;
  cameraCount: number | null;
  ois: boolean;
  ultrawide: boolean;
  telephoto: boolean;
  videoResolution: string | null;
  flash: string | null;
  selfieType: string | null;
  // Battery
  batteryCapacity: number | null;
  chargingWatt: number | null;
  wirelessCharging: boolean;
  removableBattery: boolean;
  batteryType: string | null;
  // Performance
  chipset: string | null;
  chipsetFamily: string | null;
  ram: number[];
  storage: number[];
  cpuCores: number | null;
  gpu: string | null;
  // Build
  ipRating: string | null;
  bodyMaterial: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  // Connectivity
  has5G: boolean;
  wifiStandard: string | null;
  nfc: boolean;
  bluetooth: number | null;
  usbType: string | null;
  has35mmJack: boolean;
  simType: string | null;
  simCount: number | null;
  hasESIM: boolean;
  // Other
  fingerprintLocation: string | null;
  os: string | null;
  osFamily: string | null;
  formFactor: string | null;
  colors: string[];
  launchYear: number | null;
  price: number | null;
}

function enrichProduct(product: any): FilterSpecs {
  const spec = specs[product.id];
  const qs = product.quickSpecs || {};
  const qsDisplay = qs.display || "";
  const qsCamera = qs.camera || "";
  const qsBattery = qs.battery || "";
  const qsProcessor = qs.processor || "";
  const qsRAM = qs.ram || "";
  const qsStorage = qs.storage || "";

  const displaySpec = spec?.["Display"];
  const platformSpec = spec?.["Platform"];
  const memSpec = spec?.["Memory"];
  const mainCamSpec = spec?.["Main Camera"];
  const selfieSpec = spec?.["Selfie camera"];
  const batterySpec = spec?.["Battery"];
  const bodySpec = spec?.["Body"];
  const commsSpec = spec?.["Comms"];
  const soundSpec = spec?.["Sound"];
  const featSpec = spec?.["Features"];
  const networkSpec = spec?.["Network"];
  const miscSpec = spec?.["Misc"];
  const launchSpec = spec?.["Launch"];

  const os = parseOS(platformSpec);
  const chipset = parseChipset(platformSpec, qsProcessor);

  const dims = parseDimensions(bodySpec);

  return {
    // Display
    displayTechnology: parseDisplayTech(qsDisplay, displaySpec),
    refreshRate: parseRefreshRate(qsDisplay, displaySpec),
    displaySize: parseDisplaySize(qsDisplay, displaySpec),
    displayResolution: parseDisplayResolution(qsDisplay, displaySpec),
    hdr: parseHdr(displaySpec, qsDisplay),
    brightnessNits: parseBrightness(displaySpec),

    // Camera
    mainCameraMP: parseMainCameraMP(qsCamera, mainCamSpec),
    cameraCount: parseCameraCount(qsCamera, mainCamSpec),
    ois: parseOIS(qsCamera, mainCamSpec),
    ultrawide: parseUltrawide(qsCamera, mainCamSpec),
    telephoto: parseTelephoto(qsCamera, mainCamSpec),
    videoResolution: parseVideoResolution(mainCamSpec, qsCamera),
    flash: parseFlash(mainCamSpec),
    selfieType: parseSelfieType(selfieSpec),

    // Battery
    batteryCapacity: parseBatteryCapacity(qsBattery, batterySpec),
    chargingWatt: parseChargingWatt(qsBattery, batterySpec),
    wirelessCharging: parseWirelessCharging(batterySpec),
    removableBattery: parseRemovableBattery(batterySpec),
    batteryType: parseBatteryType(batterySpec, qsBattery),

    // Performance
    chipset,
    chipsetFamily: parseChipsetFamily(chipset),
    ram: parseRAM(qsRAM, memSpec),
    storage: parseStorage(qsStorage, memSpec),
    cpuCores: parseCPUCores(platformSpec),
    gpu: parseGPU(platformSpec),

    // Build
    ipRating: parseIPRating(bodySpec),
    bodyMaterial: parseBodyMaterial(bodySpec),
    weight: parseWeight(bodySpec),
    width: dims.w,
    height: dims.h,
    thickness: dims.d,

    // Connectivity
    has5G: parse5G(networkSpec),
    wifiStandard: parseWiFiStandard(commsSpec),
    nfc: parseNFC(commsSpec),
    bluetooth: parseBluetoothVersion(commsSpec),
    usbType: parseUSBType(commsSpec),
    has35mmJack: parse35mmJack(soundSpec),
    simType: parseSIMType(bodySpec),
    simCount: parseSIMCount(bodySpec),
    hasESIM: parseESIM(bodySpec),

    // Other
    fingerprintLocation: parseFingerprintLocation(featSpec),
    os,
    osFamily: parseOSFamily(os),
    formFactor: parseFormFactor(product, bodySpec),
    colors: parseColors(miscSpec),
    launchYear: parseLaunchYear(product.releaseDate, launchSpec),
    price: product.basePrice ?? null,
  };
}

// ─── Run ───────────────────────────────────────────────────────────────────

let enriched = 0;
let skipped = 0;

for (const product of products) {
  if (product.category !== "phone") {
    skipped++;
    continue;
  }
  product.filterSpecs = enrichProduct(product);
  enriched++;
}

writeFileSync(
  join(DATA_DIR, "products.json"),
  JSON.stringify(products, null, 2) + "\n",
  "utf-8"
);

console.log(`✅ Enriched ${enriched} phones, skipped ${skipped} non-phone products`);

// Print sample
const sample = products.find((p: any) => p.id === "galaxy-s26-ultra" || p.id === "iphone-17-pro-max");
if (sample) {
  console.log(`\nSample (${sample.name}):`);
  console.log(JSON.stringify(sample.filterSpecs, null, 2));
}
