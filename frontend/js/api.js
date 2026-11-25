// ============================================================================
// MedEduHub - Supabase & Data Access Layer (js/api.js)
// ============================================================================

window.MedHub = window.MedHub || {};

// In-Memory / Local Cache Fallbacks (Ensures zero downtime & works offline)
let mockStore = {
  store_name: "MedEdu Pharmacy",
  address: "Shop 4, Medical Plaza, Main Road, Mumbai - 400001",
  phone: "9876543210",
  gstin: "27ABCDE1234F1Z5",
  drug_license_no: "MH-20-DL-12345",
  bill_footer: "Dawai wapas nahi hogi. Get well soon!",
  show_gst_breakup: false,
};

let mockMedicines = [
  { id: "1", name: "Dolo 650 Tablet", generic_name: "Paracetamol", company: "Micro Labs Ltd", salt_composition: "Paracetamol 650mg", category: "Tablet", drug_schedule: "General (OTC / Non-Rx)", pack_size: "1x15", barcode: "8901234567890", purchase_price: 24.50, selling_rate: 33.00, mrp: 35.00, gst_percent: 12, reorder_level: 20, rack_location: "A-01", available_qty: 180, nearest_expiry: "2027-12-31", status: "in" },
  { id: "2", name: "Azithromycin 500mg", generic_name: "Azithromycin", company: "Sun Pharma", salt_composition: "Azithromycin 500mg", category: "Tablet", drug_schedule: "Schedule H", pack_size: "1x3", barcode: "8902345678901", purchase_price: 88.00, selling_rate: 119.00, mrp: 126.00, gst_percent: 12, reorder_level: 15, rack_location: "B-04", available_qty: 84, nearest_expiry: "2027-09-15", status: "in" },
  { id: "3", name: "Amoxicillin 250mg", generic_name: "Amoxicillin", company: "Aristo", salt_composition: "Amoxicillin Trihydrate 250mg", category: "Capsule", drug_schedule: "Schedule H", pack_size: "1x10", barcode: "8903456789012", purchase_price: 52.00, selling_rate: 70.00, mrp: 74.00, gst_percent: 12, reorder_level: 10, rack_location: "B-09", available_qty: 36, nearest_expiry: "2026-12-25", status: "in" },
  { id: "4", name: "Cetirizine 10mg", generic_name: "Cetirizine", company: "Dr. Reddy’s", salt_composition: "Cetirizine Dihydrochloride 10mg", category: "Tablet", drug_schedule: "General (OTC / Non-Rx)", pack_size: "1x10", barcode: "8904567890123", purchase_price: 21.00, selling_rate: 30.00, mrp: 32.00, gst_percent: 12, reorder_level: 10, rack_location: "C-02", available_qty: 7, nearest_expiry: "2026-11-30", status: "low" },
  { id: "5", name: "Pantoprazole 40mg", generic_name: "Pantoprazole", company: "Alkem", salt_composition: "Pantoprazole Sodium 40mg", category: "Tablet", drug_schedule: "Schedule H", pack_size: "1x10", barcode: "8905678901234", purchase_price: 64.00, selling_rate: 86.00, mrp: 92.00, gst_percent: 12, reorder_level: 15, rack_location: "C-11", available_qty: 0, nearest_expiry: "—", status: "out" },
  { id: "6", name: "Alprazolam 0.5mg", generic_name: "Alprazolam", company: "Torrent", salt_composition: "Alprazolam 0.5mg", category: "Tablet", drug_schedule: "Schedule H1", pack_size: "1x10", barcode: "8906789012345", purchase_price: 28.00, selling_rate: 42.00, mrp: 45.00, gst_percent: 12, reorder_level: 10, rack_location: "Lock-01", available_qty: 50, nearest_expiry: "2027-08-30", status: "in" }
];

let mockBatches = [
  { id: "b-101", medicine_id: "1", batch_no: "DL-650-01", expiry_date: "2027-12-31", purchase_price: 24.50, selling_price: 33.00, quantity: 180 },
  { id: "b-102", medicine_id: "2", batch_no: "AZ-500-11", expiry_date: "2027-09-15", purchase_price: 88.00, selling_price: 119.00, quantity: 84 },
  { id: "b-103", medicine_id: "3", batch_no: "AM-250-05", expiry_date: "2026-12-25", purchase_price: 52.00, selling_price: 70.00, quantity: 36 },
  { id: "b-104", medicine_id: "4", batch_no: "CT-010-02", expiry_date: "2026-11-30", purchase_price: 21.00, selling_price: 30.00, quantity: 7 },
  { id: "b-105", medicine_id: "6", batch_no: "ALP-05-99", expiry_date: "2027-08-30", purchase_price: 28.00, selling_price: 42.00, quantity: 50 }
];

let mockBills = [
  {
    id: "bill-001",
    bill_no: 101,
    bill_date: new Date().toISOString(),
    customer_name: "Ramesh Verma",
    customer_mobile: "9845123067",
    patient_address: "House 42, Civil Lines, Delhi",
    doctor_name: "Dr. Rajesh Sharma",
    doctor_hospital: "Apex City Hospital",
    subtotal: 330.00,
    discount: 0,
    grand_total: 330.00,
    paid_amount: 330.00,
    due_amount: 0,
    payment_status: "PAID",
    payment_mode: "UPI",
    is_cancelled: false,
    items: [
      { medicine_name: "Dolo 650 Tablet", batch_no: "DL-650-01", expiry_date: "2027-12-31", quantity: 10, rate: 33.00, line_total: 330.00, drug_schedule: "General (OTC / Non-Rx)" }
    ]
  }
];

let mockSuppliers = [
  { id: "sup-1", name: "Sun Pharma Distributors", phone: "9811223344", gstin: "27AABCS1429B1Z1", dl_no: "MH-MZ2-102938", address: "Bhiwandi Pharma Hub, Thane", balance: 0.00 },
  { id: "sup-2", name: "Cipla Care Logistics", phone: "9822334455", gstin: "27AABCC1234F1Z9", dl_no: "MH-MZ2-203948", address: "Kurla West, Mumbai", balance: 14500.00 },
  { id: "sup-3", name: "Abbott Healthcare Depot", phone: "9833445566", gstin: "27AABCA5678G1Z2", dl_no: "MH-MZ2-304958", address: "Andheri East, Mumbai", balance: 0.00 }
];

let mockPurchases = [
  { id: "pur-1", invoice_no: "INV-2026-901", supplier_name: "Sun Pharma Distributors", purchase_date: new Date().toISOString().slice(0, 10), total_amount: 14200.00, paid_amount: 14200.00, status: "RECEIVED" }
];

