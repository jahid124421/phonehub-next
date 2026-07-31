export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterDimension {
  id: string;
  label: string;
  type: "select" | "multiselect" | "range" | "toggle";
  options?: FilterOption[];
  range?: { min: number; max: number; step: number; unit: string };
  field: string;
  group: string;
}

export const FILTER_GROUPS: { id: string; label: string; icon: string }[] = [
  { id: "display", label: "Display", icon: "📱" },
  { id: "camera", label: "Camera", icon: "📸" },
  { id: "battery", label: "Battery", icon: "🔋" },
  { id: "performance", label: "Performance", icon: "⚡" },
  { id: "build", label: "Build & Design", icon: "🏗️" },
  { id: "connectivity", label: "Connectivity", icon: "📡" },
  { id: "other", label: "Other", icon: "⚙️" },
];

export const FILTER_DIMENSIONS: FilterDimension[] = [
  // ─── Display (7 filters) ──────────────────────────────────────────────────
  {
    id: "display-tech",
    label: "Display Technology",
    type: "multiselect",
    field: "displayTechnology",
    group: "display",
    options: [
      { value: "AMOLED", label: "AMOLED" },
      { value: "Super AMOLED", label: "Super AMOLED" },
      { value: "Dynamic AMOLED", label: "Dynamic AMOLED" },
      { value: "LTPO OLED", label: "LTPO OLED" },
      { value: "OLED", label: "OLED" },
      { value: "Super Retina XDR OLED", label: "Super Retina XDR" },
      { value: "IPS LCD", label: "IPS LCD" },
      { value: "LCD", label: "LCD" },
      { value: "TFT", label: "TFT" },
    ],
  },
  {
    id: "refresh-rate",
    label: "Refresh Rate",
    type: "select",
    field: "refreshRate",
    group: "display",
    options: [
      { value: 60, label: "60 Hz" },
      { value: 90, label: "90 Hz" },
      { value: 120, label: "120 Hz" },
      { value: 144, label: "144 Hz+" },
    ],
  },
  {
    id: "display-size",
    label: "Display Size",
    type: "range",
    field: "displaySize",
    group: "display",
    range: { min: 4, max: 8.5, step: 0.1, unit: "in" },
  },
  {
    id: "hdr-support",
    label: "HDR Support",
    type: "toggle",
    field: "hdr",
    group: "display",
  },
  {
    id: "display-resolution",
    label: "Resolution Class",
    type: "select",
    field: "displayResolution",
    group: "display",
    options: [
      { value: "HD+", label: "HD+ (720p)" },
      { value: "FHD+", label: "FHD+ (1080p)" },
      { value: "QHD+", label: "QHD+ (1440p)" },
      { value: "4K", label: "4K (2160p)" },
    ],
  },
  {
    id: "brightness",
    label: "Peak Brightness",
    type: "range",
    field: "brightnessNits",
    group: "display",
    range: { min: 300, max: 4500, step: 100, unit: "nits" },
  },
  {
    id: "display-has-refresh",
    label: "High Refresh Rate (90Hz+)",
    type: "toggle",
    field: "refreshRate",
    group: "display",
  },

  // ─── Camera (8 filters) ───────────────────────────────────────────────────
  {
    id: "main-camera-mp",
    label: "Main Camera (MP)",
    type: "range",
    field: "mainCameraMP",
    group: "camera",
    range: { min: 8, max: 200, step: 1, unit: "MP" },
  },
  {
    id: "camera-count",
    label: "Number of Cameras",
    type: "select",
    field: "cameraCount",
    group: "camera",
    options: [
      { value: 1, label: "1 camera" },
      { value: 2, label: "2 cameras" },
      { value: 3, label: "3 cameras" },
      { value: 4, label: "4+ cameras" },
    ],
  },
  {
    id: "ois",
    label: "Optical Image Stabilization",
    type: "toggle",
    field: "ois",
    group: "camera",
  },
  {
    id: "ultrawide",
    label: "Ultrawide Lens",
    type: "toggle",
    field: "ultrawide",
    group: "camera",
  },
  {
    id: "telephoto",
    label: "Telephoto Lens",
    type: "toggle",
    field: "telephoto",
    group: "camera",
  },
  {
    id: "video-resolution",
    label: "Max Video Resolution",
    type: "select",
    field: "videoResolution",
    group: "camera",
    options: [
      { value: "8K", label: "8K" },
      { value: "4K", label: "4K" },
      { value: "1440p", label: "1440p" },
      { value: "1080p", label: "1080p" },
    ],
  },
  {
    id: "flash-type",
    label: "Flash Type",
    type: "select",
    field: "flash",
    group: "camera",
    options: [
      { value: "Dual-LED", label: "Dual-LED" },
      { value: "LED", label: "LED" },
    ],
  },
  {
    id: "selfie-type",
    label: "Selfie Camera Type",
    type: "select",
    field: "selfieType",
    group: "camera",
    options: [
      { value: "Standard", label: "Standard" },
      { value: "Motorized", label: "Motorized / Pop-up" },
      { value: "Under-display", label: "Under-display" },
    ],
  },

  // ─── Battery (5 filters) ──────────────────────────────────────────────────
  {
    id: "battery-capacity",
    label: "Battery Capacity",
    type: "range",
    field: "batteryCapacity",
    group: "battery",
    range: { min: 2000, max: 7000, step: 100, unit: "mAh" },
  },
  {
    id: "charging-watt",
    label: "Charging Speed",
    type: "range",
    field: "chargingWatt",
    group: "battery",
    range: { min: 5, max: 240, step: 5, unit: "W" },
  },
  {
    id: "wireless-charging",
    label: "Wireless Charging",
    type: "toggle",
    field: "wirelessCharging",
    group: "battery",
  },
  {
    id: "removable-battery",
    label: "Removable Battery",
    type: "toggle",
    field: "removableBattery",
    group: "battery",
  },
  {
    id: "battery-type",
    label: "Battery Type",
    type: "select",
    field: "batteryType",
    group: "battery",
    options: [
      { value: "Li-Po", label: "Li-Po" },
      { value: "Li-Ion", label: "Li-Ion" },
    ],
  },

  // ─── Performance (7 filters) ──────────────────────────────────────────────
  {
    id: "chipset-family",
    label: "Chipset Family",
    type: "multiselect",
    field: "chipsetFamily",
    group: "performance",
    options: [
      { value: "Snapdragon", label: "Qualcomm Snapdragon" },
      { value: "MediaTek Dimensity", label: "MediaTek Dimensity" },
      { value: "Exynos", label: "Samsung Exynos" },
      { value: "Apple A-series", label: "Apple A-series" },
      { value: "Google Tensor", label: "Google Tensor" },
      { value: "MediaTek Helio", label: "MediaTek Helio" },
      { value: "Unisoc", label: "Unisoc" },
    ],
  },
  {
    id: "ram",
    label: "RAM",
    type: "select",
    field: "ram",
    group: "performance",
    options: [
      { value: 2, label: "2 GB" },
      { value: 3, label: "3 GB" },
      { value: 4, label: "4 GB" },
      { value: 6, label: "6 GB" },
      { value: 8, label: "8 GB" },
      { value: 12, label: "12 GB" },
      { value: 16, label: "16 GB+" },
    ],
  },
  {
    id: "storage",
    label: "Storage",
    type: "select",
    field: "storage",
    group: "performance",
    options: [
      { value: 32, label: "32 GB" },
      { value: 64, label: "64 GB" },
      { value: 128, label: "128 GB" },
      { value: 256, label: "256 GB" },
      { value: 512, label: "512 GB" },
      { value: 1024, label: "1 TB" },
      { value: 2048, label: "2 TB" },
    ],
  },
  {
    id: "cpu-cores",
    label: "CPU Cores",
    type: "select",
    field: "cpuCores",
    group: "performance",
    options: [
      { value: 4, label: "Quad-core" },
      { value: 6, label: "Hexa-core" },
      { value: 8, label: "Octa-core" },
      { value: 10, label: "Deca-core" },
    ],
  },
  {
    id: "has-gpu",
    label: "Dedicated GPU Info",
    type: "toggle",
    field: "gpu",
    group: "performance",
  },
  {
    id: "price-range",
    label: "Price",
    type: "range",
    field: "price",
    group: "performance",
    range: { min: 50, max: 3000, step: 50, unit: "$" },
  },
  {
    id: "chipset-name",
    label: "Chipset",
    type: "select",
    field: "chipset",
    group: "performance",
    options: [], // populated dynamically
  },

  // ─── Build & Design (6 filters) ───────────────────────────────────────────
  {
    id: "ip-rating",
    label: "IP Rating",
    type: "select",
    field: "ipRating",
    group: "build",
    options: [
      { value: "IP68", label: "IP68 (Submersible)" },
      { value: "IP67", label: "IP67 (Water resistant)" },
      { value: "IP66", label: "IP66" },
      { value: "IP65", label: "IP65" },
      { value: "IP64", label: "IP64 (Splash proof)" },
      { value: "IP54", label: "IP54" },
      { value: "IP53", label: "IP53" },
    ],
  },
  {
    id: "body-material",
    label: "Body Material",
    type: "multiselect",
    field: "bodyMaterial",
    group: "build",
    options: [
      { value: "Glass", label: "Glass" },
      { value: "Metal", label: "Metal / Aluminum" },
      { value: "Plastic", label: "Plastic / Polycarbonate" },
      { value: "Leather", label: "Leather / Vegan Leather" },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    type: "range",
    field: "weight",
    group: "build",
    range: { min: 120, max: 300, step: 5, unit: "g" },
  },
  {
    id: "width",
    label: "Width",
    type: "range",
    field: "width",
    group: "build",
    range: { min: 60, max: 90, step: 1, unit: "mm" },
  },
  {
    id: "height",
    label: "Height",
    type: "range",
    field: "height",
    group: "build",
    range: { min: 120, max: 180, step: 1, unit: "mm" },
  },
  {
    id: "thickness",
    label: "Thickness",
    type: "range",
    field: "thickness",
    group: "build",
    range: { min: 5, max: 14, step: 0.1, unit: "mm" },
  },

  // ─── Connectivity (9 filters) ─────────────────────────────────────────────
  {
    id: "has-5g",
    label: "5G Support",
    type: "toggle",
    field: "has5G",
    group: "connectivity",
  },
  {
    id: "wifi-standard",
    label: "Wi-Fi Standard",
    type: "select",
    field: "wifiStandard",
    group: "connectivity",
    options: [
      { value: "Wi-Fi 7", label: "Wi-Fi 7 (802.11be)" },
      { value: "Wi-Fi 6", label: "Wi-Fi 6 (802.11ax)" },
      { value: "Wi-Fi 5", label: "Wi-Fi 5 (802.11ac)" },
      { value: "Wi-Fi 4", label: "Wi-Fi 4 (802.11n)" },
    ],
  },
  {
    id: "nfc",
    label: "NFC",
    type: "toggle",
    field: "nfc",
    group: "connectivity",
  },
  {
    id: "bluetooth-version",
    label: "Bluetooth Version",
    type: "select",
    field: "bluetooth",
    group: "connectivity",
    options: [
      { value: 6, label: "Bluetooth 6.0" },
      { value: 5.4, label: "Bluetooth 5.4" },
      { value: 5.3, label: "Bluetooth 5.3" },
      { value: 5.2, label: "Bluetooth 5.2" },
      { value: 5.1, label: "Bluetooth 5.1" },
      { value: 5, label: "Bluetooth 5.0" },
      { value: 4.2, label: "Bluetooth 4.2" },
    ],
  },
  {
    id: "usb-type",
    label: "USB Type",
    type: "select",
    field: "usbType",
    group: "connectivity",
    options: [
      { value: "USB-C 3.x", label: "USB-C 3.x (fast)" },
      { value: "USB-C", label: "USB-C" },
      { value: "microUSB", label: "microUSB" },
      { value: "Lightning", label: "Lightning" },
    ],
  },
  {
    id: "has-35mm-jack",
    label: "3.5mm Headphone Jack",
    type: "toggle",
    field: "has35mmJack",
    group: "connectivity",
  },
  {
    id: "sim-type",
    label: "SIM Type",
    type: "select",
    field: "simType",
    group: "connectivity",
    options: [
      { value: "Nano-SIM + eSIM", label: "Nano-SIM + eSIM" },
      { value: "Nano-SIM", label: "Nano-SIM only" },
      { value: "eSIM", label: "eSIM only" },
    ],
  },
  {
    id: "sim-count",
    label: "SIM Count",
    type: "select",
    field: "simCount",
    group: "connectivity",
    options: [
      { value: 1, label: "Single SIM" },
      { value: 2, label: "Dual SIM" },
    ],
  },
  {
    id: "has-esim",
    label: "eSIM Support",
    type: "toggle",
    field: "hasESIM",
    group: "connectivity",
  },

  // ─── Other (6 filters) ────────────────────────────────────────────────────
  {
    id: "fingerprint-location",
    label: "Fingerprint Sensor",
    type: "select",
    field: "fingerprintLocation",
    group: "other",
    options: [
      { value: "under-display", label: "Under-display" },
      { value: "side-mounted", label: "Side-mounted" },
      { value: "rear", label: "Rear" },
      { value: "face-id", label: "Face ID (no fingerprint)" },
    ],
  },
  {
    id: "os-family",
    label: "Operating System",
    type: "multiselect",
    field: "osFamily",
    group: "other",
    options: [
      { value: "Android", label: "Android" },
      { value: "iOS", label: "iOS" },
      { value: "HarmonyOS", label: "HarmonyOS" },
    ],
  },
  {
    id: "form-factor",
    label: "Form Factor",
    type: "select",
    field: "formFactor",
    group: "other",
    options: [
      { value: "Standard", label: "Standard" },
      { value: "Foldable", label: "Foldable" },
      { value: "Clamshell", label: "Clamshell (Flip)" },
    ],
  },
  {
    id: "launch-year",
    label: "Launch Year",
    type: "select",
    field: "launchYear",
    group: "other",
    options: [
      { value: 2026, label: "2026" },
      { value: 2025, label: "2025" },
      { value: 2024, label: "2024" },
      { value: 2023, label: "2023" },
      { value: 2022, label: "2022" },
      { value: 2021, label: "2021" },
      { value: 2020, label: "2020 or earlier" },
    ],
  },
  {
    id: "has-ip-rating",
    label: "Water/Dust Resistant",
    type: "toggle",
    field: "ipRating",
    group: "other",
  },
  {
    id: "brand",
    label: "Brand",
    type: "multiselect",
    field: "brand",
    group: "other",
    options: [], // populated dynamically
  },
];

// Popular presets
export const POPULAR_PRESETS: Record<
  string,
  { label: string; description: string; filters: Record<string, unknown> }
> = {
  "best-camera": {
    label: "Best Camera Phones",
    description: "High MP main camera, OIS, telephoto & ultrawide",
    filters: { mainCameraMP: { min: 50 }, ois: true, telephoto: true, ultrawide: true },
  },
  gaming: {
    label: "Gaming Phones",
    description: "High refresh rate, powerful chipset, large battery",
    filters: { refreshRate: { min: 120 }, batteryCapacity: { min: 4500 }, chipsetFamily: ["Snapdragon", "MediaTek Dimensity"] },
  },
  "budget-kings": {
    label: "Budget Kings",
    description: "Great value under $400",
    filters: { price: { max: 400 } },
  },
  "flagship-killers": {
    label: "Flagship Killers",
    description: "Premium specs, mid-range price ($400–$800)",
    filters: { price: { min: 400, max: 800 }, refreshRate: { min: 120 }, has5G: true, mainCameraMP: { min: 50 } },
  },
  compact: {
    label: "Compact Phones",
    description: "Small and pocketable (< 6.3 inch, < 190g)",
    filters: { displaySize: { max: 6.3 }, weight: { max: 190 } },
  },
  "big-battery": {
    label: "Battery Beasts",
    description: "5000 mAh+ with fast charging",
    filters: { batteryCapacity: { min: 5000 }, chargingWatt: { min: 30 } },
  },
  foldable: {
    label: "Foldables",
    description: "Foldable and flip phones",
    filters: { formFactor: ["Foldable", "Clamshell"] },
  },
  "camera-zoom": {
    label: "Best Zoom Phones",
    description: "Telephoto lens with OIS",
    filters: { telephoto: true, ois: true },
  },
};

export function getFilterDimensionCount(): number {
  return FILTER_DIMENSIONS.length;
}
