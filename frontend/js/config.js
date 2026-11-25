// ============================================================================
// MedEduHub - Configuration, State & Utilities (js/config.js)
// ============================================================================

window.MedHub = window.MedHub || {};

// 1. DYNAMIC SUPABASE CONNECTION CONFIGURATION (SECURE: NO HARDCODED KEYS!)
// Credentials are loaded at runtime from Vercel Environment Variables (/api/config),
// window.__ENV__, or localStorage.
MedHub.supabaseUrl = "";
MedHub.supabaseAnonKey = "";
MedHub.supabaseClient = null;
MedHub.isLiveSupabase = false;

MedHub.loadConfig = async function () {
  let url = "";
  let key = "";

  // Priority 1: Fetch from Vercel Serverless Function (/api/config)
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data && data.supabaseUrl && data.supabaseAnonKey) {
        url = data.supabaseUrl;
        key = data.supabaseAnonKey;
      }
    }
  } catch (err) {
    // Expected when running offline or without backend server
  }

  // Priority 2: Injected window.__ENV__ (if present)
  if (!url && window.__ENV__ && window.__ENV__.SUPABASE_URL) {
    url = window.__ENV__.SUPABASE_URL;
    key = window.__ENV__.SUPABASE_ANON_KEY || window.__ENV__.SUPABASE_PUBLISHABLE_KEY || "";
  }

  // Priority 3: LocalStorage fallback (if set manually)
  if (!url) {
    url = localStorage.getItem("supabase_url") || "";
    key = localStorage.getItem("supabase_anon_key") || "";
  }

  if (url && key) {
    MedHub.supabaseUrl = url;
    MedHub.supabaseAnonKey = key;
    MedHub.initSupabaseClient(url, key);
  } else {
    MedHub.supabaseClient = null;
    MedHub.isLiveSupabase = false;
    MedHub.state.isLiveSupabase = false;
  }
};

MedHub.initSupabaseClient = function (customUrl, customKey) {
  const url = customUrl || MedHub.supabaseUrl;
  const key = customKey || MedHub.supabaseAnonKey;

  if (
    window.supabase &&
    typeof window.supabase.createClient === "function" &&
    url &&
    key
  ) {
    try {
      MedHub.supabaseClient = window.supabase.createClient(url, key);
      MedHub.supabaseUrl = url;
      MedHub.supabaseAnonKey = key;
      MedHub.isLiveSupabase = true;
    } catch (err) {
      console.warn("Supabase init error:", err);
      MedHub.supabaseClient = null;
      MedHub.isLiveSupabase = false;
    }
  } else {
    MedHub.supabaseClient = null;
    MedHub.isLiveSupabase = false;
  }
  MedHub.state.isLiveSupabase = MedHub.isLiveSupabase;
};