MedHub.api = {
  // 1. STORE SETTINGS (Per-Store / Per-User with Supabase & LocalStorage)
  async getStoreSettings(userEmailOrUser) {
    let targetEmail = "";
    let targetUsername = "";
    let targetStoreId = null;
    let targetName = "";

    if (typeof userEmailOrUser === "object" && userEmailOrUser !== null) {
      targetEmail = userEmailOrUser.email || "";
      targetUsername = userEmailOrUser.username || "";
      targetStoreId = userEmailOrUser.store_id || null;
      targetName = userEmailOrUser.name || userEmailOrUser.full_name || "";
    } else if (typeof userEmailOrUser === "string") {
      targetEmail = userEmailOrUser;
      targetUsername = userEmailOrUser.includes("@") ? userEmailOrUser.split("@")[0] : userEmailOrUser;
    } else {
      targetEmail = MedHub.state.user?.email || localStorage.getItem("medhub_current_user") || "";
      targetUsername = MedHub.state.user?.username || "";
    }

    targetEmail = (targetEmail || "").toLowerCase().trim();
    targetUsername = (targetUsername || "").toLowerCase().trim();

    // 1. Check local per-user cache
    let localStore = null;
    if (targetEmail) {
      try {
        const ls = localStorage.getItem("medhub_store_" + targetEmail);
        if (ls) localStore = JSON.parse(ls);
      } catch (e) {}
    }
    if (!localStore && targetUsername) {
      try {
        const ls = localStorage.getItem("medhub_store_" + targetUsername);
        if (ls) localStore = JSON.parse(ls);
      } catch (e) {}
    }

    // 2. Check Supabase Live Database
    let cloudStore = null;
    if (MedHub.supabaseClient) {
      try {
        // Priority A: Match by store_id if known
        if (targetStoreId) {
          const { data } = await MedHub.supabaseClient
            .from("store_settings")
            .select("*")
            .eq("id", targetStoreId)
            .maybeSingle();
          if (data) cloudStore = data;
        }

        // Priority B: Match by user_email
        if (!cloudStore && targetEmail) {
          const { data } = await MedHub.supabaseClient
            .from("store_settings")
            .select("*")
            .eq("user_email", targetEmail)
            .maybeSingle();
          if (data) cloudStore = data;
        }

        // Priority C: Match by username or pharmacist_name
        if (!cloudStore && (targetUsername || targetName)) {
          const { data } = await MedHub.supabaseClient
            .from("store_settings")
            .select("*")
            .or(`user_email.ilike.%${targetUsername}%,pharmacist_name.ilike.%${targetName || targetUsername}%`)
            .maybeSingle();
          if (data) cloudStore = data;
        }

        // Priority D: Fallback to the primary configured store in Supabase
        if (!cloudStore) {
          const { data } = await MedHub.supabaseClient
            .from("store_settings")
            .select("*")
            .order("id", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (data) cloudStore = data;
        }
      } catch (e) {
        console.warn("Store settings fetch error:", e);
      }
    }

    let found = cloudStore || localStore;
    if (!found) {
      const all = this._getAllLocalStores();
      found = all.find(s => 
        (targetEmail && s.user_email?.toLowerCase() === targetEmail) || 
        (targetUsername && s.username?.toLowerCase() === targetUsername) ||
        (targetStoreId && String(s.id) === String(targetStoreId))
      ) || all[0] || mockStore;
    }

    if (found) {
      if (targetEmail) {
        try {
          const json = JSON.stringify(found);
          localStorage.setItem("medhub_store_" + targetEmail, json);
          localStorage.setItem("medhub_store_settings", json);
          localStorage.setItem("mededuhub_store_settings", json);
        } catch (e) {}
      }
      MedHub.state.store = found;
      return found;
    }

    return null;
  },

  async saveStoreSettings(settings, userEmail) {
    const email = (userEmail || MedHub.state.user?.email || localStorage.getItem("medhub_current_user") || "admin@mededuhub.com").toLowerCase().trim();

    const merged = {
      ...(MedHub.state.store || {}),
      ...settings,
      user_email: email,
      updated_at: new Date().toISOString()
    };
    if (merged.gstin !== undefined) {
      merged.gstin = String(merged.gstin || "").trim().toUpperCase();
    }
    if (merged.dl_no_20b !== undefined) {
      merged.dl_no_20b = String(merged.dl_no_20b || "").trim();
      merged.drug_license_no = merged.dl_no_20b;
    }
    if (merged.dl_no_21b !== undefined) {
      merged.dl_no_21b = String(merged.dl_no_21b || "").trim();
    }

    // 1. Save to local per-store and active cache
    try {
      const json = JSON.stringify(merged);
      localStorage.setItem("medhub_store_" + email, json);
      localStorage.setItem("medhub_store_settings", json);
      localStorage.setItem("mededuhub_store_settings", json);
      localStorage.setItem("medhub_current_user", email);

      // Sync to all stores directory for Master Admin
      let allStores = this._getAllLocalStores();
      const existingIdx = allStores.findIndex(s => s.user_email?.toLowerCase() === email || s.id === merged.id);
      if (existingIdx >= 0) {
        allStores[existingIdx] = { ...allStores[existingIdx], ...merged };
      } else {
        allStores.push(merged);
      }
      this._saveAllLocalStores(allStores);
    } catch (e) {}
    mockStore = merged;
    MedHub.state.store = merged;

    // 2. Persist to Supabase Database with strict schema sanitization
    if (MedHub.supabaseClient) {
      try {
        const allowedCols = [
          "store_name", "address", "phone", "gstin", "drug_license_no", 
          "bill_footer", "show_gst_breakup", "tagline", "city", "state", 
          "pincode", "dl_no_20b", "dl_no_21b", "fssai_no", "upi_id", 
          "payee_name", "custom_qr_image", "bill_terms", "user_email", 
          "pharmacist_name", "last_login_user", "last_login_at", "status", "updated_at"
        ];
        const dbPayload = {};
        for (const col of allowedCols) {
          if (merged[col] !== undefined) {
            dbPayload[col] = merged[col];
          }
        }
        dbPayload.updated_at = new Date().toISOString();

        // Check if row exists by integer id OR user_email
        let existingId = null;
        if (typeof merged.id === "number" && !isNaN(merged.id)) {
          existingId = merged.id;
        } else {
          const { data: existing } = await MedHub.supabaseClient
            .from("store_settings")
            .select("id")
            .eq("user_email", email)
            .maybeSingle();
          if (existing && existing.id) existingId = existing.id;
        }

        if (existingId) {
          const { error: updErr } = await MedHub.supabaseClient
            .from("store_settings")
            .update(dbPayload)
            .eq("id", existingId);
          if (updErr) console.warn("Supabase store_settings update error:", updErr);
        } else {
          const { data: inserted, error: insErr } = await MedHub.supabaseClient
            .from("store_settings")
            .insert(dbPayload)
            .select()
            .maybeSingle();
          if (!insErr && inserted && inserted.id) {
            merged.id = inserted.id;
          }
          if (insErr) console.warn("Supabase store_settings insert error:", insErr);
        }
      } catch (e) {
        console.warn("Store settings save error:", e);
      }
    }
    return true;
  },

  // Master Admin Credentials & All Stores Directory
  _getMasterAdminCredentials() {
    try {
      const ls = localStorage.getItem("medhub_master_admin");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (parsed.username && parsed.password) return parsed;
      }
    } catch (e) {}
    const defaultMaster = {
      username: "masteradmin",
      password: "superpassword123",
      role: "superadmin",
      name: "Platform Master Administrator",
      email: "masteradmin@mededuhub.com"
    };
    try {
      localStorage.setItem("medhub_master_admin", JSON.stringify(defaultMaster));
    } catch (e) {}
    return defaultMaster;
  },

  _saveMasterAdminCredentials(creds) {
    try {
      localStorage.setItem("medhub_master_admin", JSON.stringify(creds));
    } catch (e) {}
  },

  _getAllLocalStores() {
    try {
      const ls = localStorage.getItem("medhub_all_stores");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const initialStores = [
      {
        id: "store-001",
        store_name: "MedEdu Pharmacy",
        pharmacist_name: "Dr. Anil Kumar",
        username: "admin",
        user_email: "admin@mededuhub.com",
        phone: "9876543210",
        address: "Shop 4, Medical Plaza, Main Road, Mumbai - 400001",
        gstin: "27ABCDE1234F1Z5",
        dl_no_20b: "MH-20-DL-12345",
        dl_no_21b: "DL-21B-654321",
        drug_license_no: "MH-20-DL-12345",
        fssai_no: "10012345678901",
        upi_id: "sagarstore@upi",
        status: "active",
        created_at: "2026-01-15T10:00:00Z"
      },
      {
        id: "store-002",
        store_name: "Sagar Medical Store",
        pharmacist_name: "Sagar Sharma",
        username: "sagar",
        user_email: "sagar@mededuhub.com",
        phone: "9811223344",
        address: "Shop 12, Gandhi Chowk, Bhagalpur - 812001",
        gstin: "10ABCDE1234F1Z1",
        dl_no_20b: "BR-20-DL-98765",
        dl_no_21b: "BR-21-DL-54321",
        drug_license_no: "BR-20-DL-98765",
        fssai_no: "10098765432109",
        upi_id: "sagarstore@upi",
        status: "active",
        created_at: "2026-02-10T14:30:00Z"
      },
      {
        id: "store-003",
        store_name: "Apex Chemist & Druggist",
        pharmacist_name: "Rajesh Verma",
        username: "apex",
        user_email: "apex@mededuhub.com",
        phone: "9822334455",
        address: "Plot 8, Civil Lines, New Delhi - 110054",
        gstin: "07AABCA5678G1Z2",
        dl_no_20b: "DL-20B-112233",
        dl_no_21b: "DL-21B-445566",
        drug_license_no: "DL-20B-112233",
        fssai_no: "10055443322110",
        upi_id: "apexchemist@okhdfcbank",
        status: "active",
        created_at: "2026-03-01T09:15:00Z"
      }
    ];
    try {
      localStorage.setItem("medhub_all_stores", JSON.stringify(initialStores));
    } catch (e) {}
    return initialStores;
  },

  _saveAllLocalStores(stores) {
    try {
      localStorage.setItem("medhub_all_stores", JSON.stringify(stores));
    } catch (e) {}
  },

  async getAllStores() {
    let cloudStores = [];
    let cloudUsers = [];
    if (MedHub.supabaseClient) {
      try {
        const [storesRes, usersRes] = await Promise.all([
          MedHub.supabaseClient.from("store_settings").select("*").order("id", { ascending: true }),
          MedHub.supabaseClient.from("authorized_users").select("*").order("id", { ascending: true })
        ]);
        if (!storesRes.error && storesRes.data) cloudStores = storesRes.data;
        if (!usersRes.error && usersRes.data) cloudUsers = usersRes.data;
      } catch (e) {
        console.warn("getAllStores Supabase error:", e);
      }
    }

    const localStores = this._getAllLocalStores();
    const localUsers = this._getLocalUsers();
    const allUsers = [...cloudUsers, ...localUsers];

    // Combined unique stores
    const mergedList = [...cloudStores];

    localStores.forEach(ls => {
      if (!mergedList.some(s => 
        (s.id && String(s.id) === String(ls.id)) || 
        (s.user_email && ls.user_email && s.user_email.toLowerCase() === ls.user_email.toLowerCase())
      )) {
        mergedList.push(ls);
      }
    });

    // Attach user status, real-time login activity & contact
    mergedList.forEach(s => {
      const email = s.user_email?.toLowerCase();
      const user = allUsers.find(u => 
        (s.id && u.store_id === s.id) || 
        (u.email && email && u.email.toLowerCase() === email) || 
        (u.username && email && u.username.toLowerCase() === email) ||
        (u.username && s.username && u.username.toLowerCase() === s.username.toLowerCase())
      );
      if (user) {
        s.username = user.username || s.username || (email ? email.split("@")[0] : "pharmacist");
        s.pharmacist_name = s.pharmacist_name || user.full_name || "Pharmacist In-Charge";
        s.last_login_at = s.last_login_at || user.last_login_at || null;
        s.last_login_user = s.last_login_user || user.username || null;
        if (!s.status) s.status = user.status || "active";
      } else {
        if (!s.status) s.status = "active";
        if (!s.username) s.username = s.user_email ? s.user_email.split("@")[0] : "pharmacist";
      }
    });

    this._saveAllLocalStores(mergedList);
    return mergedList;
  },

  async createStoreAdmin(storePayload, userCredentials) {
    const email = (storePayload.user_email || `${userCredentials.username}@mededuhub.com`).toLowerCase().trim();
    const newStore = {
      ...storePayload,
      user_email: email,
      status: "active",
      created_at: new Date().toISOString()
    };

    // 1. Save store settings to Supabase and LocalStorage
    await this.saveStoreSettings(newStore, email);

    // 2. Create user login credentials in Supabase and LocalStorage
    if (userCredentials && userCredentials.username && userCredentials.password) {
      await this.createAuthorizedUser({
        username: userCredentials.username,
        email: email,
        password: userCredentials.password,
        full_name: storePayload.pharmacist_name || storePayload.store_name,
        role: "admin",
        status: "active",
        store_id: newStore.id,
        store_name: storePayload.store_name
      });
    }

    // 3. Save to all stores directory
    const all = this._getAllLocalStores();
    all.unshift(newStore);
    this._saveAllLocalStores(all);

    return newStore;
  },

  async updateStoreAdmin(userEmailOrId, updatedData) {
    const all = this._getAllLocalStores();
    const idx = all.findIndex(s => 
      String(s.id) === String(userEmailOrId) || 
      s.user_email?.toLowerCase() === String(userEmailOrId).toLowerCase()
    );

    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updatedData, updated_at: new Date().toISOString() };
      this._saveAllLocalStores(all);

      const email = all[idx].user_email;
      if (email) {
        try {
          localStorage.setItem("medhub_store_" + email.toLowerCase(), JSON.stringify(all[idx]));
        } catch (e) {}
      }

      // Update Supabase if available
      if (MedHub.supabaseClient && all[idx].id) {
        try {
          await MedHub.supabaseClient
            .from("store_settings")
            .update(all[idx])
            .eq("user_email", email);
        } catch (e) {}
      }
      return all[idx];
    }
    return null;
  },

  async setStoreStatus(userEmailOrId, status) {
    const key = String(userEmailOrId).toLowerCase().trim();
    const all = this._getAllLocalStores();
    const idx = all.findIndex(s => 
      String(s.id).toLowerCase() === key || 
      s.user_email?.toLowerCase() === key ||
      s.username?.toLowerCase() === key ||
      (s.user_email && s.user_email.toLowerCase().startsWith(key + "@"))
    );

    if (idx >= 0) {
      all[idx].status = status;
      this._saveAllLocalStores(all);

      // Also update in authorized_users
      const users = this._getLocalUsers();
      const targetEmail = all[idx].user_email?.toLowerCase();
      const targetUsername = all[idx].username?.toLowerCase();
      const uIdx = users.findIndex(u => 
        u.email?.toLowerCase() === targetEmail || 
        u.username?.toLowerCase() === targetUsername ||
        u.username?.toLowerCase() === key ||
        u.email?.toLowerCase() === key ||
        (u.email && u.email.toLowerCase().startsWith(key + "@"))
      );
      if (uIdx >= 0) {
        users[uIdx].status = status;
        this._saveLocalUsers(users);
      }

      if (MedHub.supabaseClient) {
        try {
          await MedHub.supabaseClient
            .from("store_settings")
            .update({ status: status })
            .eq("user_email", all[idx].user_email);
          await MedHub.supabaseClient
            .from("authorized_users")
            .update({ status: status })
            .eq("email", all[idx].user_email);
        } catch (e) {}
      }
      return true;
    } else {
      // If store is not yet in directory list, update directly in authorized users
      const users = this._getLocalUsers();
      const uIdx = users.findIndex(u => 
        u.username?.toLowerCase() === key ||
        u.email?.toLowerCase() === key ||
        (u.email && u.email.toLowerCase().startsWith(key + "@"))
      );
      if (uIdx >= 0) {
        users[uIdx].status = status;
        this._saveLocalUsers(users);
        return true;
      }
    }
    return false;
  },

  async resetStorePassword(usernameOrEmail, newPassword) {
    const clean = usernameOrEmail.toLowerCase().trim();
    const users = this._getLocalUsers();
    const u = users.find(u => u.username?.toLowerCase() === clean || u.email?.toLowerCase() === clean);
    if (u) {
      u.password = newPassword.trim();
      this._saveLocalUsers(users);

      if (MedHub.supabaseClient) {
        try {
          await MedHub.supabaseClient
            .from("authorized_users")
            .update({ password: newPassword.trim() })
            .or(`username.ilike.${clean},email.ilike.${clean}`);
        } catch (e) {}
      }
      return true;
    }
    return false;
  },

  async deleteStore(userEmailOrId) {
    let all = this._getAllLocalStores();
    const store = all.find(s => String(s.id) === String(userEmailOrId) || s.user_email?.toLowerCase() === String(userEmailOrId).toLowerCase());
    if (store) {
      all = all.filter(s => s !== store);
      this._saveAllLocalStores(all);

      try {
        localStorage.removeItem("medhub_store_" + store.user_email?.toLowerCase());
      } catch (e) {}

      // Delete from authorized users
      let users = this._getLocalUsers();
      users = users.filter(u => u.email?.toLowerCase() !== store.user_email?.toLowerCase() && u.username !== store.username);
      this._saveLocalUsers(users);

      if (MedHub.supabaseClient) {
        try {
          await MedHub.supabaseClient.from("store_settings").delete().eq("user_email", store.user_email);
          await MedHub.supabaseClient.from("authorized_users").delete().eq("email", store.user_email);
        } catch (e) {}
      }
      return true;
    }
    return false;
  },

  // Helper for offline & per-user local storage
  _getLocalUsers() {
    try {
      const ls = localStorage.getItem("medhub_authorized_users");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 1, username: "admin", email: "admin@mededuhub.com", password: "admin123", full_name: "Dr. Anil Kumar", role: "admin", status: "active" }
    ];
  },

  _saveLocalUsers(users) {
    try {
      localStorage.setItem("medhub_authorized_users", JSON.stringify(users));
    } catch (e) {}
  },

  // 1.5. AUTHORIZED USERS & AUTHENTICATION
  // Supports Store Pharmacist Login & Master Admin Super Portal
  async authenticateUser(usernameOrEmail, password, portalMode = "store") {
    if (!usernameOrEmail || !password) {
      return { success: false, message: "Please provide both username/email and password." };
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@mededuhub.com`;

    // 1. CHECK MASTER ADMIN CREDENTIALS
    const masterAdmin = this._getMasterAdminCredentials();
    const isMasterUser = (cleanInput === masterAdmin.username.toLowerCase() || cleanInput === masterAdmin.email.toLowerCase());
    const isMasterPass = (cleanPass === masterAdmin.password);

    if (portalMode === "superadmin") {
      // Must match Master Admin credentials
      if (isMasterUser && isMasterPass) {
        return {
          success: true,
          isSuperAdmin: true,
          isNew: false,
          user: {
            id: "superadmin-root",
            username: masterAdmin.username,
            email: masterAdmin.email,
            name: masterAdmin.name || "Platform Master Administrator",
            role: "superadmin"
          }
        };
      } else {
        return {
          success: false,
          message: "🚫 Unauthorized: Invalid Master Admin Username or Security Key. Access restricted to Platform Owner."
        };
      }
    }

    // If logging in via standard store login with Master Admin credentials:
    if (isMasterUser && isMasterPass) {
      return {
        success: true,
        isSuperAdmin: true,
        isNew: false,
        user: {
          id: "superadmin-root",
          username: masterAdmin.username,
          email: masterAdmin.email,
          name: masterAdmin.name || "Platform Master Administrator",
          role: "superadmin"
        }
      };
    }

    // 2. CHECK IF STORE ACCOUNT IS SUSPENDED
    const allStores = this._getAllLocalStores();
    const matchedStore = allStores.find(s => 
      s.user_email?.toLowerCase() === cleanEmail || 
      s.user_email?.toLowerCase() === cleanInput ||
      s.username?.toLowerCase() === cleanInput
    );
    if (matchedStore && matchedStore.status === "suspended") {
      return {
        success: false,
        message: `🚫 Store Suspended: Your store account "${matchedStore.store_name || cleanInput}" has been suspended by the Master Administrator. Contact support.`
      };
    }

    // 3. Check Supabase Database for Store Pharmacist
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("authorized_users")
          .select("*")
          .or(`username.ilike.${cleanInput},email.ilike.${cleanInput}`)
          .maybeSingle();

        if (!error && data) {
          if (data.status === "suspended") {
            return {
              success: false,
              message: "🚫 Store Suspended: Your store account has been deactivated by the Master Administrator."
            };
          }
          if (data.password === cleanPass) {
            // Real-time update last_login_at in Supabase authorized_users
            try {
              await MedHub.supabaseClient
                .from("authorized_users")
                .update({ 
                  last_login_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq("id", data.id);
            } catch (err) {}

            // Find associated store in Supabase store_settings
            let matchedStore = null;
            if (data.store_id) {
              const { data: stById } = await MedHub.supabaseClient
                .from("store_settings")
                .select("*")
                .eq("id", data.store_id)
                .maybeSingle();
              if (stById) matchedStore = stById;
            }
            if (!matchedStore && data.email) {
              const { data: stByEmail } = await MedHub.supabaseClient
                .from("store_settings")
                .select("*")
                .eq("user_email", data.email.toLowerCase().trim())
                .maybeSingle();
              if (stByEmail) matchedStore = stByEmail;
            }
            if (!matchedStore) {
              const { data: stByUsername } = await MedHub.supabaseClient
                .from("store_settings")
                .select("*")
                .or(`user_email.ilike.%${data.username}%,pharmacist_name.ilike.%${data.full_name || data.username}%`)
                .maybeSingle();
              if (stByUsername) matchedStore = stByUsername;
            }
            if (!matchedStore) {
              // Fallback to primary registered store in Supabase
              const { data: stFallback } = await MedHub.supabaseClient
                .from("store_settings")
                .select("*")
                .order("id", { ascending: true })
                .limit(1)
                .maybeSingle();
              if (stFallback) matchedStore = stFallback;
            }

            // Real-time update store_settings in Supabase with last_login_user and last_login_at
            if (matchedStore && matchedStore.id) {
              try {
                await MedHub.supabaseClient
                  .from("store_settings")
                  .update({
                    last_login_user: data.username,
                    last_login_at: new Date().toISOString()
                  })
                  .eq("id", matchedStore.id);
              } catch (err) {}
            }

            return {
              success: true,
              isNew: false,
              user: {
                id: data.id,
                username: data.username,
                email: data.email || (matchedStore ? matchedStore.user_email : cleanEmail),
                name: data.full_name || data.username,
                role: data.role || "admin",
                store_id: matchedStore ? matchedStore.id : data.store_id,
                store_name: matchedStore ? matchedStore.store_name : data.store_name
              },
              store: matchedStore
            };
          } else {
            return {
              success: false,
              message: `Incorrect password for user "${cleanInput}". Please check your password.`
            };
          }
        }
      } catch (e) {
        console.warn("Supabase auth check error:", e);
      }
    }

    // 4. Check local users cache
    const localUsers = this._getLocalUsers();
    const existingLocal = localUsers.find(
      u => u.username?.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput
    );

    if (existingLocal) {
      if (existingLocal.status === "suspended") {
        return {
          success: false,
          message: "🚫 Store Suspended: Your store account has been deactivated by the Master Administrator."
        };
      }
      if (
        existingLocal.password === cleanPass ||
        (cleanInput === "admin" && (cleanPass === "123456" || cleanPass === "admin123"))
      ) {
        const localMatchedStore = this._getAllLocalStores().find(s => 
          s.user_email?.toLowerCase() === existingLocal.email?.toLowerCase() || 
          s.username?.toLowerCase() === existingLocal.username?.toLowerCase()
        ) || this._getAllLocalStores()[0];

        return {
          success: true,
          isNew: false,
          user: {
            id: existingLocal.id,
            username: existingLocal.username,
            email: existingLocal.email || cleanEmail,
            name: existingLocal.full_name || existingLocal.username,
            role: existingLocal.role || "admin",
            store_id: localMatchedStore ? localMatchedStore.id : null,
            store_name: localMatchedStore ? localMatchedStore.store_name : null
          },
          store: localMatchedStore
        };
      } else {
        return {
          success: false,
          message: `Incorrect password for user "${cleanInput}". Please check your password.`
        };
      }
    }

    // 5. Root admin credentials fallback
    if (
      (cleanInput === "admin" || cleanInput === "admin@mededuhub.com") &&
      (cleanPass === "123456" || cleanPass === "admin123")
    ) {
      return {
        success: true,
        isNew: false,
        user: {
          username: "admin",
          email: "admin@mededuhub.com",
          name: "Dr. Anil Kumar",
          role: "admin"
        }
      };
    }

    // 6. NEW USER: Auto-register new pharmacist account!
    const newUser = {
      id: Date.now(),
      username: cleanInput,
      email: cleanEmail,
      password: cleanPass,
      full_name: cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1),
      role: "admin",
      status: "active",
      created_at: new Date().toISOString()
    };

    localUsers.push(newUser);
    this._saveLocalUsers(localUsers);

    if (MedHub.supabaseClient) {
      try {
        const { data: dbUser } = await MedHub.supabaseClient
          .from("authorized_users")
          .upsert({
            username: cleanInput,
            email: cleanEmail,
            password: cleanPass,
            full_name: newUser.full_name,
            role: "admin",
            status: "active",
            updated_at: new Date().toISOString()
          }, { onConflict: "username" })
          .select()
          .maybeSingle();

        if (dbUser && dbUser.id) {
          newUser.id = dbUser.id;
        }
      } catch (e) {
        console.warn("Could not insert new user to Supabase:", e);
      }
    }

    return {
      success: true,
      isNew: true,
      user: newUser
    };
  },

  async getAuthorizedUsers() {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("authorized_users")
          .select("id, username, email, full_name, role, status, created_at")
          .order("id", { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn("Get authorized users error:", e);
      }
    }
    return this._getLocalUsers().map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      status: u.status,
      created_at: u.created_at
    }));
  },

  async createAuthorizedUser(user) {
    if (!user || !user.username || !user.password) return null;
    const cleanUser = {
      username: user.username.trim().toLowerCase(),
      email: (user.email || user.username).trim().toLowerCase(),
      password: user.password.trim(),
      full_name: user.full_name?.trim() || "Pharmacist",
      role: user.role || "admin",
      status: "active",
      updated_at: new Date().toISOString()
    };

    // Save locally
    const localUsers = this._getLocalUsers();
    const idx = localUsers.findIndex(u => u.username === cleanUser.username);
    if (idx >= 0) {
      localUsers[idx] = { ...localUsers[idx], ...cleanUser };
    } else {
      localUsers.push({ id: Date.now(), ...cleanUser });
    }
    this._saveLocalUsers(localUsers);

    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("authorized_users")
          .upsert(cleanUser, { onConflict: "username" })
          .select()
          .maybeSingle();
        if (!error && data) return data;
      } catch (e) {
        console.warn("Create authorized user error:", e);
      }
    }
    return cleanUser;
  },

  async deleteAuthorizedUser(id) {
    if (MedHub.supabaseClient && id) {
      try {
        await MedHub.supabaseClient
          .from("authorized_users")
          .delete()
          .eq("id", id);
        return true;
      } catch (e) {
        console.warn("Delete authorized user error:", e);
      }
    }
    return false;
  },

  // 2. CATEGORIES
  async getCategories() {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("categories")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length > 0) {
          MedHub.state.categories = data;
          return data;
        }
      } catch (e) {
        // Table may not yet be created via migration_v2.sql; fallback gracefully
      }
    }
    return MedHub.state.categories;
  },

  async createCategory(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("categories")
          .insert({ name: cleanName })
          .select()
          .maybeSingle();
        if (!error && data) {
          MedHub.state.categories.push(data);
          return data;
        }
      } catch (e) {}
    }
    const newCat = { id: "cat-" + Date.now(), name: cleanName };
    MedHub.state.categories.push(newCat);
    return newCat;
  },

  // 2.5. COMPANIES / MANUFACTURERS & DRUG SCHEDULES MASTER LISTS
  _getLocalCompanies() {
    try {
      const ls = localStorage.getItem("medhub_companies");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MedHub.state.companies || [];
  },

  _saveLocalCompanies(list) {
    try {
      MedHub.state.companies = list;
      localStorage.setItem("medhub_companies", JSON.stringify(list));
    } catch (e) {}
  },

  async getCompanies() {
    let cloudList = [];
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("companies")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length > 0) {
          cloudList = data;
        }
      } catch (e) {}
    }

    const baseList = this._getLocalCompanies();
    const merged = [];
    const seen = new Set();
    const addUnique = (item) => {
      const name = (typeof item === "string" ? item : item?.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(typeof item === "string" ? { id: "co-" + key, name } : { ...item, name });
      }
    };

    cloudList.forEach(addUnique);
    baseList.forEach(addUnique);
    (this._getLocalMedicines() || []).forEach(m => {
      if (m.company) addUnique(m.company);
    });

    merged.sort((a, b) => a.name.localeCompare(b.name));
    this._saveLocalCompanies(merged);
    return merged;
  },

  async createCompany(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const existing = this._getLocalCompanies().find(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    let created = null;
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("companies")
          .upsert({ name: cleanName }, { onConflict: "name" })
          .select()
          .maybeSingle();
        if (!error && data) created = data;
      } catch (e) {}
    }

    const newCompany = created || { id: "co-" + Date.now(), name: cleanName };
    const list = this._getLocalCompanies();
    list.push(newCompany);
    list.sort((a, b) => a.name.localeCompare(b.name));
    this._saveLocalCompanies(list);
    return newCompany;
  },

  _getLocalDrugSchedules() {
    try {
      const ls = localStorage.getItem("medhub_drug_schedules");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MedHub.state.drugSchedules || [];
  },

  _saveLocalDrugSchedules(list) {
    try {
      MedHub.state.drugSchedules = list;
      localStorage.setItem("medhub_drug_schedules", JSON.stringify(list));
    } catch (e) {}
  },

  async getDrugSchedules() {
    let cloudList = [];
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("drug_schedules")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length > 0) {
          cloudList = data;
        }
      } catch (e) {}
    }

    const baseList = this._getLocalDrugSchedules();
    const merged = [];
    const seen = new Set();
    const addUnique = (item) => {
      const name = (typeof item === "string" ? item : item?.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(typeof item === "string" ? { id: "ds-" + key, name } : { ...item, name });
      }
    };

    cloudList.forEach(addUnique);
    baseList.forEach(addUnique);
    (this._getLocalMedicines() || []).forEach(m => {
      if (m.drug_schedule) addUnique(m.drug_schedule);
    });

    this._saveLocalDrugSchedules(merged);
    return merged;
  },

  async createDrugSchedule(name, description = "") {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const existing = this._getLocalDrugSchedules().find(s => s.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    let created = null;
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("drug_schedules")
          .upsert({ name: cleanName, description: description || null }, { onConflict: "name" })
          .select()
          .maybeSingle();
        if (!error && data) created = data;
      } catch (e) {}
    }

    const newSchedule = created || { id: "ds-" + Date.now(), name: cleanName, description };
    const list = this._getLocalDrugSchedules();
    list.push(newSchedule);
    this._saveLocalDrugSchedules(list);
    return newSchedule;
  },

  // 3. MEDICINES & PERSISTENCE
  _getLocalMedicines() {
    try {
      const saved = localStorage.getItem("medhub_medicines");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch (e) {}
    try {
      localStorage.setItem("medhub_medicines", JSON.stringify(mockMedicines));
    } catch (e) {}
    return mockMedicines;
  },

  _saveLocalMedicines(list) {
    try {
      mockMedicines = list;
      localStorage.setItem("medhub_medicines", JSON.stringify(list));
    } catch (e) {}
  },

  _getLocalBatches() {
    try {
      const saved = localStorage.getItem("medhub_batches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    try {
      localStorage.setItem("medhub_batches", JSON.stringify(mockBatches));
    } catch (e) {}
    return mockBatches;
  },

  _saveLocalBatches(list) {
    try {
      mockBatches = list;
      localStorage.setItem("medhub_batches", JSON.stringify(list));
    } catch (e) {}
  },

  async getMedicines() {
    let list = null;
    if (MedHub.supabaseClient) {
      try {
        // First try medicine_stock view
        const { data, error } = await MedHub.supabaseClient
          .from("medicine_stock")
          .select("*")
          .neq("is_active", false)
          .order("name", { ascending: true });
        if (!error && data && data.length) {
          list = data.map(m => {
            const qty = Number(m.available_qty) || 0;
            const reorder = Number(m.reorder_level) || 10;
            return {
              ...m,
              available_qty: qty,
              nearest_expiry: m.nearest_expiry || "—",
              status: qty <= 0 ? "out" : (qty <= reorder ? "low" : "in")
            };
          });
        } else {
          // Fallback: fetch from medicines directly
          const { data: rawMeds, error: medErr } = await MedHub.supabaseClient
            .from("medicines")
            .select("*")
            .neq("is_active", false)
            .order("name", { ascending: true });
          if (!medErr && rawMeds && rawMeds.length) {
            list = rawMeds.map(m => {
              const qty = Number(m.available_qty) || 0;
              const reorder = Number(m.reorder_level) || 10;
              return {
                ...m,
                available_qty: qty,
                nearest_expiry: m.nearest_expiry || "—",
                status: qty <= 0 ? "out" : (qty <= reorder ? "low" : "in")
              };
            });
          }
        }
      } catch (e) {
        console.warn("Medicines fetch fallback:", e);
      }
    }

    if (list && list.length) {
      this._saveLocalMedicines(list);
      return list;
    }
    return this._getLocalMedicines();
  },

  async searchMedicines(query) {
    if (!query || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    let results = [];

    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("medicine_stock")
          .select("*")
          .neq("is_active", false)
          .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,company.ilike.%${q}%,salt_composition.ilike.%${q}%,category.ilike.%${q}%`)
          .limit(100);
        if (!error && data && data.length) {
          results = data;
        } else {
          // Fallback to medicines table directly
          const { data: rawMeds, error: medErr } = await MedHub.supabaseClient
            .from("medicines")
            .select("*")
            .neq("is_active", false)
            .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,company.ilike.%${q}%,salt_composition.ilike.%${q}%,category.ilike.%${q}%`)
            .limit(100);
          if (!medErr && rawMeds && rawMeds.length) {
            results = rawMeds;
          }
        }
      } catch (e) {
        // Fall back to local search
      }
    }

    // Filter local mock medicines with all search tokens across all fields
    const localStoreMeds = this._getLocalMedicines();
    const localMatches = localStoreMeds.filter(m => {
      if (m.is_active === false) return false;
      const fullText = `${m.name || ""} ${m.generic_name || ""} ${m.salt_composition || ""} ${m.company || ""} ${m.category || ""} ${m.barcode || ""}`.toLowerCase();
      return tokens.every(token => fullText.includes(token));
    });

    // Merge Supabase results with local matches without duplicates
    localMatches.forEach(lm => {
      if (!results.some(r => String(r.id) === String(lm.id) || (r.name && r.name.toLowerCase() === lm.name.toLowerCase()))) {
        results.push(lm);
      }
    });

    // Filter results so all tokens in query match
    if (tokens.length > 1) {
      results = results.filter(m => {
        const fullText = `${m.name || ""} ${m.generic_name || ""} ${m.salt_composition || ""} ${m.company || ""} ${m.category || ""} ${m.barcode || ""}`.toLowerCase();
        return tokens.every(token => fullText.includes(token));
      });
    }

    // Sort by best match (name starting with search query ranks first)
    results.sort((a, b) => {
      const aStarts = (a.name || "").toLowerCase().startsWith(q);
      const bStarts = (b.name || "").toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return results;
  },

  async getBatches(medicineId) {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("medicine_batches")
          .select("*")
          .eq("medicine_id", medicineId)
          .gt("quantity", 0)
          .gte("expiry_date", new Date().toISOString().slice(0, 10))
          .order("expiry_date", { ascending: true });
        if (!error && data && data.length) return data;
      } catch (e) {
        console.warn("Batches query err:", e);
      }
    }
    const localBatches = this._getLocalBatches();
    return localBatches.filter(b => String(b.medicine_id) === String(medicineId) && b.quantity > 0);
  },

  async createMedicine(medData, initialBatch = null) {
    let createdMed = null;
    if (MedHub.supabaseClient) {
      try {
        const payload = {
          name: medData.name,
          company: medData.company,
          generic_name: medData.generic_name || "",
          category: medData.category || "Tablet",
          mrp: Number(medData.mrp) || 0,
          gst_percent: Number(medData.gst_percent) || 12,
          reorder_level: Number(medData.reorder_level) || 10,
          is_active: true
        };
        if (medData.salt_composition) payload.salt_composition = medData.salt_composition;
        if (medData.drug_schedule) payload.drug_schedule = medData.drug_schedule;
        if (medData.pack_size) payload.pack_size = medData.pack_size;
        if (medData.barcode) payload.barcode = medData.barcode;
        if (medData.purchase_price) payload.purchase_price = Number(medData.purchase_price);
        if (medData.selling_rate) payload.selling_rate = Number(medData.selling_rate);
        if (initialBatch && Number(initialBatch.quantity) > 0) {
          payload.available_qty = Number(initialBatch.quantity);
          payload.nearest_expiry = initialBatch.expiry_date || "—";
        }

        const { data, error } = await MedHub.supabaseClient
          .from("medicines")
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          createdMed = data;
          if (initialBatch && initialBatch.batch_no) {
            const normExp = this._normalizeDateForPg(initialBatch.expiry_date) || new Date(Date.now() + 365*86400000).toISOString().slice(0, 10);
            await MedHub.supabaseClient.from("medicine_batches").insert({
              medicine_id: createdMed.id,
              batch_no: initialBatch.batch_no,
              expiry_date: normExp,
              purchase_price: Number(medData.purchase_price) || 0,
              selling_price: Number(medData.selling_rate) || Number(medData.mrp) || 0,
              quantity: Math.max(0, Number(initialBatch.quantity) || 0)
            });
          }
        }
      } catch (e) {
        console.warn("createMedicine Supabase error, saving locally:", e);
      }
    }

    const newId = createdMed ? createdMed.id : "med-" + Date.now();
    const qty = (initialBatch && Number(initialBatch.quantity)) || 0;
    const finalMed = {
      id: newId,
      ...medData,
      mrp: Number(medData.mrp) || 0,
      available_qty: qty,
      nearest_expiry: (initialBatch && initialBatch.expiry_date) || "—",
      status: qty <= 0 ? "out" : (qty <= (Number(medData.reorder_level) || 10) ? "low" : "in"),
      is_active: true
    };

    const localMeds = this._getLocalMedicines();
    localMeds.unshift(finalMed);
    this._saveLocalMedicines(localMeds);

    if (initialBatch && initialBatch.batch_no) {
      const localBatches = this._getLocalBatches();
      localBatches.push({
        id: "b-" + Date.now(),
        medicine_id: newId,
        batch_no: initialBatch.batch_no,
        expiry_date: initialBatch.expiry_date,
        purchase_price: Number(medData.purchase_price) || 0,
        selling_price: Number(medData.selling_rate) || Number(medData.mrp) || 0,
        quantity: qty
      });
      this._saveLocalBatches(localBatches);
    }

    return finalMed;
  },

  async updateMedicine(id, medData) {
    let updatedMed = null;
    if (MedHub.supabaseClient && id) {
      try {
        const payload = {
          name: medData.name,
          company: medData.company,
          generic_name: medData.generic_name || "",
          category: medData.category || "Tablet",
          mrp: Number(medData.mrp) || 0,
          gst_percent: Number(medData.gst_percent) || 12,
          reorder_level: Number(medData.reorder_level) || 10
        };
        if (medData.salt_composition !== undefined) payload.salt_composition = medData.salt_composition;
        if (medData.drug_schedule !== undefined) payload.drug_schedule = medData.drug_schedule;
        if (medData.pack_size !== undefined) payload.pack_size = medData.pack_size;
        if (medData.barcode !== undefined) payload.barcode = medData.barcode;
        if (medData.purchase_price !== undefined) payload.purchase_price = Number(medData.purchase_price);
        if (medData.selling_rate !== undefined) payload.selling_rate = Number(medData.selling_rate);
        if (medData.rack_location !== undefined) payload.rack_location = medData.rack_location;

        const { data, error } = await MedHub.supabaseClient
          .from("medicines")
          .update(payload)
          .eq("id", id)
          .select()
          .maybeSingle();
        if (!error && data) {
          updatedMed = data;
        }
      } catch (e) {
        console.warn("updateMedicine Supabase error:", e);
      }
    }

    const localMeds = this._getLocalMedicines();
    const localIdx = localMeds.findIndex(m => String(m.id) === String(id));
    if (localIdx >= 0) {
      localMeds[localIdx] = {
        ...localMeds[localIdx],
        ...medData,
        ...(updatedMed || {})
      };
      this._saveLocalMedicines(localMeds);
      return localMeds[localIdx];
    }
    return updatedMed || medData;
  },

  async deleteMedicine(id) {
    if (MedHub.supabaseClient && id) {
      try {
        await MedHub.supabaseClient.from("medicine_batches").delete().eq("medicine_id", id);
        const { error } = await MedHub.supabaseClient.from("medicines").delete().eq("id", id);
        if (error) {
          console.warn("Hard delete failed, executing soft delete:", error.message);
          await MedHub.supabaseClient.from("medicines").update({ is_active: false }).eq("id", id);
        }
      } catch (e) {
        console.warn("deleteMedicine Supabase error, falling back to soft delete:", e);
        try {
          await MedHub.supabaseClient.from("medicines").update({ is_active: false }).eq("id", id);
        } catch (e2) {}
      }
    }

    let localMeds = this._getLocalMedicines();
    localMeds = localMeds.filter(m => String(m.id) !== String(id));
    this._saveLocalMedicines(localMeds);

    let localBatches = this._getLocalBatches();
    localBatches = localBatches.filter(b => String(b.medicine_id) !== String(id));
    this._saveLocalBatches(localBatches);

    return true;
  },

  async addStockBatch(medicineId, batchData) {
    const qty = Number(batchData.quantity) || 0;
    const batchNo = (batchData.batch_no || "BT-" + Date.now().toString().slice(-4)).trim();
    const expiry = batchData.expiry_date || "2027-12";
    const purRate = Number(batchData.purchase_price) || 0;
    const selRate = Number(batchData.selling_price) || 0;

    if (MedHub.supabaseClient && medicineId) {
      try {
        await MedHub.supabaseClient.from("medicine_batches").insert({
          medicine_id: medicineId,
          batch_no: batchNo,
          expiry_date: expiry.length === 7 ? `${expiry}-01` : expiry,
          purchase_price: purRate,
          selling_price: selRate,
          quantity: qty
        });

        // Also update medicines table available_qty & nearest_expiry if table has these columns
        const { data: curMed } = await MedHub.supabaseClient
          .from("medicines")
          .select("available_qty")
          .eq("id", medicineId)
          .maybeSingle();
        if (curMed) {
          const newTotal = (Number(curMed.available_qty) || 0) + qty;
          await MedHub.supabaseClient
            .from("medicines")
            .update({ available_qty: newTotal, nearest_expiry: expiry })
            .eq("id", medicineId);
        }
      } catch (e) {
        console.warn("addStockBatch Supabase error:", e);
      }
    }

    const localBatches = this._getLocalBatches();
    localBatches.push({
      id: "b-" + Date.now(),
      medicine_id: medicineId,
      batch_no: batchNo,
      expiry_date: expiry,
      purchase_price: purRate,
      selling_price: selRate,
      quantity: qty
    });
    this._saveLocalBatches(localBatches);

    const localMeds = this._getLocalMedicines();
    const med = localMeds.find(m => String(m.id) === String(medicineId));
    if (med) {
      med.available_qty = (Number(med.available_qty) || 0) + qty;
      med.nearest_expiry = expiry;
      const reorder = Number(med.reorder_level) || 10;
      med.status = med.available_qty <= 0 ? "out" : (med.available_qty <= reorder ? "low" : "in");
      if (purRate > 0) med.purchase_price = purRate;
      if (selRate > 0) med.selling_rate = selRate;
      this._saveLocalMedicines(localMeds);
    }
    return true;
  },

  async updateStockBatch(batchId, newQuantity, medicineId) {
    const qty = Math.max(0, Number(newQuantity) || 0);
    if (MedHub.supabaseClient && batchId) {
      try {
        await MedHub.supabaseClient
          .from("medicine_batches")
          .update({ quantity: qty })
          .eq("id", batchId);
      } catch (e) {
        console.warn("updateStockBatch Supabase error:", e);
      }
    }

    const localBatches = this._getLocalBatches();
    const b = localBatches.find(x => String(x.id) === String(batchId));
    if (b) {
      b.quantity = qty;
      this._saveLocalBatches(localBatches);
    }
    return true;
  },

  async updateMedicineBatch(batchId, medicineId, patchData) {
    const expPg = patchData.expiry_date ? (this._normalizeDateForPg(patchData.expiry_date) || patchData.expiry_date) : null;
    const qty = patchData.quantity !== undefined ? Math.max(0, Number(patchData.quantity) || 0) : undefined;
    const batchNo = patchData.batch_no ? String(patchData.batch_no).trim() : undefined;

    if (MedHub.supabaseClient && this._isUuid(String(batchId))) {
      try {
        const upd = {};
        if (batchNo !== undefined) upd.batch_no = batchNo;
        if (expPg) upd.expiry_date = expPg;
        if (qty !== undefined) upd.quantity = qty;
        if (Object.keys(upd).length > 0) {
          await MedHub.supabaseClient.from("medicine_batches").update(upd).eq("id", batchId);
        }
      } catch (e) {
        console.warn("updateMedicineBatch Supabase error:", e);
      }
    } else if (MedHub.supabaseClient && this._isUuid(String(medicineId)) && expPg) {
      // If no batchId existed yet, create one when user sets expiry/qty in Edit Medicine
      try {
        await MedHub.supabaseClient.from("medicine_batches").insert({
          medicine_id: medicineId,
          batch_no: batchNo || "BT-" + Date.now().toString().slice(-4),
          expiry_date: expPg,
          purchase_price: Number(patchData.purchase_price) || 0,
          selling_price: Number(patchData.selling_price) || 0,
          quantity: qty !== undefined ? qty : 0
        });
      } catch (e) {}
    }

    const localBatches = this._getLocalBatches();
    let localB = batchId ? localBatches.find(x => String(x.id) === String(batchId)) : null;
    if (!localB && medicineId) {
      localB = localBatches.find(x => String(x.medicine_id) === String(medicineId));
    }
    if (localB) {
      if (batchNo !== undefined) localB.batch_no = batchNo;
      if (expPg || patchData.expiry_date) localB.expiry_date = expPg || patchData.expiry_date;
      if (qty !== undefined) localB.quantity = qty;
    } else if (medicineId && (expPg || patchData.expiry_date)) {
      localBatches.push({
        id: "b-" + Date.now(),
        medicine_id: medicineId,
        batch_no: batchNo || "BT-01",
        expiry_date: expPg || patchData.expiry_date,
        purchase_price: Number(patchData.purchase_price) || 0,
        selling_price: Number(patchData.selling_price) || 0,
        quantity: qty !== undefined ? qty : 0
      });
    }
    this._saveLocalBatches(localBatches);

    // Sync nearest_expiry and available_qty on local medicine record
    if (medicineId) {
      const localMeds = this._getLocalMedicines();
      const med = localMeds.find(m => String(m.id) === String(medicineId));
      if (med) {
        const medBatches = localBatches.filter(x => String(x.medicine_id) === String(medicineId));
        if (medBatches.length > 0) {
          med.available_qty = medBatches.reduce((sum, x) => sum + (Number(x.quantity) || 0), 0);
          const sortedExp = medBatches.map(x => x.expiry_date).filter(Boolean).sort();
          if (sortedExp.length > 0) med.nearest_expiry = sortedExp[0];
        } else if (expPg || patchData.expiry_date) {
          med.nearest_expiry = expPg || patchData.expiry_date;
          if (qty !== undefined) med.available_qty = qty;
        }
        const reorder = Number(med.reorder_level) || 10;
        med.status = med.available_qty <= 0 ? "out" : (med.available_qty <= reorder ? "low" : "in");
        this._saveLocalMedicines(localMeds);
      }
    }
    return true;
  },

  async getAllStockBatches() {
    let list = [];
    if (MedHub.supabaseClient) {
      try {
        const { data: batches, error } = await MedHub.supabaseClient
          .from("medicine_batches")
          .select("*, medicines(name, generic_name, company, category, pack_size, mrp, salt_composition)")
          .order("created_at", { ascending: false });
        if (!error && batches && batches.length) {
          list = batches.map(b => ({
            id: b.id,
            medicine_id: b.medicine_id,
            batch_no: b.batch_no || "BT-DEFAULT",
            expiry_date: b.expiry_date,
            purchase_price: Number(b.purchase_price) || 0,
            selling_price: Number(b.selling_price) || Number(b.medicines?.mrp) || 0,
            mrp: Number(b.medicines?.mrp) || Number(b.selling_price) || 0,
            quantity: Number(b.quantity) || 0,
            medicine_name: b.medicines?.name || "Medicine",
            generic_name: b.medicines?.generic_name || "",
            company: b.medicines?.company || "Pharma",
            category: b.medicines?.category || "Tablet",
            pack_size: b.medicines?.pack_size || "1x10",
            salt_composition: b.medicines?.salt_composition || b.medicines?.generic_name || ""
          }));
        }
      } catch (e) {
        console.warn("getAllStockBatches Supabase error:", e);
      }
    }

    if (!list.length) {
      const meds = this._getLocalMedicines();
      const batches = this._getLocalBatches();
      list = batches.map(b => {
        const med = meds.find(m => String(m.id) === String(b.medicine_id)) || {};
        return {
          id: b.id,
          medicine_id: b.medicine_id,
          batch_no: b.batch_no || "BT-01",
          expiry_date: b.expiry_date,
          purchase_price: Number(b.purchase_price) || 0,
          selling_price: Number(b.selling_price) || Number(med.mrp) || 0,
          mrp: Number(med.mrp) || Number(b.selling_price) || 0,
          quantity: Number(b.quantity) || 0,
          medicine_name: med.name || "Medicine",
          generic_name: med.generic_name || "",
          company: med.company || "Standard Pharma",
          category: med.category || "Tablet",
          pack_size: med.pack_size || "1x10",
          salt_composition: med.salt_composition || med.generic_name || ""
        };
      });
    }

    return list;
  },

  // 4. BILLS & SALES
  _isUuid(val) {
    return typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
  },

  _normalizeDateForPg(dateStr) {
    if (!dateStr || dateStr === "—") return null;
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
    if (/^\d{1,2}\/\d{2}$/.test(s)) {
      const [mm, yy] = s.split("/");
      return `20${yy}-${mm.padStart(2, "0")}-01`;
    }
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split("-");
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }
    return null;
  },

  _getLocalBills() {
    try {
      const saved = localStorage.getItem("medhub_bills");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return mockBills;
  },

  _saveLocalBills(list) {
    try {
      mockBills = list;
      localStorage.setItem("medhub_bills", JSON.stringify(list));
    } catch (e) {}
  },

  async getBills() {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("bills")
          .select("*, bill_items(*), customers(name, mobile, address)")
          .order("bill_no", { ascending: false })
          .limit(100);
        if (!error && data) {
          const mapped = data.map(b => ({
            ...b,
            customer_name: b.customer_name || b.customers?.name || "Walk-in Customer",
            customer_mobile: b.customer_mobile || b.customers?.mobile || "",
            patient_address: b.patient_address || b.customers?.address || "",
            items: b.items || b.bill_items || []
          }));
          this._saveLocalBills(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn("Bills query fallback:", e);
      }
    }
    return this._getLocalBills().map(b => ({
      ...b,
      items: b.items || b.bill_items || []
    }));
  },

  async _upsertCustomerForBill(billData) {
    if (!MedHub.supabaseClient) return null;
    const mobile = (billData.customer_mobile || "").trim();
    const name = (billData.customer_name || "").trim();
    const address = (billData.patient_address || "").trim();
    if (!/^[0-9]{10}$/.test(mobile)) return null;

    try {
      const { data: cust } = await MedHub.supabaseClient
        .from("customers")
        .select("id")
        .eq("mobile", mobile)
        .maybeSingle();

      if (cust && cust.id) {
        if (name || address) {
          const upd = {};
          if (name) upd.name = name;
          if (address) upd.address = address;
          await MedHub.supabaseClient.from("customers").update(upd).eq("id", cust.id);
        }
        return cust.id;
      }

      if (name) {
        const { data: newCust } = await MedHub.supabaseClient
          .from("customers")
          .insert({ name, mobile, address })
          .select("id")
          .maybeSingle();
        if (newCust) return newCust.id;
      }
    } catch (e) {}
    return null;
  },

  async createBill(billData) {
    let savedBill = null;
    const nowIso = new Date().toISOString();
    const payMode = (billData.payment_mode || "CASH").toUpperCase();
    const safePayMode = ["CASH", "UPI", "CARD"].includes(payMode) ? payMode : "CASH";

    if (MedHub.supabaseClient) {
      try {
        const customerId = await this._upsertCustomerForBill(billData);

        const baseBillPayload = {
          customer_id: customerId,
          doctor_name: billData.doctor_name || "",
          doctor_hospital: billData.doctor_hospital || "",
          patient_address: billData.patient_address || "",
          subtotal: Number(billData.subtotal) || 0,
          discount: Number(billData.discount) || 0,
          gst_amount: Number(billData.gst_amount) || 0,
          grand_total: Number(billData.grand_total) || 0,
          paid_amount: Number(billData.paid_amount) || 0,
          notes: billData.notes || ""
        };

        const extendedBillPayload = {
          ...baseBillPayload,
          customer_name: billData.customer_name || "Walk-in Customer",
          customer_mobile: billData.customer_mobile || "",
          payment_mode: payMode
        };

        let { data: bData, error: bErr } = await MedHub.supabaseClient
          .from("bills")
          .insert(extendedBillPayload)
          .select()
          .single();

        if (bErr) {
          const retry = await MedHub.supabaseClient
            .from("bills")
            .insert(baseBillPayload)
            .select()
            .single();
          bData = retry.data;
          bErr = retry.error;
        }

        if (!bErr && bData) {
          savedBill = {
            ...bData,
            customer_name: bData.customer_name || billData.customer_name || "Walk-in Customer",
            customer_mobile: bData.customer_mobile || billData.customer_mobile || "",
            payment_mode: bData.payment_mode || payMode
          };

          for (const item of billData.items) {
            const medIdValid = this._isUuid(item.medicine_id) ? item.medicine_id : null;
            const batchIdValid = this._isUuid(item.batch_id) ? item.batch_id : null;
            const expPg = this._normalizeDateForPg(item.expiry_date);

            const baseItem = {
              bill_id: savedBill.id,
              medicine_id: medIdValid,
              batch_id: batchIdValid,
              medicine_name: item.name || item.medicine_name || "Medicine",
              batch_no: item.batch_no || "",
              expiry_date: expPg,
              quantity: Math.max(1, Number(item.quantity) || 1),
              rate: Number(item.rate) || 0,
              discount: Number(item.discount_percent || item.discount || 0),
              gst_percent: Number(item.gst_percent || 0),
              line_total: Number(item.line_total) || 0
            };

            const extItem = {
              ...baseItem,
              pack_size: item.pack_size || "1x10",
              drug_schedule: item.drug_schedule || "General (OTC / Non-Rx)",
              salt_composition: item.salt_composition || null
            };

            const { error: iErr } = await MedHub.supabaseClient.from("bill_items").insert(extItem);
            if (iErr && medIdValid && batchIdValid) {
              await MedHub.supabaseClient.from("bill_items").insert(baseItem);
            }

            if (batchIdValid) {
              const { error: rpcErr } = await MedHub.supabaseClient.rpc("decrement_batch_qty", {
                b_id: batchIdValid,
                qty: Number(item.quantity) || 1
              });
              if (rpcErr) {
                const { data: curB } = await MedHub.supabaseClient
                  .from("medicine_batches")
                  .select("quantity")
                  .eq("id", batchIdValid)
                  .maybeSingle();
                if (curB) {
                  await MedHub.supabaseClient
                    .from("medicine_batches")
                    .update({ quantity: Math.max(0, (Number(curB.quantity) || 0) - (Number(item.quantity) || 1)) })
                    .eq("id", batchIdValid);
                }
              }
            }
          }

          if (Number(billData.paid_amount) > 0) {
            await MedHub.supabaseClient.from("payments").insert({
              bill_id: savedBill.id,
              amount: Number(billData.paid_amount),
              mode: safePayMode
            });
          }
          savedBill.items = billData.items;
          const localList = this._getLocalBills();
          localList.unshift(savedBill);
          this._saveLocalBills(localList);
          return savedBill;
        }
      } catch (e) {
        console.warn("createBill Supabase error, falling back to local:", e);
      }
    }

    // Local / In-memory fallback
    const localList = this._getLocalBills();
    const billNo = localList.length ? (Math.max(...localList.map(b => Number(b.bill_no) || 0)) + 1) : 101;
    savedBill = {
      id: "bill-" + Date.now(),
      bill_no: billNo,
      bill_date: nowIso,
      customer_name: billData.customer_name || "Walk-in Customer",
      customer_mobile: billData.customer_mobile || "",
      patient_address: billData.patient_address || "",
      doctor_name: billData.doctor_name || "",
      doctor_hospital: billData.doctor_hospital || "",
      subtotal: Number(billData.subtotal) || 0,
      discount: Number(billData.discount) || 0,
      gst_amount: Number(billData.gst_amount) || 0,
      grand_total: Number(billData.grand_total) || 0,
      paid_amount: Number(billData.paid_amount) || 0,
      due_amount: Math.max(0, (Number(billData.grand_total) || 0) - (Number(billData.paid_amount) || 0)),
      payment_status: Number(billData.paid_amount) >= Number(billData.grand_total) ? "PAID" : (Number(billData.paid_amount) > 0 ? "PARTIAL" : "UNPAID"),
      payment_mode: payMode,
      notes: billData.notes || "",
      is_cancelled: false,
      items: billData.items
    };

    const localMeds = this._getLocalMedicines();
    const localBatches = this._getLocalBatches();
    billData.items.forEach(it => {
      const med = localMeds.find(m => String(m.id) === String(it.medicine_id));
      if (med) {
        med.available_qty = Math.max(0, (Number(med.available_qty) || 0) - Number(it.quantity));
        med.status = med.available_qty === 0 ? "out" : (med.available_qty <= (Number(med.reorder_level) || 10) ? "low" : "in");
      }
      const b = localBatches.find(bat => String(bat.id) === String(it.batch_id));
      if (b) {
        b.quantity = Math.max(0, (Number(b.quantity) || 0) - Number(it.quantity));
      }
    });
    this._saveLocalMedicines(localMeds);
    this._saveLocalBatches(localBatches);

    localList.unshift(savedBill);
    this._saveLocalBills(localList);
    return savedBill;
  },

  async updateBill(billIdOrNo, billData) {
    const subtotal = Number(billData.subtotal) || 0;
    const discount = Number(billData.discount) || 0;
    const gstAmount = Number(billData.gst_amount) || 0;
    const grandTotal = Number(billData.grand_total) || 0;
    const paidAmount = Math.max(0, Number(billData.paid_amount) || 0);
    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const payStatus = paidAmount >= grandTotal ? "PAID" : (paidAmount > 0 ? "PARTIAL" : "UNPAID");
    const payMode = (billData.payment_mode || "CASH").toUpperCase();
    const safePayMode = ["CASH", "UPI", "CARD"].includes(payMode) ? payMode : "CASH";
    const items = Array.isArray(billData.items) ? billData.items : [];

    let updatedCloudBill = null;

    if (MedHub.supabaseClient && this._isUuid(String(billIdOrNo))) {
      try {
        // 1. Attempt transactional RPC update_bill first
        const rpcPayload = {
          customer_name: billData.customer_name || "Walk-in Customer",
          customer_mobile: billData.customer_mobile || "",
          patient_address: billData.patient_address || "",
          doctor_name: billData.doctor_name || "",
          doctor_hospital: billData.doctor_hospital || "",
          subtotal,
          discount,
          gst_amount: gstAmount,
          round_off: Number(billData.round_off) || 0,
          grand_total: grandTotal,
          paid_amount: paidAmount,
          payment_mode: payMode,
          notes: billData.notes || "",
          items: items.map(it => ({
            medicine_id: it.medicine_id || null,
            batch_id: it.batch_id || null,
            medicine_name: it.medicine_name || it.name || "Medicine",
            name: it.medicine_name || it.name || "Medicine",
            batch_no: it.batch_no || "",
            expiry_date: this._normalizeDateForPg(it.expiry_date) || it.expiry_date || "",
            pack_size: it.pack_size || "1x10",
            drug_schedule: it.drug_schedule || "General (OTC / Non-Rx)",
            salt_composition: it.salt_composition || "",
            old_mrp: Number(it.old_mrp) || 0,
            quantity: Math.max(1, Number(it.quantity) || 1),
            rate: Number(it.rate) || 0,
            discount_percent: Number(it.discount_percent ?? it.discount ?? 0),
            gst_percent: Number(it.gst_percent) || 0,
            line_total: Number(it.line_total) || 0
          }))
        };

        const { data: rpcData, error: rpcErr } = await MedHub.supabaseClient.rpc("update_bill", {
          p_bill_id: billIdOrNo,
          p_payload: rpcPayload
        });

        if (!rpcErr && rpcData) {
          updatedCloudBill = {
            ...rpcData,
            items: (rpcData.items && rpcData.items.length) ? rpcData.items : items
          };
        } else {
          // 2. Graceful REST fallback if RPC migration hasn't been applied yet
          const { data: oldItems } = await MedHub.supabaseClient
            .from("bill_items")
            .select("batch_id, quantity")
            .eq("bill_id", billIdOrNo);

          if (oldItems && oldItems.length) {
            for (const oi of oldItems) {
              if (this._isUuid(oi.batch_id)) {
                const { data: curB } = await MedHub.supabaseClient
                  .from("medicine_batches")
                  .select("quantity")
                  .eq("id", oi.batch_id)
                  .maybeSingle();
                if (curB) {
                  await MedHub.supabaseClient
                    .from("medicine_batches")
                    .update({ quantity: (Number(curB.quantity) || 0) + (Number(oi.quantity) || 0) })
                    .eq("id", oi.batch_id);
                }
              }
            }
          }

          await MedHub.supabaseClient.from("bill_items").delete().eq("bill_id", billIdOrNo);

          const customerId = await this._upsertCustomerForBill(billData);
          const baseUpd = {
            doctor_name: billData.doctor_name || "",
            doctor_hospital: billData.doctor_hospital || "",
            patient_address: billData.patient_address || "",
            subtotal,
            discount,
            gst_amount: gstAmount,
            grand_total: grandTotal,
            notes: billData.notes || ""
          };
          if (customerId) baseUpd.customer_id = customerId;

          const extUpd = {
            ...baseUpd,
            customer_name: billData.customer_name || "Walk-in Customer",
            customer_mobile: billData.customer_mobile || "",
            payment_mode: payMode
          };

          let { error: uErr } = await MedHub.supabaseClient.from("bills").update(extUpd).eq("id", billIdOrNo);
          if (uErr) {
            await MedHub.supabaseClient.from("bills").update(baseUpd).eq("id", billIdOrNo);
          }

          for (const it of items) {
            const medIdValid = this._isUuid(it.medicine_id) ? it.medicine_id : null;
            const batchIdValid = this._isUuid(it.batch_id) ? it.batch_id : null;
            const qty = Math.max(1, Number(it.quantity) || 1);

            if (batchIdValid) {
              const { data: curB } = await MedHub.supabaseClient
                .from("medicine_batches")
                .select("quantity")
                .eq("id", batchIdValid)
                .maybeSingle();
              if (curB) {
                await MedHub.supabaseClient
                  .from("medicine_batches")
                  .update({ quantity: Math.max(0, (Number(curB.quantity) || 0) - qty) })
                  .eq("id", batchIdValid);
              }
            }

            if (medIdValid && batchIdValid) {
              await MedHub.supabaseClient.from("bill_items").insert({
                bill_id: billIdOrNo,
                medicine_id: medIdValid,
                batch_id: batchIdValid,
                medicine_name: it.medicine_name || it.name || "Medicine",
                batch_no: it.batch_no || "",
                expiry_date: this._normalizeDateForPg(it.expiry_date),
                quantity: qty,
                rate: Number(it.rate) || 0,
                discount: Number(it.discount_percent ?? it.discount ?? 0),
                gst_percent: Number(it.gst_percent) || 0,
                line_total: Number(it.line_total) || 0
              });
            }
          }

          // Reconcile payments so trg_sync_paid updates bills.paid_amount / due_amount / payment_status
          await MedHub.supabaseClient.from("payments").delete().eq("bill_id", billIdOrNo);
          if (paidAmount > 0) {
            await MedHub.supabaseClient.from("payments").insert({
              bill_id: billIdOrNo,
              amount: paidAmount,
              mode: safePayMode
            });
          } else {
            await MedHub.supabaseClient.from("bills").update({ paid_amount: 0 }).eq("id", billIdOrNo);
          }

          const { data: freshBill } = await MedHub.supabaseClient
            .from("bills")
            .select("*, bill_items(*), customers(name, mobile, address)")
            .eq("id", billIdOrNo)
            .maybeSingle();

          if (freshBill) {
            updatedCloudBill = {
              ...freshBill,
              customer_name: freshBill.customer_name || billData.customer_name || freshBill.customers?.name || "Walk-in Customer",
              customer_mobile: freshBill.customer_mobile || billData.customer_mobile || freshBill.customers?.mobile || "",
              patient_address: freshBill.patient_address || billData.patient_address || freshBill.customers?.address || "",
              payment_mode: freshBill.payment_mode || payMode,
              items: (freshBill.bill_items && freshBill.bill_items.length) ? freshBill.bill_items : items
            };
          }
        }
      } catch (e) {
        console.warn("updateBill Supabase error:", e);
      }
    }

    // Always synchronize local cache (and offline stock quantities)
    const localList = this._getLocalBills();
    const idx = localList.findIndex(b => String(b.id) === String(billIdOrNo) || String(b.bill_no) === String(billIdOrNo));
    const oldBill = idx >= 0 ? localList[idx] : null;

    if (!updatedCloudBill && oldBill) {
      // Reconcile local mock stock offline
      const localMeds = this._getLocalMedicines();
      const localBatches = this._getLocalBatches();
      (oldBill.items || []).forEach(oi => {
        const med = localMeds.find(m => String(m.id) === String(oi.medicine_id));
        if (med) med.available_qty = (Number(med.available_qty) || 0) + (Number(oi.quantity) || 0);
        const bat = localBatches.find(b => String(b.id) === String(oi.batch_id));
        if (bat) bat.quantity = (Number(bat.quantity) || 0) + (Number(oi.quantity) || 0);
      });
      items.forEach(ni => {
        const med = localMeds.find(m => String(m.id) === String(ni.medicine_id));
        if (med) {
          med.available_qty = Math.max(0, (Number(med.available_qty) || 0) - (Number(ni.quantity) || 0));
          med.status = med.available_qty === 0 ? "out" : (med.available_qty <= (Number(med.reorder_level) || 10) ? "low" : "in");
        }
        const bat = localBatches.find(b => String(b.id) === String(ni.batch_id));
        if (bat) bat.quantity = Math.max(0, (Number(bat.quantity) || 0) - (Number(ni.quantity) || 0));
      });
      this._saveLocalMedicines(localMeds);
      this._saveLocalBatches(localBatches);
    }

    const mergedLocal = updatedCloudBill || {
      ...(oldBill || {}),
      customer_name: billData.customer_name || "Walk-in Customer",
      customer_mobile: billData.customer_mobile || "",
      patient_address: billData.patient_address || "",
      doctor_name: billData.doctor_name || "",
      doctor_hospital: billData.doctor_hospital || "",
      subtotal,
      discount,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: payStatus,
      payment_mode: payMode,
      notes: billData.notes || "",
      items
    };

    if (idx >= 0) {
      localList[idx] = mergedLocal;
    } else {
      localList.unshift(mergedLocal);
    }
    this._saveLocalBills(localList);
    return mergedLocal;
  },

  // 5. SUPPLIERS (With full edit, delete & local persistence)
  _getLocalSuppliers() {
    try {
      const ls = localStorage.getItem("medhub_suppliers");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    try {
      localStorage.setItem("medhub_suppliers", JSON.stringify(mockSuppliers));
    } catch (e) {}
    return mockSuppliers;
  },

  _saveLocalSuppliers(list) {
    try {
      mockSuppliers = list;
      localStorage.setItem("medhub_suppliers", JSON.stringify(list));
    } catch (e) {}
  },

  async getSuppliers() {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("suppliers")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length) {
          this._saveLocalSuppliers(data);
          return data;
        }
      } catch (e) {}
    }
    return this._getLocalSuppliers();
  },

  async createSupplier(sup) {
    let created = null;
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("suppliers")
          .insert(sup)
          .select()
          .single();
        if (!error && data) {
          created = data;
        }
      } catch (e) {}
    }
    const newSup = created || { id: "sup-" + Date.now(), ...sup, balance: Number(sup.balance) || 0.00 };
    const list = this._getLocalSuppliers();
    list.push(newSup);
    this._saveLocalSuppliers(list);
    return newSup;
  },

  async updateSupplier(id, supData) {
    let updated = null;
    if (MedHub.supabaseClient && id) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("suppliers")
          .update(supData)
          .eq("id", id)
          .select()
          .maybeSingle();
        if (!error && data) {
          updated = data;
        }
      } catch (e) {
        console.warn("updateSupplier Supabase error:", e);
      }
    }
    const list = this._getLocalSuppliers();
    const idx = list.findIndex(s => String(s.id) === String(id));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...supData, ...(updated || {}) };
      this._saveLocalSuppliers(list);
      return list[idx];
    }
    return updated || supData;
  },

  async deleteSupplier(id) {
    if (MedHub.supabaseClient && id) {
      try {
        await MedHub.supabaseClient.from("suppliers").delete().eq("id", id);
      } catch (e) {
        console.warn("deleteSupplier Supabase error:", e);
      }
    }
    let list = this._getLocalSuppliers();
    list = list.filter(s => String(s.id) !== String(id));
    this._saveLocalSuppliers(list);
    return true;
  },

  // 6. PURCHASES & INWARD STOCK (Never erases existing store data)
  _getLocalPurchases() {
    try {
      const ls = localStorage.getItem("medhub_purchases");
      if (ls) {
        const parsed = JSON.parse(ls);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mockPurchases;
  },

  _saveLocalPurchases(list) {
    try {
      localStorage.setItem("medhub_purchases", JSON.stringify(list));
    } catch (e) {}
  },

  async inwardStockFromPurchase(items) {
    if (!Array.isArray(items) || !items.length) return;
    for (const item of items) {
      const medName = (item.medicine_name || item.name || "").trim();
      if (!medName) continue;
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) continue;
      const rate = Number(item.purchase_rate) || 0;
      const mrp = Number(item.mrp) || rate || 0;
      const batchNo = (item.batch_no || "BT-" + Date.now().toString().slice(-4)).trim();
      const expDate = item.expiry_date || "2028-12-31";

      // 1. Check if medicine already exists in memory or state
      let existingMed = (MedHub.state.medicines || mockMedicines).find(
        m => m.name && m.name.toLowerCase() === medName.toLowerCase()
      );

      if (existingMed) {
        existingMed.available_qty = (Number(existingMed.available_qty) || 0) + qty;
        existingMed.status = existingMed.available_qty <= 0 ? "out" : (existingMed.available_qty <= (existingMed.reorder_level || 10) ? "low" : "in");
        if (rate > 0) existingMed.purchase_price = rate;
        if (mrp > 0) existingMed.mrp = mrp;

        // Add or update batch
        const existingBatch = mockBatches.find(b => b.medicine_id === existingMed.id && b.batch_no === batchNo);
        if (existingBatch) {
          existingBatch.quantity = (Number(existingBatch.quantity) || 0) + qty;
          if (rate > 0) existingBatch.purchase_price = rate;
        } else {
          mockBatches.push({
            id: "b-" + Date.now() + "-" + Math.floor(Math.random() * 100),
            medicine_id: existingMed.id,
            batch_no: batchNo,
            expiry_date: expDate,
            purchase_price: rate,
            selling_price: mrp,
            quantity: qty
          });
        }

        // Supabase sync if connected
        if (MedHub.supabaseClient) {
          try {
            await MedHub.supabaseClient.from("medicine_batches").insert({
              medicine_id: existingMed.id,
              batch_no: batchNo,
              expiry_date: expDate,
              purchase_price: rate,
              selling_price: mrp,
              quantity: qty
            });
          } catch (e) {}
        }
      } else {
        // Create new medicine and batch
        const newMedId = "med-" + Date.now() + "-" + Math.floor(Math.random() * 100);
        const newMed = {
          id: newMedId,
          name: medName,
          generic_name: medName,
          company: item.company || "Pharma Distributor",
          category: "Tablet",
          pack_size: item.pack_size || "1x10",
          purchase_price: rate,
          selling_rate: mrp,
          mrp: mrp,
          gst_percent: 12,
          reorder_level: 10,
          rack_location: "General",
          available_qty: qty,
          nearest_expiry: expDate,
          status: "in"
        };
        mockMedicines.push(newMed);
        if (MedHub.state.medicines) MedHub.state.medicines.push(newMed);

        mockBatches.push({
          id: "b-" + Date.now() + "-" + Math.floor(Math.random() * 100),
          medicine_id: newMedId,
          batch_no: batchNo,
          expiry_date: expDate,
          purchase_price: rate,
          selling_price: mrp,
          quantity: qty
        });

        // Supabase sync if connected
        if (MedHub.supabaseClient) {
          try {
            const { data: dbMed } = await MedHub.supabaseClient
              .from("medicines")
              .insert({
                name: newMed.name,
                generic_name: newMed.generic_name,
                company: newMed.company,
                category: newMed.category,
                mrp: newMed.mrp,
                gst_percent: 12
              })
              .select()
              .maybeSingle();

            if (dbMed && dbMed.id) {
              await MedHub.supabaseClient.from("medicine_batches").insert({
                medicine_id: dbMed.id,
                batch_no: batchNo,
                expiry_date: expDate,
                purchase_price: rate,
                selling_price: mrp,
                quantity: qty
              });
            }
          } catch (e) {}
        }
      }
    }
  },

  async getPurchases() {
    let cloudData = null;
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("purchases")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data && data.length) cloudData = data;
      } catch (e) {}
    }
    const local = this._getLocalPurchases();
    if (cloudData && cloudData.length) {
      // Merge unique without wiping local purchases
      const map = new Map();
      local.forEach(p => map.set(String(p.id || p.invoice_no), p));
      cloudData.forEach(p => {
        const k = String(p.id || p.invoice_no);
        map.set(k, { ...(map.get(k) || {}), ...p });
      });
      return Array.from(map.values());
    }
    return local;
  },

  async createPurchase(purchaseData) {
    const newPur = {
      id: "pur-" + Date.now(),
      created_at: new Date().toISOString(),
      ...purchaseData
    };

    if (MedHub.supabaseClient) {
      try {
        let res = await MedHub.supabaseClient
          .from("purchases")
          .insert(purchaseData)
          .select()
          .maybeSingle();
        if (res.error) {
          // Fallback with base schema columns in case extra discount/tax columns are absent in DB
          const basePurchaseData = {
            supplier_name: purchaseData.supplier_name,
            invoice_no: purchaseData.invoice_no,
            purchase_date: purchaseData.purchase_date,
            total_amount: purchaseData.total_amount,
            paid_amount: purchaseData.paid_amount,
            status: purchaseData.status,
            payment_mode: purchaseData.payment_mode,
            items: purchaseData.items
          };
          res = await MedHub.supabaseClient
            .from("purchases")
            .insert(basePurchaseData)
            .select()
            .maybeSingle();
        }
        if (!res.error && res.data) {
          newPur.id = res.data.id || newPur.id;
        }
      } catch (e) {
        console.warn("createPurchase Supabase error, stored locally:", e);
      }
    }

    // Save locally without erasing existing purchases!
    const current = this._getLocalPurchases();
    current.unshift(newPur);
    this._saveLocalPurchases(current);
    mockPurchases = current;

    // Automatically inward purchased medicines into stock batches
    if (Array.isArray(purchaseData.items) && purchaseData.items.length > 0) {
      await this.inwardStockFromPurchase(purchaseData.items);
    }

    return newPur;
  },

  async updatePurchase(id, updatedData) {
    if (MedHub.supabaseClient && id) {
      try {
        await MedHub.supabaseClient
          .from("purchases")
          .update(updatedData)
          .eq("id", id);
      } catch (e) {
        console.warn("updatePurchase Supabase error:", e);
      }
    }

    const current = this._getLocalPurchases();
    const idx = current.findIndex(p => String(p.id) === String(id) || String(p.invoice_no) === String(id));
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...updatedData };
      this._saveLocalPurchases(current);
      mockPurchases = current;
      return current[idx];
    }
    return null;
  },

  async deletePurchase(id) {
    if (MedHub.supabaseClient && id) {
      try {
        await MedHub.supabaseClient
          .from("purchases")
          .delete()
          .eq("id", id);
      } catch (e) {
        console.warn("deletePurchase Supabase error:", e);
      }
    }

    let current = this._getLocalPurchases();
    current = current.filter(p => String(p.id) !== String(id) && String(p.invoice_no) !== String(id));
    this._saveLocalPurchases(current);
    mockPurchases = current;
    return true;
  }
};
