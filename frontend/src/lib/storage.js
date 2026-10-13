// Persistence layer. Swap this file's implementation for real API calls
// (Firebase, Supabase, or your own REST backend) to get entries shared
// live across every inspecting officer's and EE's device — as shipped,
// everything lives in this browser's localStorage only, so two different
// phones will NOT see each other's entries. See the README for options.
const KEYS = {
  entries: "ghmc_entries",
  role: "ghmc_role",
  eeName: "ghmc_ee_name",
  assumptions: "ghmc_assumptions"
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable (private browsing) — fail silently,
    // the in-memory React state still works for this session.
  }
}

export function loadEntries() {
  return readJSON(KEYS.entries, []);
}
export function saveEntries(entries) {
  writeJSON(KEYS.entries, entries);
}

export function loadRole() {
  try {
    return localStorage.getItem(KEYS.role);
  } catch {
    return null;
  }
}
export function saveRole(role) {
  try {
    if (role) localStorage.setItem(KEYS.role, role);
    else localStorage.removeItem(KEYS.role);
  } catch {
    /* ignore */
  }
}

export function loadEEName() {
  try {
    return localStorage.getItem(KEYS.eeName) || "";
  } catch {
    return "";
  }
}
export function saveEEName(name) {
  try {
    localStorage.setItem(KEYS.eeName, name);
  } catch {
    /* ignore */
  }
}

export function loadAssumptions(defaults) {
  return readJSON(KEYS.assumptions, defaults);
}
export function saveAssumptions(assumptions) {
  writeJSON(KEYS.assumptions, assumptions);
}

// Compress+encode a photo File to a small base64 data URL so it can live
// inside a localStorage-backed entry. Real deployments should instead
// upload to object storage (S3, Firebase Storage, Cloudinary, ...) and
// store only the resulting URL — localStorage has a ~5-10MB total budget
// per browser, which a handful of full-size photos will blow through.
export function fileToCompressedDataURL(file, maxDim = 900, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
