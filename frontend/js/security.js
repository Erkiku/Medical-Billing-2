// ============================================================================
// MedEduHub - Security Lock Screen (js/security.js)
// Clean, simple & store-synced Security Password for Medicine & Stock edits
// ============================================================================

MedHub.security = {
  useLoginFallback: false,

  async render(container) {
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading Security Lock...</p></div>`;

    await MedHub.api.getStoreSettings();
    const isLocked = MedHub.api.isEditSecurityEnabled();
    const isEditUnlocked = MedHub.api.isEditModeUnlocked();
    const storeName = MedHub.state.store?.store_name || "Your Store";

    container.innerHTML = `
      <div class="security-page-shell">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Security Lock</h2>
            <p class="page-subtitle">${storeName} me normal view par Edit/Stock options hidden rahenge — sirf PIN daalne par show honge</p>
          </div>
          <span class="security-status-badge ${isLocked ? "locked" : "unlocked"}">
            ${isLocked ? (isEditUnlocked ? "🔓 Unlocked Now" : "🔒 Lock Active") : "🔓 Not Protected"}
          </span>
        </div>

        <div class="security-hero-banner ${isLocked ? "is-locked" : "is-unlocked"}" style="justify-content: space-between; flex-wrap: wrap;">
          <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:240px;">
            <div class="security-hero-icon">${isLocked ? (isEditUnlocked ? "🔓" : "🛡️") : "🔐"}</div>
            <div>
              <div class="security-hero-title">
                ${!isLocked
                  ? "Abhi koi Security PIN set nahi hai"
                  : (isEditUnlocked
                    ? "Edit Options Abhi Visible Hain (Unlocked)"
                    : "Normal Mode: Edit & Stock Options Hidden Hain")}
              </div>
              <div class="security-hero-desc">
                ${!isLocked
                  ? "Neeche PIN/Password set karein. Set hone ke baad bina PIN daale Edit, +Stock, Delete aur Add Medicine options show nahi honge."
                  : (isEditUnlocked
                    ? "Ab aap Medicines, Stock, Purchases aur Bills edit kar sakte hain. Kaam khatam hone par Lock Now dabaa dein."
                    : "PIN enter karte hi Medicines & Stock, Purchases aur Bills me sabhi Edit options show ho jayenge.")}
              </div>
            </div>
          </div>
          ${isLocked ? `
            <div>
              ${isEditUnlocked ? `
                <button type="button" id="btn-sec-lock-edit-now" class="btn-lock-edit">
                  🔒 Lock Edit Options Now
                </button>
              ` : `
                <button type="button" id="btn-sec-unlock-edit-now" class="btn-unlock-edit">
                  🔓 Enter PIN to Show Edit Options
                </button>
              `}
            </div>
          ` : ""}
        </div>

        <form id="security-password-form" class="settings-card security-main-card">
          <div class="settings-card-header" style="justify-content: space-between;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="settings-card-icon">${MedHub.icons.lock}</span>
              <h3 class="settings-card-title">${isLocked ? "CHANGE OR REMOVE SECURITY PASSWORD" : "SET SECURITY PASSWORD"}</h3>
            </div>
            <span class="security-hint-pill">Min. 4 chars</span>
          </div>

          ${isLocked ? `
            <div class="form-group" style="margin-bottom: 16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                <label class="form-label" style="margin:0;">
                  ${this.useLoginFallback ? "Store Login Password" : "Current Security Password"} <span class="req">*</span>
                </label>
                <button type="button" id="btn-toggle-sec-recovery" class="security-link-btn">
                  ${this.useLoginFallback ? "Security password yaad hai?" : "Password bhool gaye? Login password se reset karein"}
                </button>
              </div>
              <div class="security-pwd-wrap">
                <input type="password" id="sec-current-pwd" class="input-field security-pwd-input" autocomplete="current-password"
                  placeholder="${this.useLoginFallback ? "Apna store login password daalein..." : "Purana security password daalein..."}" required />
                <button type="button" class="security-pwd-eye" data-target="sec-current-pwd" aria-label="Show password">👁️</button>
              </div>
            </div>
          ` : ""}

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isLocked ? "New Security Password" : "Security Password"} <span class="req">*</span></label>
              <div class="security-pwd-wrap">
                <input type="password" id="sec-new-pwd" class="input-field security-pwd-input" autocomplete="new-password"
                  placeholder="e.g. 1234 ya Sagar@99" required minlength="4" />
                <button type="button" class="security-pwd-eye" data-target="sec-new-pwd" aria-label="Show password">👁️</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password <span class="req">*</span></label>
              <div class="security-pwd-wrap">
                <input type="password" id="sec-confirm-pwd" class="input-field security-pwd-input" autocomplete="new-password"
                  placeholder="Wahi password dobara daalein" required minlength="4" />
                <button type="button" class="security-pwd-eye" data-target="sec-confirm-pwd" aria-label="Show password">👁️</button>
              </div>
            </div>
          </div>

          <div class="security-actions-bar">
            <button type="submit" id="btn-save-security-pwd" class="btn-primary">
              ${MedHub.icons.check} ${isLocked ? "Update Password" : "Save & Enable Lock"}
            </button>

            ${isLocked ? `
              <button type="button" id="btn-disable-security-lock" class="security-danger-btn">
                🔓 Remove Lock
              </button>
            ` : ""}
          </div>
        </form>

        <div class="security-scope-strip">
          <span class="security-scope-label">Protected:</span>
          <span class="security-chip">💊 Medicine Add / Edit / Delete</span>
          <span class="security-chip">📦 + Stock Entry</span>
          <span class="security-chip">🧾 Purchase &amp; Bill Edit</span>
          <span class="security-chip is-free">⚡ POS Counter Billing Free</span>
        </div>
      </div>
    `;

    this.bindEvents(container, isLocked);
  },

  bindEvents(container, isLocked) {
    const self = this;

    container.querySelectorAll(".security-pwd-eye").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "🙈" : "👁️";
        input.focus();
      });
    });

    document.getElementById("btn-toggle-sec-recovery")?.addEventListener("click", () => {
      self.useLoginFallback = !self.useLoginFallback;
      self.render(container);
    });

    document.getElementById("btn-sec-unlock-edit-now")?.addEventListener("click", async () => {
      const ok = await MedHub.api.promptUnlockEditMode("Edit & Stock Options");
      if (ok) self.render(container);
    });

    document.getElementById("btn-sec-lock-edit-now")?.addEventListener("click", () => {
      MedHub.api.lockEditSession();
      MedHub.toast("🔒 Edit options ab hide / lock ho gaye hain.", "info");
      self.render(container);
    });

    const form = document.getElementById("security-password-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentPwd = document.getElementById("sec-current-pwd")?.value || "";
      const newPwd = document.getElementById("sec-new-pwd")?.value || "";
      const confirmPwd = document.getElementById("sec-confirm-pwd")?.value || "";

      if (newPwd.trim().length < 4) {
        MedHub.toast("Security password kam se kam 4 characters ka hona chahiye", "warning");
        document.getElementById("sec-new-pwd")?.focus();
        return;
      }

      if (newPwd !== confirmPwd) {
        MedHub.toast("New Password aur Confirm Password match nahi kar rahe", "error");
        document.getElementById("sec-confirm-pwd")?.focus();
        return;
      }

      const saveBtn = document.getElementById("btn-save-security-pwd");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      const opts = isLocked
        ? (self.useLoginFallback ? { loginPassword: currentPwd } : { currentPassword: currentPwd })
        : {};

      const res = await MedHub.api.setEditSecurityPassword(newPwd, opts);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `${MedHub.icons.check} ${isLocked ? "Update Password" : "Save & Enable Lock"}`;
      }

      if (!res.success) {
        MedHub.toast(res.message || "Security password save nahi ho paya", "error");
        return;
      }

      self.useLoginFallback = false;
      MedHub.toast(
        isLocked
          ? "🔒 Security Password successfully update ho gaya!"
          : "🔒 Security Lock activate ho gaya!",
        "success"
      );
      await self.render(container);
    });

    document.getElementById("btn-disable-security-lock")?.addEventListener("click", async () => {
      const promptMsg = self.useLoginFallback
        ? "Security Lock hatane ke liye apna Store Account Login Password daalein:"
        : "Security Lock hatane ke liye apna Current Security Password daalein:";
      const entered = await MedHub.prompt(promptMsg, "", {
        title: "Remove Security Lock",
        type: "password",
        placeholder: self.useLoginFallback ? "Login password..." : "Current security password...",
        confirmText: "Remove Lock",
        cancelText: "Keep Lock",
        danger: true,
        icon: "🔓"
      });

      if (entered === null) return;

      const res = await MedHub.api.removeEditSecurityPassword(
        self.useLoginFallback ? { loginPassword: entered } : { currentPassword: entered }
      );

      if (!res.success) {
        MedHub.toast(res.message || "Galat password! Security Lock remove nahi hua.", "error");
        return;
      }

      self.useLoginFallback = false;
      MedHub.toast("🔓 Security Lock disable kar diya gaya hai.", "warning");
      await self.render(container);
    });

    if (MedHub.enableEnterNavigation && form) {
      MedHub.enableEnterNavigation(form, { focusSubmitOnLast: true });
    }
  }
};