// 2. SVG ICONS
MedHub.icons = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  pos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20M12 15h5"/></svg>`,
  bills: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>`,
  medicines: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  purchases: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  suppliers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
  stethoscope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
};

// 3. STORE PROFILE & REACTIVE STATE
let storedStore = null;
try {
  storedStore = JSON.parse(
    localStorage.getItem("medhub_store_settings") ||
    localStorage.getItem("mededuhub_store_settings") ||
    "null"
  );
} catch (e) {}

MedHub.defaultStore = {
  store_name: "SAGAR MEDICAL STORE",
  tagline: "Retail & Wholesale Chemists",
  address: "Shop 4, Medical Plaza, Main Road",
  city: "New Delhi",
  state: "Delhi",
  pincode: "110001",
  phone: "9876543210",
  gstin: "",
  dl_no_20b: "DL-20B-123456",
  dl_no_21b: "DL-21B-654321",
  drug_license_no: "DL-20B-123456",
  fssai_no: "",
  upi_id: "sagarmedical@upi",
  bill_terms: "Dawai wapas nahi hogi. Get well soon!",
  bill_footer: "Dawai wapas nahi hogi. Get well soon!"
};

MedHub.state = {
  page: "billing",
  isAuthenticated: localStorage.getItem("medhub_authenticated") === "true",
  user: {
    email: localStorage.getItem("medhub_current_user") || "admin@mededuhub.com",
    role: localStorage.getItem("medhub_user_role") || "admin",
    name: localStorage.getItem("medhub_user_name") || "Dr. Anil Kumar"
  },
  store: storedStore || MedHub.defaultStore,
  cart: [],
  customer: { name: "", mobile: "", address: "" },
  doctor: { name: "", hospital: "" },
  paymentMode: "CASH",
  amountReceived: "",
  discount: 0,
  notes: "",
  inventoryTab: "all",
  searchSelectedIndex: -1,
  searchResults: [],
  categories: [
    { id: "c1", name: "Tablet" },
    { id: "c2", name: "Capsule" },
    { id: "c3", name: "Syrup" },
    { id: "c4", name: "Injection" },
    { id: "c5", name: "Ointment" },
    { id: "c6", name: "Drops" },
    { id: "c7", name: "Powder" },
    { id: "c8", name: "Sachet" },
    { id: "c9", name: "Inhaler" },
    { id: "c10", name: "Device" }
  ],
  companies: [
    { id: "co1", name: "Cipla" },
    { id: "co2", name: "Sun Pharma" },
    { id: "co3", name: "Micro Labs Ltd" },
    { id: "co4", name: "Abbott" },
    { id: "co5", name: "Dr. Reddy's" },
    { id: "co6", name: "Aristo" },
    { id: "co7", name: "Alkem" },
    { id: "co8", name: "Torrent" },
    { id: "co9", name: "Mankind Pharma" },
    { id: "co10", name: "Lupin" },
    { id: "co11", name: "Zydus Cadila" },
    { id: "co12", name: "Glenmark" },
    { id: "co13", name: "Intas" },
    { id: "co14", name: "GSK" },
    { id: "co15", name: "Pfizer" }
  ],
  drugSchedules: [
    { id: "ds1", name: "General (OTC / Non-Rx)" },
    { id: "ds2", name: "Schedule H" },
    { id: "ds3", name: "Schedule H1" },
    { id: "ds4", name: "Schedule C" },
    { id: "ds5", name: "Schedule C1" },
    { id: "ds6", name: "Schedule G" },
    { id: "ds7", name: "Schedule K" },
    { id: "ds8", name: "Schedule X" }
  ],
  isLiveSupabase: false
};

// Cleanly resolves the active store without overwriting explicitly empty optional fields with dummy defaults
MedHub.resolveActiveStore = function (apiStore) {
  const active = (apiStore && apiStore.store_name)
    ? apiStore
    : ((MedHub.state.store && MedHub.state.store.store_name) ? MedHub.state.store : MedHub.defaultStore);
  return {
    ...active,
    store_name: (active.store_name || MedHub.defaultStore.store_name).trim(),
    gstin: (active.gstin || "").trim().toUpperCase(),
    dl_no_20b: (active.dl_no_20b || active.drug_license_no || "").trim(),
    dl_no_21b: (active.dl_no_21b || "").trim(),
    drug_license_no: (active.drug_license_no || active.dl_no_20b || "").trim()
  };
};

// Formats store GSTIN & DL numbers accurately (no fake fallback values when omitted)
MedHub.formatStoreLicenses = function (store) {
  const s = store || {};
  const gstin = (s.gstin || "").trim().toUpperCase();
  const dl20 = (s.dl_no_20b || s.drug_license_no || "").trim();
  const dl21 = (s.dl_no_21b || "").trim();
  const dlParts = [];
  if (dl20) dlParts.push(dl20);
  if (dl21 && dl21.toLowerCase() !== dl20.toLowerCase()) dlParts.push(dl21);
  return {
    gstin,
    dl20,
    dl21,
    dlDisplay: dlParts.join(", ")
  };
};

// REAL-TIME STORE HEADER UPDATE (Screenshot 3 header banner)
MedHub.updateStoreHeader = function (storeData) {
  const isSuper = (MedHub.state.user && MedHub.state.user.role === "superadmin") || 
                  (localStorage.getItem("medhub_user_role") === "superadmin");
  const storeBadgeEl = document.getElementById("topbar-store-badge");

  if (isSuper) {
    if (storeBadgeEl) {
      storeBadgeEl.innerHTML = `
        <span class="store-badge-icon">${MedHub.icons.shield}</span>
        <span class="store-badge-name" style="color: #fbbf24; font-weight: 800;">DEVELOPER CONSOLE</span>
        <span class="store-badge-meta" style="color: #10b981; font-weight: 700;">🟢 Live Supabase Connected</span>
      `;
    }
    return;
  }

  if (storeData) {
    MedHub.state.store = { ...MedHub.state.store, ...storeData };
    try {
      const json = JSON.stringify(MedHub.state.store);
      localStorage.setItem("medhub_store_settings", json);
      localStorage.setItem("mededuhub_store_settings", json);
    } catch (e) {}
  }
  const s = MedHub.state.store;
  const lic = MedHub.formatStoreLicenses(s);
  if (storeBadgeEl) {
    storeBadgeEl.innerHTML = `
      <span class="store-badge-icon">${MedHub.icons.store}</span>
      <span class="store-badge-name">${s.store_name || "SAGAR MEDICAL STORE"}</span>
      ${lic.gstin ? `<span class="store-badge-meta">GSTIN: ${lic.gstin}</span>` : ""}
      ${lic.dlDisplay ? `<span class="store-badge-meta">D.L: ${lic.dlDisplay}</span>` : ""}
    `;
  }
};

// REAL-TIME USER & PHARMACIST BADGE UPDATE (Sidebar bottom avatar & name)
MedHub.getInitials = function (name) {
  if (!name || !name.trim()) return "DA";
  const clean = name.trim().replace(/^Dr\.\s*/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PH";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

MedHub.updateUserBadge = function (name, role) {
  if (name) {
    MedHub.state.user = MedHub.state.user || {};
    MedHub.state.user.name = name;
    if (role) MedHub.state.user.role = role;
    try {
      localStorage.setItem("medhub_user_name", name);
      if (role) localStorage.setItem("medhub_user_role", role);
    } catch (e) {}
  }
  const currentName = MedHub.state.user?.name || localStorage.getItem("medhub_user_name") || "Dr. Anil Kumar";
  const currentRole = MedHub.state.user?.role || localStorage.getItem("medhub_user_role") || "Pharmacist Admin";
  const initials = MedHub.getInitials(currentName);

  const avatarEl = document.querySelector(".sidebar-footer .user-avatar");
  const nameEl = document.querySelector(".sidebar-footer .user-name");
  const roleEl = document.querySelector(".sidebar-footer .user-role");

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl) nameEl.textContent = currentName;
  if (roleEl) roleEl.textContent = currentRole;
};

// WORLD-CLASS MEDICAL OS LOGO EMBLEM & BRAND TYPOGRAPHY
MedHub.renderLogo = function (size = 38) {
  return `
    <div class="brand-logo-emblem" style="width:${size}px;height:${size}px;flex-shrink:0;">
      <svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 10px rgba(236, 72, 153, 0.4)); overflow: visible;">
        <defs>
          <linearGradient id="medPillPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fb7185" />
            <stop offset="50%" stop-color="#ec4899" />
            <stop offset="100%" stop-color="#be185d" />
          </linearGradient>
          <linearGradient id="medPillWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="65%" stop-color="#f1f5f9" />
            <stop offset="100%" stop-color="#cbd5e1" />
          </linearGradient>
        </defs>
        <!-- Slanted 3D Precision Capsule -->
        <g transform="rotate(-38 22 22)">
          <!-- Top Cap (Vibrant Luxury Pink) -->
          <path d="M13 12 C13 5.5 17 2 22 2 C27 2 31 5.5 31 12 L31 21 L13 21 Z" fill="url(#medPillPink)" />
          <!-- Bottom Body (Pearl White) -->
          <path d="M13 23 L31 23 L31 32 C31 38.5 27 42 22 42 C17 42 13 38.5 13 32 Z" fill="url(#medPillWhite)" />
          <!-- Center Divider Band -->
          <rect x="12" y="20.5" width="20" height="2.5" rx="1" fill="#09090b" fill-opacity="0.3" />
          <!-- Specular Glare / 3D Reflection -->
          <path d="M15 7 C16.5 4.5 19 3.5 21 3.5 L21 20 L15 20 Z" fill="#ffffff" fill-opacity="0.45" />
          <path d="M15 24 L21 24 L21 39 C19 39 16.5 37.5 15 35 Z" fill="#ffffff" fill-opacity="0.3" />
        </g>
      </svg>
    </div>
    <div class="brand-text-wrap">
      <span class="brand-title">Med<span class="brand-title-edu">Edu</span><span class="brand-title-hub">Hub</span></span>
      <span class="brand-sub">
        <span class="brand-status-dot"></span> PHARMA OS <span class="brand-v-tag">v2.0</span>
      </span>
    </div>
  `;
};

// 4. UTILITIES
MedHub.rupee = function (val) {
  return "₹" + Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

MedHub.formatDate = function (dateStr) {
  if (!dateStr || dateStr === "—") return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
};

// Formats medicine expiry strictly as Month/Year (e.g. 11/28) without exact day or time
MedHub.formatExpiry = function (dateStr) {
  if (!dateStr || dateStr === "—" || dateStr === "null" || dateStr === "undefined") return "—";
  const str = String(dateStr).trim();
  if (/^\d{1,2}\/\d{2}$/.test(str)) return str;
  try {
    const sep = str.includes("-") ? "-" : (str.includes("/") ? "/" : null);
    if (sep) {
      const parts = str.split(sep);
      if (parts.length === 3) {
        // YYYY-MM-DD vs DD-MM-YYYY
        if (parts[0].length === 4) {
          return `${parts[1].padStart(2, "0")}/${parts[0].slice(-2)}`;
        } else if (parts[2].length === 4 || parts[2].length === 2) {
          return `${parts[1].padStart(2, "0")}/${parts[2].slice(-2)}`;
        }
      } else if (parts.length === 2) {
        // YYYY-MM or MM/YY
        if (parts[0].length === 4) {
          return `${parts[1].padStart(2, "0")}/${parts[0].slice(-2)}`;
        } else if (parts[1].length === 4 || parts[1].length === 2) {
          return `${parts[0].padStart(2, "0")}/${parts[1].slice(-2)}`;
        }
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const y = String(d.getFullYear()).slice(-2);
      return `${m}/${y}`;
    }
  } catch (e) {}
  return str;
};

// Parses YYYY-MM, YYYY-MM-DD, MM/YY, MM/YYYY into { month: "11", year: "2026" }
MedHub.parseMonthYear = function (dateStr) {
  if (!dateStr || dateStr === "—" || dateStr === "null" || dateStr === "undefined") {
    return { month: "", year: "" };
  }
  const str = String(dateStr).trim();
  const sep = str.includes("-") ? "-" : (str.includes("/") ? "/" : null);
  if (sep) {
    const parts = str.split(sep).map(p => p.trim());
    if (parts.length >= 2) {
      if (parts[0].length === 4) {
        return { month: parts[1].padStart(2, "0"), year: parts[0] };
      }
      if (parts[1].length === 4) {
        return { month: parts[0].padStart(2, "0"), year: parts[1] };
      }
      if (parts[1].length === 2 && parts.length === 2) {
        return { month: parts[0].padStart(2, "0"), year: `20${parts[1]}` };
      }
      if (parts.length === 3 && parts[2].length === 4) {
        return { month: parts[1].padStart(2, "0"), year: parts[2] };
      }
    }
  }
  return { month: "", year: "" };
};

// Clean Month & Year dual dropdown control (replaces browser <input type="month">)
MedHub.renderMonthYearPicker = function (idPrefix, currentVal = "", opts = {}) {
  const { month, year } = MedHub.parseMonthYear(currentVal);
  const nowYear = new Date().getFullYear();
  const baseYears = [];
  for (let y = nowYear - 1; y <= nowYear + 12; y++) {
    baseYears.push(String(y));
  }
  if (year && !baseYears.includes(year)) {
    baseYears.unshift(year);
    baseYears.sort();
  }

  const months = [
    { val: "01", short: "01", full: "01 - Jan" },
    { val: "02", short: "02", full: "02 - Feb" },
    { val: "03", short: "03", full: "03 - Mar" },
    { val: "04", short: "04", full: "04 - Apr" },
    { val: "05", short: "05", full: "05 - May" },
    { val: "06", short: "06", full: "06 - Jun" },
    { val: "07", short: "07", full: "07 - Jul" },
    { val: "08", short: "08", full: "08 - Aug" },
    { val: "09", short: "09", full: "09 - Sep" },
    { val: "10", short: "10", full: "10 - Oct" },
    { val: "11", short: "11", full: "11 - Nov" },
    { val: "12", short: "12", full: "12 - Dec" }
  ];

  const reqAttr = opts.required ? "required" : "";
  const compact = !!opts.compact;
  const mmCls = opts.mmClass ? `${opts.mmClass} expiry-my-select` : "input-field select-field expiry-my-select";
  const yyCls = opts.yyClass ? `${opts.yyClass} expiry-my-select` : "input-field select-field expiry-my-select";
  const dataAttr = opts.dataIdx !== undefined ? `data-idx="${opts.dataIdx}"` : "";

  return `
    <div class="expiry-my-wrap ${compact ? 'expiry-my-compact' : ''}">
      <select ${idPrefix ? `id="${idPrefix}-mm"` : ""} class="${mmCls}" ${dataAttr} ${reqAttr} title="Expiry Month (MM)">
        <option value="">MM</option>
        ${months.map(m => `<option value="${m.val}" ${month === m.val ? "selected" : ""}>${compact ? m.short : m.full}</option>`).join("")}
      </select>
      <span class="expiry-my-sep">/</span>
      <select ${idPrefix ? `id="${idPrefix}-yy"` : ""} class="${yyCls}" ${dataAttr} ${reqAttr} title="Expiry Year (YYYY)">
        <option value="">YYYY</option>
        ${baseYears.map(y => `<option value="${y}" ${year === y ? "selected" : ""}>${compact ? y.slice(-2) : y}</option>`).join("")}
      </select>
    </div>
  `;
};

MedHub.readMonthYearValue = function (idPrefix, rootEl) {
  const scope = rootEl || document;
  const mm = scope.querySelector(`#${idPrefix}-mm`)?.value?.trim() || "";
  const yy = scope.querySelector(`#${idPrefix}-yy`)?.value?.trim() || "";
  if (mm && yy) return `${yy}-${mm}`;
  return "";
};

