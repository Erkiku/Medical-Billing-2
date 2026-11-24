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
  async getStoreSettings(userEmail) {
    const targetEmail = userEmail || MedHub.state.user?.email || localStorage.getItem("medhub_current_user");

    // Case A: Querying for a specific user/store email
    if (targetEmail) {
      // 1. Check local per-user cache
      let localStore = null;
      try {
        const ls = localStorage.getItem("medhub_store_" + targetEmail.toLowerCase().trim());
        if (ls) localStore = JSON.parse(ls);
      } catch (e) {}

      // 2. Check Supabase by user_email
      let cloudStore = null;
      if (MedHub.supabaseClient) {
        try {
          const { data, error } = await MedHub.supabaseClient
            .from("store_settings")
            .select("*")
            .eq("user_email", targetEmail.toLowerCase().trim())
            .maybeSingle();
          if (!error && data) cloudStore = data;
        } catch (e) {
          console.warn("Store settings fetch error for user:", targetEmail, e);
        }
      }

      const found = cloudStore || localStore;
      if (found) {
        try {
          localStorage.setItem("medhub_store_" + targetEmail.toLowerCase().trim(), JSON.stringify(found));
        } catch (e) {}
        MedHub.state.store = found;
        return found;
      }

      // If specific email was asked and NOT found, return null (NEW USER!)
      if (userEmail) {
        return null;
      }
    }

    // Case B: General fallback for active session
    let generalLocal = null;
    try {
      const ls = localStorage.getItem("mededuhub_store_settings");
      if (ls) generalLocal = JSON.parse(ls);
    } catch (e) {}

    let generalCloud = null;
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("store_settings")
          .select("*")
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!error && data) generalCloud = data;
      } catch (e) {}
    }

    const fallbackStore = generalCloud || generalLocal || MedHub.defaultStore || mockStore;
    MedHub.state.store = fallbackStore;
    return fallbackStore;
  },

  async saveStoreSettings(settings, userEmail) {
    const email = (userEmail || MedHub.state.user?.email || localStorage.getItem("medhub_current_user") || "admin@mededuhub.com").toLowerCase().trim();

    const merged = {
      ...(MedHub.state.store || {}),
      ...settings,
      user_email: email,
      updated_at: new Date().toISOString()
    };

    // 1. Save to local per-store and active cache
    try {
      localStorage.setItem("medhub_store_" + email, JSON.stringify(merged));
      localStorage.setItem("mededuhub_store_settings", JSON.stringify(merged));
      localStorage.setItem("medhub_current_user", email);
    } catch (e) {}
    mockStore = merged;
    MedHub.state.store = merged;

    // 2. Persist to Supabase Database
    if (MedHub.supabaseClient) {
      try {
        // Check if row exists for this store/user
        const { data: existing } = await MedHub.supabaseClient
          .from("store_settings")
          .select("id")
          .eq("user_email", email)
          .maybeSingle();

        if (existing && existing.id) {
          const { error: updErr } = await MedHub.supabaseClient
            .from("store_settings")
            .update(merged)
            .eq("id", existing.id);
          if (updErr) console.warn("Supabase store_settings update error:", updErr);
        } else {
          const { error: insErr } = await MedHub.supabaseClient
            .from("store_settings")
            .insert(merged);
          if (insErr) console.warn("Supabase store_settings insert error:", insErr);
        }
      } catch (e) {
        console.warn("Store settings save error:", e);
      }
    }
    return true;
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
  // Supports existing accounts (with password verification) & automatic registration for new users!
  async authenticateUser(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      return { success: false, message: "Please provide both username/email and password." };
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanEmail = cleanInput.includes("@") ? cleanInput : `${cleanInput}@mededuhub.com`;

    // 1. Check Supabase Database
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("authorized_users")
          .select("*")
          .or(`username.ilike.${cleanInput},email.ilike.${cleanInput}`)
          .maybeSingle();

        if (!error && data) {
          // User exists in Supabase! Check password:
          if (data.password === cleanPass) {
            return {
              success: true,
              isNew: false,
              user: {
                id: data.id,
                username: data.username,
                email: data.email || cleanEmail,
                name: data.full_name || data.username,
                role: data.role || "admin"
              }
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

    // 2. Check local users cache
    const localUsers = this._getLocalUsers();
    const existingLocal = localUsers.find(
      u => u.username?.toLowerCase() === cleanInput || u.email?.toLowerCase() === cleanInput
    );

    if (existingLocal) {
      if (
        existingLocal.password === cleanPass ||
        (cleanInput === "admin" && (cleanPass === "123456" || cleanPass === "admin123"))
      ) {
        return {
          success: true,
          isNew: false,
          user: {
            id: existingLocal.id,
            username: existingLocal.username,
            email: existingLocal.email || cleanEmail,
            name: existingLocal.full_name || existingLocal.username,
            role: existingLocal.role || "admin"
          }
        };
      } else {
        return {
          success: false,
          message: `Incorrect password for user "${cleanInput}". Please check your password.`
        };
      }
    }

    // 3. Root admin credentials fallback
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

    // 4. NEW USER: Auto-register new pharmacist account!
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

    // Save to local users list
    localUsers.push(newUser);
    this._saveLocalUsers(localUsers);

    // Save to Supabase if available
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
          if (initialBatch && initialBatch.batch_no && Number(initialBatch.quantity) > 0) {
            await MedHub.supabaseClient.from("medicine_batches").insert({
              medicine_id: createdMed.id,
              batch_no: initialBatch.batch_no,
              expiry_date: initialBatch.expiry_date || new Date(Date.now() + 365*86400000).toISOString().slice(0, 10),
              purchase_price: Number(medData.purchase_price) || 0,
              selling_price: Number(medData.selling_rate) || Number(medData.mrp) || 0,
              quantity: Number(initialBatch.quantity)
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

    if (initialBatch && initialBatch.batch_no && qty > 0) {
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

  // 4. BILLS & SALES
  async getBills() {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("bills")
          .select("*, bill_items(*)")
          .order("bill_no", { ascending: false })
          .limit(100);
        if (!error && data && data.length) {
          return data.map(b => ({
            ...b,
            items: b.items || b.bill_items || []
          }));
        }
      } catch (e) {
        console.warn("Bills query fallback:", e);
      }
    }
    return mockBills.map(b => ({
      ...b,
      items: b.items || b.bill_items || []
    }));
  },

  async createBill(billData) {
    let savedBill = null;
    const nowIso = new Date().toISOString();

    if (MedHub.supabaseClient) {
      try {
        // Customer handling
        let customerId = null;
        if (billData.customer_mobile && billData.customer_mobile.length === 10) {
          const { data: cust } = await MedHub.supabaseClient
            .from("customers")
            .select("id")
            .eq("mobile", billData.customer_mobile)
            .maybeSingle();

          if (cust) {
            customerId = cust.id;
          } else if (billData.customer_name) {
            const { data: newCust } = await MedHub.supabaseClient
              .from("customers")
              .insert({
                name: billData.customer_name,
                mobile: billData.customer_mobile,
                address: billData.patient_address || ""
              })
              .select("id")
              .maybeSingle();
            if (newCust) customerId = newCust.id;
          }
        }

        // Insert Bill
        const billPayload = {
          customer_id: customerId,
          doctor_name: billData.doctor_name || "",
          doctor_hospital: billData.doctor_hospital || "",
          patient_address: billData.patient_address || "",
          subtotal: billData.subtotal,
          discount: billData.discount || 0,
          grand_total: billData.grand_total,
          paid_amount: billData.paid_amount,
          notes: billData.notes || ""
        };

        const { data: bData, error: bErr } = await MedHub.supabaseClient
          .from("bills")
          .insert(billPayload)
          .select()
          .single();

        if (!bErr && bData) {
          savedBill = bData;
          // Insert Bill Items
          for (const item of billData.items) {
            await MedHub.supabaseClient.from("bill_items").insert({
              bill_id: savedBill.id,
              medicine_id: item.medicine_id,
              batch_id: item.batch_id,
              medicine_name: item.name,
              batch_no: item.batch_no,
              expiry_date: item.expiry_date,
              quantity: item.quantity,
              rate: item.rate,
              line_total: item.line_total
            });
            // Decrement batch stock
            if (item.batch_id) {
              await MedHub.supabaseClient.rpc("decrement_batch_qty", {
                b_id: item.batch_id,
                qty: item.quantity
              }).catch(() => {});
            }
          }
          // Insert Payment Record
          if (billData.paid_amount > 0) {
            await MedHub.supabaseClient.from("payments").insert({
              bill_id: savedBill.id,
              amount: billData.paid_amount,
              mode: billData.payment_mode || "CASH"
            });
          }
          savedBill.items = billData.items;
          return savedBill;
        }
      } catch (e) {
        console.warn("createBill Supabase error, falling back to local:", e);
      }
    }

    // Local / In-memory fallback
    const billNo = mockBills.length ? (mockBills[0].bill_no + 1) : 101;
    savedBill = {
      id: "bill-" + Date.now(),
      bill_no: billNo,
      bill_date: nowIso,
      customer_name: billData.customer_name || "Walk-in Customer",
      customer_mobile: billData.customer_mobile || "",
      patient_address: billData.patient_address || "",
      doctor_name: billData.doctor_name || "",
      doctor_hospital: billData.doctor_hospital || "",
      subtotal: billData.subtotal,
      discount: billData.discount || 0,
      grand_total: billData.grand_total,
      paid_amount: billData.paid_amount,
      due_amount: Math.max(0, billData.grand_total - billData.paid_amount),
      payment_status: billData.paid_amount >= billData.grand_total ? "PAID" : (billData.paid_amount > 0 ? "PARTIAL" : "UNPAID"),
      payment_mode: billData.payment_mode || "CASH",
      is_cancelled: false,
      items: billData.items
    };

    // Deduct stock from mock medicines
    billData.items.forEach(it => {
      const med = mockMedicines.find(m => m.id === it.medicine_id);
      if (med) {
        med.available_qty = Math.max(0, (med.available_qty || 0) - it.quantity);
        med.status = med.available_qty === 0 ? "out" : (med.available_qty <= 10 ? "low" : "in");
      }
      const b = mockBatches.find(bat => bat.id === it.batch_id);
      if (b) {
        b.quantity = Math.max(0, b.quantity - it.quantity);
      }
    });

    mockBills.unshift(savedBill);
    return savedBill;
  },

  // 5. SUPPLIERS
  async getSuppliers() {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("suppliers")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length) return data;
      } catch (e) {}
    }
    return mockSuppliers;
  },

  async createSupplier(sup) {
    if (MedHub.supabaseClient) {
      try {
        const { data, error } = await MedHub.supabaseClient
          .from("suppliers")
          .insert(sup)
          .select()
          .single();
        if (!error && data) {
          mockSuppliers.push(data);
          return data;
        }
      } catch (e) {}
    }
    const newSup = { id: "sup-" + Date.now(), ...sup, balance: 0.00 };
    mockSuppliers.push(newSup);
    return newSup;
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
        const { data, error } = await MedHub.supabaseClient
          .from("purchases")
          .insert(purchaseData)
          .select()
          .maybeSingle();
        if (!error && data) {
          newPur.id = data.id || newPur.id;
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
