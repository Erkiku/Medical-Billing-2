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
  isNewStore: false,
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
  // STEP 1: USERNAME & PASSWORD FORM (INTEGRATED INTO TEMPLATE)
  // --------------------------------------------------------------------------
  renderStep1() {
    return `
      <form id="step1-auth-form" class="template-auth-form">
        <!-- ERROR BANNER IF UNAUTHORIZED / WRONG CREDENTIALS -->
        ${this.authError ? `
          <div class="template-auth-error">
            <span>🚫 <strong>Access Denied:</strong> ${this.authError}</span>
          </div>
        ` : ""}

        <div class="template-field-wrap">
          <label class="template-field-label">Username / Login ID</label>
          <input 
            type="text" 
            id="login-email" 
            class="template-field-input" 
            value="${this.tempAuth.username || this.tempAuth.email || ""}" 
            placeholder="Enter authorized username" 
            required 
            autofocus 
          />
        </div>

        <div class="template-field-wrap">
          <label class="template-field-label">Password / Security PIN</label>
          <div class="template-password-wrap">
            <input 
              type="password" 
              id="login-password" 
              class="template-field-input" 
              value="${this.tempAuth.password || ""}" 
              placeholder="Enter your security PIN" 
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
        <button type="submit" class="template-pill-btn" id="btn-submit-step1">
          <span>Sign In to Pharma OS</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>

        <button type="button" class="template-quick-btn" id="btn-quick-demo-fill">
          ⚡ Quick Fill: admin / admin123
        </button>
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
              <label class="template-field-label">GSTIN (15 Digits) *</label>
              <input 
                type="text" 
                id="login-gstin" 
                class="template-field-input" 
                value="${s.gstin || ""}" 
                placeholder="27ABCDE1234F1Z5" 
                maxlength="15" 
                required 
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
      const step1Form = container.querySelector("#step1-auth-form");
      step1Form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const userInput = document.getElementById("login-email")?.value.trim();
        const passwordInput = document.getElementById("login-password")?.value || "";

        if (!userInput || !passwordInput) {
          MedHub.toast("Please enter both username/email and password.", "warning");
          return;
        }

        const submitBtn = container.querySelector("#btn-submit-step1");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "Verifying Credentials...";
        }

        // STRICT AUTHENTICATION AGAINST authorized_users TABLE
        const authResult = await MedHub.api.authenticateUser(userInput, passwordInput);

        if (!authResult.success) {
          self.authError = authResult.message || "Invalid credentials! Only admin assigned accounts can log in.";
          self.tempAuth.password = "";
          MedHub.toast(self.authError, "danger");
          self.render(container);
          return;
        }

        // Auth Successful!
        self.authError = null;
        const verifiedUser = authResult.user;
        self.tempAuth.username = verifiedUser.username;
        self.tempAuth.email = verifiedUser.email || verifiedUser.username;
        self.tempAuth.name = verifiedUser.name || "Pharmacist Admin";
        self.tempAuth.role = verifiedUser.role || "admin";
        self.tempAuth.password = passwordInput;

        // Fetch store settings for THIS specific user email/username
        const existingStore = await MedHub.api.getStoreSettings(self.tempAuth.email);

        if (existingStore && existingStore.store_name) {
          // EXISTING STORE: Full data will be shown!
          self.isNewStore = false;
          self.storeData = existingStore;
        } else {
          // NEW USER / NEW STORE: All fields will be blank!
          self.isNewStore = true;
          self.storeData = {
            store_name: "",
            phone: "",
            address: "",
            gstin: "",
            dl_no_20b: "",
            dl_no_21b: "",
            fssai_no: "",
            upi_id: ""
          };
        }

        self.currentStep = 2; // Transition to Step 2
        self.render(container);
      });

      // Quick Demo button
      container.querySelector("#btn-quick-demo-fill")?.addEventListener("click", () => {
        const userInput = document.getElementById("login-email");
        const passInput = document.getElementById("login-password");
        if (userInput) userInput.value = "admin";
        if (passInput) passInput.value = "admin123";
        self.authError = null;
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

        // 1. Update in-memory store state
        MedHub.state.store = { ...storePayload };

        // 2. Persist to Supabase Database & LocalStorage under this user's email
        await MedHub.api.saveStoreSettings(storePayload, email);

        // 3. Update topbar store header in real time
        MedHub.updateStoreHeader(storePayload);

        // 4. Authenticate user & update user badge in real time
        MedHub.state.isAuthenticated = true;
        MedHub.state.user = {
          username: self.tempAuth.username,
          email: email,
          role: self.tempAuth.role || "admin",
          name: pharmacistName
        };
        try {
          localStorage.setItem("medhub_authenticated", "true");
          localStorage.setItem("medhub_current_user", email);
          localStorage.setItem("medhub_user_name", pharmacistName);
          localStorage.setItem("medhub_user_role", self.tempAuth.role || "admin");
        } catch (err) { }

        // Real-time update of sidebar avatar & name
        MedHub.updateUserBadge(pharmacistName, "Pharmacist Admin");

        // Reset step for future logout
        self.currentStep = 1;

        MedHub.toast(`Welcome! "${storePayload.store_name}" profile updated & loaded successfully.`, "success");
        MedHub.router.init();
      });
    }
  }
};
