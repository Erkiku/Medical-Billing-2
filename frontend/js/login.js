// ============================================================================
// MedEduHub - 2-Step Login & Authorized Store Access (js/login.js)
// Theme: Luxury Pink, Obsidian Black & Cream
// SECURITY: ONLY USERNAME & PASSWORD ASSIGNED IN authorized_users CAN LOGIN!
// Step 1: Pharmacist Username / Email & Password (Strictly Authenticated)
// Step 2: Store Profile & Regulatory Compliance Setup
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.login = {
  currentStep: 1, // 1 = Auth credentials, 2 = Store details
  portalMode: "store", // "store" (Pharmacist) or "superadmin" (Master Admin)
  isNewStore: false,
  showCloudConfig: false,
  storeData: null,
  authError: null,
  tempAuth: {
    username: "",
    email: "",
    name: "",
    password: "",
    role: "admin"
  },

  async render(container) {
    container.innerHTML = `
      <div class="login-screen-wrap template-style">
        <!-- LEFT PANEL: HIGH-RESOLUTION PHARMACY STORE INTERIOR (NO PEOPLE) -->
        <div class="login-doctor-panel login-image-panel">
          <img src="images/pharmacy_shelves.jpg" alt="Modern Pharmacy & Medical Store" class="login-doctor-img" />
        </div>

        <!-- RIGHT PANEL: SEA-FOAM TEAL MEDICAL HERO & LOGIN FORM (EXACT TEMPLATE) -->
        <div class="login-brand-panel template-panel">
          <div class="login-teal-top">
            <!-- 2-TONE ROUNDED MEDICAL CROSS LOGO (PROMINENT SIZE) -->
            <div class="template-cross-icon">
              <svg width="58" height="58" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Left Lobe (Teal) -->
                <path d="M6 24C6 20.6863 8.68629 18 12 18H24V30H12C8.68629 30 6 27.3137 6 24Z" fill="#389d97"/>
                <!-- Right Lobe (White) -->
                <path d="M24 18H36C39.3137 18 42 20.6863 42 24C42 27.3137 39.3137 30 36 30H24V18Z" fill="#ffffff"/>
                <!-- Top Lobe (White) -->
                <path d="M24 6C27.3137 6 30 8.68629 30 12V24H18V12C18 8.68629 20.6863 6 24 6Z" fill="#ffffff"/>
                <!-- Bottom Lobe (Teal) -->
                <path d="M18 24H30V36C30 39.3137 27.3137 42 24 42C20.6863 42 18 39.3137 18 36V24Z" fill="#389d97"/>
              </svg>
            </div>
            ${this.currentStep === 2 ? `<span class="template-top-brand-text">MedEduHub Medical</span>` : ''}
          </div>

          <!-- MAIN HERO TYPOGRAPHY & LOGIN SECTION -->
          <div class="login-teal-content ${this.currentStep === 2 ? 'step2-active' : ''}">
            ${this.currentStep === 1 ? `
              <h1 class="template-hero-title">
                MedEduHub<br>Medical
              </h1>
              <p class="template-hero-subtitle">
                Where precision pharmacy care comes first
              </p>
              <div class="template-form-container">
                ${this.renderStep1()}
              </div>
            ` : `
              <div class="template-form-container step2-view">
                ${this.renderStep2()}
              </div>
            `}
          </div>

          <!-- BOTTOM CAROUSEL DOT INDICATOR (EXACT LIKE TEMPLATE) -->
          <div class="login-template-footer">
            <div class="template-carousel-pill">
              <span class="carousel-pill-thumb"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  // --------------------------------------------------------------------------
  // STEP 1: USERNAME & PASSWORD FORM (WITH MASTER ADMIN PORTAL SWITCHER)
  // --------------------------------------------------------------------------
  renderStep1() {
    const isSuper = (this.portalMode === "superadmin");

    return `
      <form id="step1-auth-form" class="template-auth-form">
        <!-- PORTAL SELECTOR: STORE PHARMACIST vs MASTER ADMIN -->
        <div class="login-portal-switcher" style="display: flex; background: rgba(0, 0, 0, 0.22); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 30px; padding: 4px; margin-bottom: 20px;">
          <button type="button" class="portal-switch-btn ${!isSuper ? 'active' : ''}" data-mode="store" style="flex: 1; padding: 8px 10px; border-radius: 25px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; ${!isSuper ? 'background: #ffffff; color: #1d4ed8; box-shadow: 0 2px 8px rgba(0,0,0,0.15);' : 'background: transparent; color: #e2e8f0;'}">
            🏪 Store Login
          </button>
          <button type="button" class="portal-switch-btn ${isSuper ? 'active' : ''}" data-mode="superadmin" style="flex: 1; padding: 8px 10px; border-radius: 25px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; ${isSuper ? 'background: #fbbf24; color: #78350f; box-shadow: 0 2px 8px rgba(0,0,0,0.15);' : 'background: transparent; color: #e2e8f0;'}">
            🛡️ Master Admin
          </button>
        </div>

        ${isSuper ? `
          <div style="background: rgba(15, 23, 42, 0.55); border: 1.5px solid #fbbf24; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 22px;">🛡️</span>
            <div>
              <div style="font-size: 12px; font-weight: 800; color: #fbbf24; letter-spacing: 0.5px;">MASTER ADMIN CONTROL ACCESS</div>
              <div style="font-size: 11px; color: #e2e8f0;">Manage all stores, licenses, status & platform governance</div>
            </div>
          </div>
        ` : ""}

        <!-- ERROR BANNER IF UNAUTHORIZED / WRONG CREDENTIALS -->
        ${this.authError ? `
          <div class="template-auth-error">
            <span>🚫 <strong>Access Denied:</strong> ${this.authError}</span>
          </div>
        ` : ""}

        <div class="template-field-wrap">
          <label class="template-field-label">${isSuper ? 'Master Admin Username / ID' : 'Username / Login ID'}</label>
          <input 
            type="text" 
            id="login-email" 
            class="template-field-input" 
            value="${this.tempAuth.username || this.tempAuth.email || ""}" 
            placeholder="${isSuper ? 'Enter master admin username (e.g. masteradmin)' : 'Enter authorized username'}" 
            required 
            autofocus 
          />
        </div>

        <div class="template-field-wrap">
          <label class="template-field-label">${isSuper ? 'Master Security Key / Password' : 'Password / Security PIN'}</label>
          <div class="template-password-wrap">
            <input 
              type="password" 
              id="login-password" 
              class="template-field-input" 
              value="${this.tempAuth.password || ""}" 
              placeholder="${isSuper ? 'Enter master admin security key' : 'Enter your security PIN'}" 
              required 
            />
            <button type="button" id="btn-toggle-password" class="template-eye-btn" title="View or Hide Password" tabindex="-1">
              <svg id="eye-show-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg id="eye-hide-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- PILL BUTTON (EXACT TEMPLATE PILL BUTTON SHAPE & TEAL COLOR) -->
        <button type="submit" class="template-pill-btn" id="btn-submit-step1" style="${isSuper ? 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important; color: #ffffff !important;' : ''}">
          <span>${isSuper ? 'Unlock Master Admin Panel 🛡️' : 'Sign In to Pharma OS'}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>

        ${(!MedHub.supabaseClient && !isSuper) ? `
          <div style="margin-top: 14px; background: rgba(15, 23, 42, 0.38); border: 1px solid rgba(255,255,255,0.22); border-radius: 10px; padding: 10px 12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <span style="font-size: 11px; color: #fde68a; font-weight: 700;">⚠️ Cloud Database Offline (Local Mode)</span>
              <button type="button" id="btn-toggle-cloud-config" style="background: rgba(255,255,255,0.16); color: #ffffff; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Connect Cloud DB</button>
            </div>
            <div id="cloud-config-drawer" style="display: ${this.showCloudConfig ? 'block' : 'none'}; margin-top: 10px;">
              <input type="text" id="cloud-sb-url" class="template-field-input" style="height: 36px; font-size: 12px; margin-bottom: 6px;" placeholder="Supabase URL (https://xxx.supabase.co)" value="${MedHub.supabaseUrl || localStorage.getItem('supabase_url') || ''}" />
              <input type="text" id="cloud-sb-key" class="template-field-input" style="height: 36px; font-size: 12px; margin-bottom: 8px;" placeholder="Supabase Publishable / Anon Key" value="${MedHub.supabaseAnonKey || localStorage.getItem('supabase_anon_key') || ''}" />
              <button type="button" id="btn-save-cloud-config" style="width: 100%; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; padding: 7px; font-size: 12px; font-weight: 700; cursor: pointer;">Save & Connect Supabase</button>
            </div>
          </div>
        ` : ""}
      </form>
    `;
  },

  // --------------------------------------------------------------------------
  // STEP 2: STORE PROFILE & REGULATORY COMPLIANCE
  // --------------------------------------------------------------------------
  renderStep2() {
    const s = this.storeData || {};
    const isNew = this.isNewStore;
    const userLabel = this.tempAuth.username || this.tempAuth.email;

    return `
      <div class="template-step2-card">
        <div class="template-step2-header">
          <span class="template-step2-badge">${isNew ? "✨ New Store Setup" : "🏪 Store Profile"}</span>
          <h2 class="template-step2-title">${isNew ? "Register Your Medical Store" : "Store Profile & Compliance"}</h2>
          <p class="template-step2-sub">${isNew ? "Is account ke liye store details fill karein. Auto-fill ho jayengi." : "Logged in as " + userLabel + ". Check ya edit karein."}</p>
        </div>

        <form id="step2-store-form" class="template-step2-form">
          <div class="form-row-2">
            <div class="template-field-wrap">
              <label class="template-field-label">Pharmacist In-Charge Name *</label>
              <input 
                type="text" 
                id="login-pharmacist-name" 
                class="template-field-input" 
                value="${s.pharmacist_name || this.tempAuth.name || ""}" 
                placeholder="Dr. Anil Kumar / Pharmacist Name" 
                required 
              />
            </div>
            <div class="template-field-wrap">
              <label class="template-field-label">Medical Store Name *</label>
              <input 
                type="text" 
                id="login-store-name" 
                class="template-field-input" 
                value="${s.store_name || ""}" 
                placeholder="e.g. MedEdu Pharmacy" 
                required 
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="template-field-wrap">
              <label class="template-field-label">Store Phone / Mobile *</label>
              <input 
                type="tel" 
                id="login-store-phone" 
                class="template-field-input" 
                value="${s.phone || ""}" 
                placeholder="10-digit mobile number" 
                required 
              />
            </div>
            <div class="template-field-wrap">
              <label class="template-field-label">Store Address & City</label>
              <input 
                type="text" 
                id="login-store-address" 
                class="template-field-input" 
                value="${s.address || ""}" 
                placeholder="Shop No., Market Road, City - Pincode" 
              />
            </div>
          </div>

          <div class="form-row-3">
            <div class="template-field-wrap">
              <label class="template-field-label">GSTIN (15 Digits)</label>
              <input 
                type="text" 
                id="login-gstin" 
                class="template-field-input" 
                value="${s.gstin || ""}" 
                placeholder="27ABCDE1234F1Z5 (Optional)" 
                maxlength="15" 
              />
            </div>
            <div class="template-field-wrap">
              <label class="template-field-label">Drug License (20B) *</label>
              <input 
                type="text" 
                id="login-dl20" 
                class="template-field-input" 
                value="${s.dl_no_20b || s.drug_license_no || ""}" 
                placeholder="MH-20-DL-12345" 
                required 
              />
            </div>
            <div class="template-field-wrap">
              <label class="template-field-label">Drug License (21B)</label>
              <input 
                type="text" 
                id="login-dl21" 
                class="template-field-input" 
                value="${s.dl_no_21b || ""}" 
                placeholder="DL-21B-654321" 
              />
            </div>
          </div>

          <div class="form-row-2">
            <div class="template-field-wrap">
              <label class="template-field-label">FSSAI Registration No.</label>
              <input 
                type="text" 
                id="login-fssai" 
                class="template-field-input" 
                value="${s.fssai_no || ""}" 
                placeholder="10012345678901" 
              />
            </div>
            <div class="template-field-wrap">
              <label class="template-field-label">Store UPI ID for Payments</label>
              <input 
                type="text" 
                id="login-upi" 
                class="template-field-input" 
                value="${s.upi_id || ""}" 
                placeholder="store@okaxis or 9876543210@paytm" 
              />
            </div>
          </div>

          <button type="submit" class="template-pill-btn step2-submit-btn">
            ${isNew ? "Create Store & Launch Dashboard 🚀" : "Confirm & Launch Dashboard 🚀"}
          </button>

          <button type="button" class="template-back-btn" id="btn-back-to-step1">
            ← Back to Username & Password
          </button>
        </form>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // EVENT BINDINGS
  // --------------------------------------------------------------------------
  bindEvents(container) {
    const self = this;

    // STEP 1 EVENTS
    if (this.currentStep === 1) {
      // Portal Switcher buttons
      container.querySelectorAll(".portal-switch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          self.portalMode = btn.dataset.mode;
          self.authError = null;
          self.render(container);
        });
      });

      const step1Form = container.querySelector("#step1-auth-form");
      step1Form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userInput = document.getElementById("login-email")?.value.trim();
        const passwordInput = document.getElementById("login-password")?.value || "";

        if (!userInput || !passwordInput) {
          MedHub.toast("Please enter both username/email and password.", "warning");
          return;
        }

        self.tempAuth.username = userInput;

        const submitBtn = container.querySelector("#btn-submit-step1");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "Verifying Credentials...";
        }

        try {
          // STRICT AUTHENTICATION (STORE ACCOUNT vs MASTER ADMIN PORTAL)
          const authResult = await MedHub.api.authenticateUser(userInput, passwordInput, self.portalMode);

          if (!authResult || !authResult.success) {
            self.authError = (authResult && authResult.message) || "Invalid credentials! Please check your username and password.";
            if (authResult && authResult.offlineUnconfigured) {
              self.showCloudConfig = true;
            }
            self.tempAuth.password = "";
            MedHub.toast(self.authError, "danger");
            self.render(container);
            return;
          }

          // 1. MASTER ADMIN PORTAL DIRECT LOGIN
          if (authResult.isSuperAdmin || authResult.user?.role === "superadmin") {
            self.authError = null;
            MedHub.state.isAuthenticated = true;
            MedHub.state.isSuperAdmin = true;
            MedHub.state.user = {
              id: authResult.user.id || "superadmin",
              username: authResult.user.username,
              email: authResult.user.email,
              role: "superadmin",
              name: authResult.user.name || "Platform Master Administrator"
            };

            try {
              localStorage.setItem("medhub_authenticated", "true");
              localStorage.setItem("medhub_current_user", authResult.user.email);
              localStorage.setItem("medhub_user_name", MedHub.state.user.name);
              localStorage.setItem("medhub_user_role", "superadmin");
            } catch (e) {}

            MedHub.toast("Master Administrator authenticated! Welcome to Control Center.", "success");
            MedHub.router.currentPage = "admin";
            MedHub.router.init();
            return;
          }

          // 2. STORE PHARMACIST LOGIN
          self.authError = null;
          const verifiedUser = authResult.user;
          self.tempAuth.username = verifiedUser.username;
          self.tempAuth.email = verifiedUser.email || verifiedUser.username;
          self.tempAuth.name = verifiedUser.name || verifiedUser.full_name || verifiedUser.username;
          self.tempAuth.role = verifiedUser.role || "admin";
          self.tempAuth.password = passwordInput;
          self.tempAuth.store_id = verifiedUser.store_id;
          self.tempAuth.store_name = verifiedUser.store_name;

          // Fetch store settings for THIS specific user / store
          let existingStore = authResult.store;
          if (!existingStore) {
            existingStore = await MedHub.api.getStoreSettings(verifiedUser, { allowFallback: false });
          }

          // CHECK IF STORE PROFILE HAS ALREADY BEEN SET UP OR USER IS REGISTERED:
          // Once a store is registered in Supabase or local, NEVER ask for Step 2 again! DIRECT LOGIN!
          if (existingStore || !authResult.isNew) {
            const finalStore = existingStore || {
              id: verifiedUser.store_id || undefined,
              store_name: verifiedUser.store_name || "Pharmacy Store",
              pharmacist_name: verifiedUser.name || "Dr. Anil Kumar",
              user_email: verifiedUser.email || `${verifiedUser.username}@mededuhub.com`,
              phone: "",
              address: "",
              gstin: "",
              dl_no_20b: ""
            };
            self.completeLogin(verifiedUser, finalStore);
            return;
          }

          // NEW USER / UNREGISTERED:
          // Ask for store profile ONLY on the very first fresh signup
          self.isNewStore = true;
          self.storeData = {
            pharmacist_name: verifiedUser.username === "admin" ? "Dr. Anil Kumar" : (verifiedUser.name || ""),
            store_name: "",
            phone: "",
            address: "",
            gstin: "",
            dl_no_20b: "",
            dl_no_21b: "",
            fssai_no: "",
            upi_id: ""
          };

          self.currentStep = 2; // Transition to Step 2 for 1st time setup only
          self.render(container);
        } catch (err) {
          console.error("Login error:", err);
          self.authError = err?.message || "Login failed unexpectedly. Please try again.";
          MedHub.toast(self.authError, "danger");
          self.render(container);
        }
      });

      // Cloud DB Manual Connection Drawer (when running offline/local without /api/config)
      container.querySelector("#btn-toggle-cloud-config")?.addEventListener("click", () => {
        const drawer = container.querySelector("#cloud-config-drawer");
        self.showCloudConfig = !self.showCloudConfig;
        if (drawer) drawer.style.display = self.showCloudConfig ? "block" : "none";
      });

      container.querySelector("#btn-save-cloud-config")?.addEventListener("click", () => {
        const sbUrl = container.querySelector("#cloud-sb-url")?.value.trim();
        const sbKey = container.querySelector("#cloud-sb-key")?.value.trim();
        if (!sbUrl || !sbKey) {
          MedHub.toast("Please enter both Supabase URL and Key.", "warning");
          return;
        }
        try {
          localStorage.setItem("supabase_url", sbUrl);
          localStorage.setItem("supabase_anon_key", sbKey);
        } catch (e) {}
        MedHub.initSupabaseClient(sbUrl, sbKey);
        if (MedHub.supabaseClient) {
          self.showCloudConfig = false;
          self.authError = null;
          MedHub.toast("Supabase Cloud DB connected! Ab username aur password se Sign In karein.", "success");
          self.render(container);
        } else {
          MedHub.toast("Invalid Supabase URL or Key, or Supabase JS SDK not loaded.", "danger");
        }
      });

      // Toggle Password Visibility (Eye Button)
      const toggleBtn = container.querySelector("#btn-toggle-password");
      const passInput = container.querySelector("#login-password");
      const eyeShow = container.querySelector("#eye-show-icon");
      const eyeHide = container.querySelector("#eye-hide-icon");

      toggleBtn?.addEventListener("click", () => {
        if (!passInput) return;
        const isPass = (passInput.type === "password");
        passInput.type = isPass ? "text" : "password";
        if (eyeShow) eyeShow.style.display = isPass ? "none" : "inline-block";
        if (eyeHide) eyeHide.style.display = isPass ? "inline-block" : "none";
        passInput.focus();
      });
    }

    // STEP 2 EVENTS
    if (this.currentStep === 2) {
      // Back button
      container.querySelector("#btn-back-to-step1")?.addEventListener("click", () => {
        self.currentStep = 1;
        self.render(container);
      });

      const step2Form = container.querySelector("#step2-store-form");
      step2Form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = step2Form.querySelector("button[type='submit']");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "Saving Store Details & Launching...";
        }

        const email = self.tempAuth.email;
        const pharmacistName = document.getElementById("login-pharmacist-name")?.value.trim() || self.tempAuth.name || "Dr. Anil Kumar";

        // Gather all store profile & compliance inputs
        const storePayload = {
          user_email: email,
          pharmacist_name: pharmacistName,
          store_name: document.getElementById("login-store-name")?.value.trim() || "My Pharmacy",
          phone: document.getElementById("login-store-phone")?.value.trim() || "",
          address: document.getElementById("login-store-address")?.value.trim() || "",
          gstin: document.getElementById("login-gstin")?.value.trim().toUpperCase() || "",
          dl_no_20b: document.getElementById("login-dl20")?.value.trim() || "",
          dl_no_21b: document.getElementById("login-dl21")?.value.trim() || "",
          drug_license_no: document.getElementById("login-dl20")?.value.trim() || "",
          fssai_no: document.getElementById("login-fssai")?.value.trim() || "",
          upi_id: document.getElementById("login-upi")?.value.trim() || "",
          payee_name: document.getElementById("login-store-name")?.value.trim() || "Pharmacy"
        };

        // 1. Persist store settings to Supabase Database & LocalStorage under this user's email
        const savedStore = await MedHub.api.saveStoreSettings(storePayload, email);
        const resolvedStore = (savedStore && typeof savedStore === "object") ? savedStore : storePayload;

        // 2. Persist authorized user record with name, password, and linked store_id
        if (self.tempAuth && self.tempAuth.password) {
          const authUserSaved = await MedHub.api.createAuthorizedUser({
            username: self.tempAuth.username,
            email: email,
            password: self.tempAuth.password,
            full_name: pharmacistName,
            role: self.tempAuth.role || "admin",
            store_id: resolvedStore.id || null,
            store_name: resolvedStore.store_name || storePayload.store_name
          });
          if (authUserSaved && authUserSaved.store_id) {
            self.tempAuth.store_id = authUserSaved.store_id;
          } else if (resolvedStore.id) {
            self.tempAuth.store_id = resolvedStore.id;
          }
        }

        // 3. Complete login and launch Dashboard immediately!
        self.completeLogin(self.tempAuth, resolvedStore);
      });
    }
  },

  // --------------------------------------------------------------------------
  // COMPLETE LOGIN & LAUNCH DASHBOARD
  // Directly launches dashboard without repeating Step 2 for configured stores
  // --------------------------------------------------------------------------
  completeLogin(user, storePayload) {
    const email = (user.email || user.username || "").toLowerCase().trim();
    const username = (user.username || (email.includes("@") ? email.split("@")[0] : email)).toLowerCase().trim();
    const storeId = storePayload?.id || user.store_id || null;
    const pharmacistName =
      storePayload.pharmacist_name ||
      user.name ||
      user.full_name ||
      "Pharmacist Admin";

    // Clear stale local data caches if switching to a different store or user
    try {
      const prevStoreId = localStorage.getItem("medhub_store_id");
      const prevUser = localStorage.getItem("medhub_current_user");
      const switchedStore = (storeId && prevStoreId && String(prevStoreId) !== String(storeId)) ||
        (prevUser && email && prevUser.toLowerCase().trim() !== email);
      if (switchedStore) {
        [
          "medhub_medicines",
          "medhub_batches",
          "medhub_bills",
          "medhub_purchases",
          "medhub_suppliers"
        ].forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {}

    // 1. Update in-memory store state
    MedHub.state.store = { ...storePayload, id: storeId || storePayload?.id };

    // 2. Update topbar store header in real time
    if (typeof MedHub.updateStoreHeader === "function") {
      MedHub.updateStoreHeader(MedHub.state.store);
    }

    // 3. Authenticate user & update application state
    MedHub.state.isAuthenticated = true;
    MedHub.state.isSuperAdmin = false;
    MedHub.state.user = {
      username,
      email,
      role: user.role || "admin",
      name: pharmacistName,
      store_id: storeId
    };

    try {
      localStorage.setItem("medhub_authenticated", "true");
      localStorage.setItem("medhub_current_user", email);
      localStorage.setItem("medhub_username", username);
      if (storeId) localStorage.setItem("medhub_store_id", String(storeId));
      else localStorage.removeItem("medhub_store_id");
      localStorage.setItem("medhub_user_name", pharmacistName);
      localStorage.setItem("medhub_user_role", user.role || "admin");
      localStorage.setItem("medhub_store_settings", JSON.stringify(MedHub.state.store));
      localStorage.setItem("mededuhub_store_settings", JSON.stringify(MedHub.state.store));
    } catch (err) {}

    // Persist only activity timestamps in Supabase if existing store already has an id (never overwrite existing profile fields)
    if (MedHub.supabaseClient && storeId && typeof storeId === "number") {
      Promise.resolve(
        MedHub.supabaseClient
          .from("store_settings")
          .update({
            last_login_user: username,
            last_login_at: new Date().toISOString()
          })
          .eq("id", storeId)
      ).catch(err => console.warn("Background store sync error:", err));
    } else if (MedHub.supabaseClient && storePayload) {
      MedHub.api.saveStoreSettings({
        ...MedHub.state.store,
        last_login_user: username,
        last_login_at: new Date().toISOString()
      }, email).catch(err => console.warn("Background store sync error:", err));
    }

    // 4. Update sidebar avatar & name
    if (typeof MedHub.updateUserBadge === "function") {
      MedHub.updateUserBadge(pharmacistName, "Pharmacist Admin");
    }

    // Reset step for future logout
    this.currentStep = 1;
    this.authError = null;

    MedHub.toast(
      `Welcome, ${pharmacistName}! "${storePayload.store_name}" launched successfully.`,
      "success"
    );
    MedHub.router.init();
  }
};