MedHub.numberToWords = function (amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return "Rs. Zero only";

  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  }

  return "Rs. " + convert(num) + " only";
};

MedHub.toast = function (message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 3200);
};

MedHub.debounce = function (fn, ms = 250) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), ms);
  };
};

MedHub.exportToExcel = function (data, fileName, sheetName = "Data") {
  if (!data || !data.length) {
    MedHub.toast("Export karne ke liye koi data nahi hai", "warning");
    return;
  }
  if (window.XLSX && typeof window.XLSX.utils !== "undefined") {
    try {
      const ws = window.XLSX.utils.json_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, sheetName);
      window.XLSX.writeFile(wb, `${fileName}.xlsx`);
      MedHub.toast(`Excel downloaded: ${fileName}.xlsx`, "success");
      return;
    } catch (err) {
      console.warn("XLSX export error:", err);
    }
  }
  const keys = Object.keys(data[0]);
  const csvContent = "\uFEFF" + [
    keys.join(","),
    ...data.map((row) =>
      keys.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(",")
    )
  ].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  MedHub.toast(`CSV exported: ${fileName}.csv`, "success");
};

MedHub.exportToPdf = function (elementId, fileName) {
  const el = document.getElementById(elementId);
  if (!el) {
    MedHub.toast("Element nahi mila print/pdf ke liye", "error");
    return;
  }
  MedHub.toast("PDF generate ho raha hai...", "info");

  if (window.html2pdf) {
    // Clone element to offscreen unconstrained container so no modal scroll clips the footer!
    const clone = el.cloneNode(true);
    clone.id = elementId + "-pdf-render-clone";
    clone.style.width = "680px";
    clone.style.maxWidth = "680px";
    clone.style.height = "auto";
    clone.style.maxHeight = "none";
    clone.style.overflow = "visible";
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.background = "#ffffff";
    clone.style.zIndex = "99999";
    clone.style.margin = "0";
    clone.style.padding = "20px 24px";
    clone.style.boxSizing = "border-box";
    document.body.appendChild(clone);

    const opt = {
      margin: [4, 4, 6, 4],
      filename: `${fileName}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    let finished = false;
    const cleanup = () => {
      try { clone.remove(); } catch (e) {}
    };

    const safetyTimer = setTimeout(() => {
      if (!finished) {
        cleanup();
        console.warn("PDF generation timeout, opening print preview");
        window.print();
      }
    }, 4500);

    html2pdf().set(opt).from(clone).save().then(() => {
      finished = true;
      clearTimeout(safetyTimer);
      cleanup();
      MedHub.toast(`PDF download ho gaya: ${fileName}.pdf`, "success");
    }).catch(err => {
      finished = true;
      clearTimeout(safetyTimer);
      cleanup();
      console.warn("PDF export err:", err);
      MedHub.toast("Direct print dialog khol rahe hain...", "warning");
      window.print();
    });
  } else {
    window.print();
  }
};
