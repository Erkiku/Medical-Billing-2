// ============================================================================
// MedEduHub - Security Lock Screen (js/security.js)
// Store-level Edit & Stock Security Password Protection
// ============================================================================

MedHub.security = {
  useLoginFallback: false,

  async render(container) {
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading Security Lock settings...</p></div>`;

    await MedHub.api.getStoreSettings();
    const isLocked = MedHub.api.isEditSecurityEnabled();
    const storeName = MedHub.state.store?.store_name || "Your Medical Store";

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2 class="page-title">Security Lock</h2>
          <p class="page-subtitle">Medicine aur Stock changes ko unauthorized edits se bachane ke liye Store Security Password set karein</p>
        </div>
        <div class="header-action-btns">
          <span class="security-status-badge ${isLocked ? "locked" : "unlocked"}">
            ${isLocked ? "🔒 Security Lock Active" : "🔓 Lock Not Set"}
          </span>
        </div>
      </div>

      <div class="security-status-banner ${isLocked ? "is-locked" : "is-unlocked"}">
        <div>
          <strong style="font-size:15px; color:#0f172a;">
            ${isLocked
              ? `${storeName} me Medicine & Stock Edit Protection ON hai`
              : `${storeName} me abhi koi Security Password set nahi hai`}
          </strong>
          <div style="font-size:13px; color:#475569; margin-top:4px;">
            ${isLocked
              ? "Ab koi bhi staff bina Security Password daale Medicine add/edit/delete, Stock update, Purchase edit/delete ya Bill edit nahi kar sakta."
              : "Suraksha ke liye neeche Security Password set karein taaki koi bhi staff bina permission ke stock ya rate change na kar sake."}
          </div>
        </div>
        <div class="security-status-badge ${isLocked ? "locked" : "unlocked"}">
          ${isLocked ? "Protected" : "Open Access"}
        </div>
      </div>

      <div class="settings-layout">
        <!-- LEFT: SET / CHANGE SECURITY PASSWORD -->
        <div class="settings-main">
          <form id="security-password-form" class="card-panel">
            <div class="card-header-flex">
              <h3>${MedHub.icons.lock} ${isLocked ? "Change Store Security Password" : "Set Store Security Password"}</h3>
              <span style="font-size:12px; color:#64748b;">Min. 4 characters (PIN ya Password)</span>
            </div>

            ${isLocked ? `
              <div class="form-group" style="margin-bottom:14px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <label id="sec-current-label" style="margin:0;">
                    ${this.useLoginFallback ? "Store Account Login Password *" : "Current Security Password *"}
                  </label>
                  <button type="button" id="btn-toggle-sec-recovery" class="btn-secondary-sm" style="font-size:11px; padding:3px 9px;">
                    ${this.useLoginFallback ? "Purana Security Password Yaad Hai?" : "Security Password Bhool Gaye?"}
                  </button>
                </div>
                <div class="security-pwd-wrap">
                  <input type="password" id="sec-current-pwd" autocomplete="current-password"
                    placeholder="${this.useLoginFallback ? "Apna store login password daalein..." : "Purana security password daalein..."}" required />
                  <button type="button" class="security-pwd-eye" data-target="sec-current-pwd" aria-label="Show password">👁️</button>
                </div>
                <small style="color:#64748b; display:block; margin-top:4px;">
                  ${this.useLoginFallback
                    ? "Apne account login password se verify karke naya security password set karein."
                    : "Badalne ke liye pehle purana security password verify karein."}
                </small>
              </div>
            ` : ""}

            <div class="form-row-2">
              <div class="form-group">
                <label>${isLocked ? "New Security Password *" : "Security Password *"}</label>
                <div class="security-pwd-wrap">
                  <input type="password" id="sec-new-pwd" autocomplete="new-password"
                    placeholder="Kam se kam 4 characters (e.g. 1234 ya Sagar@99)" required minlength="4" />
                  <button type="button" class="security-pwd-eye" data-target="sec-new-pwd" aria-label="Show password">👁️</button>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm Security Password *</label>
                <div class="security-pwd-wrap">
                  <input type="password" id="sec-confirm-pwd" autocomplete="new-password"
                    placeholder="Wahi password dobara daalein" required minlength="4" />
                  <button type="button" class="security-pwd-eye" data-target="sec-confirm-pwd" aria-label="Show password">👁️</button>
                </div>
              </div>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between; margin-top:18px; padding-top:14px; border-top:1px solid #e2e8f0;">
              <button type="submit" id="btn-save-security-pwd" class="btn-primary">
                ${MedHub.icons.check} ${isLocked ? "Update Security Password" : "Activate Security Lock"}
              </button>

              ${isLocked ? `
                <button type="button" id="btn-disable-security-lock" class="btn-secondary-sm" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2;">
                  🔓 Remove / Disable Security Lock
                </button>
              ` : ""}
            </div>
          </form>

          <!-- PROTECTED ACTIONS BREAKDOWN -->
          <div class="card-panel" style="margin-top:18px;">
            <h3 style="margin-bottom:6px;">🛡️ Protected Operations (Jahaan Password Maanga Jayega)</h3>
            <p style="font-size:13px; color:#64748b; margin-bottom:10px;">
              Security Lock active hone par niche diye gaye har change se pehle Store Security Password verify kiya jayega:
            </p>
            <div class="security-scope-grid">
              <div class="security-scope-item">
                <span class="security-scope-icon">💊</span>
                <div>
                  <strong style="font-size:13px; color:#0f172a;">Medicines &amp; Catalog</strong>
                  <div style="font-size:12px; color:#475569;">Add New Medicine, Edit Medicine / Rate / MRP, aur Delete Medicine.</div>
                </div>
              </div>
              <div class="security-scope-item">
                <span class="security-scope-icon">📦</span>
                <div>
                  <strong style="font-size:13px; color:#0f172a;">Stock &amp; Batch Updates</strong>
                  <div style="font-size:12px; color:#475569;">+ Stock entry, quantity adjust aur batch modification.</div>
                </div>
              </div>
              <div class="security-scope-item">
                <span class="security-scope-icon">🧾</span>
                <div>
                  <strong style="font-size:13px; color:#0f172a;">Purchases &amp; Bill Edit</strong>
                  <div style="font-size:12px; color:#475569;">New Purchase inward, Purchase Edit/Delete aur Invoice Edit (stock impact).</div>
                </div>
              </div>
              <div class="security-scope-item">
                <span class="security-scope-icon">⚡</span>
                <div>
                  <strong style="font-size:13px; color:#0f172a;">Counter POS Billing Free</strong>
                  <div style="font-size:12px; color:#475569;">Normal customer billing bina kisi rukawat ke fast chalegi.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: INFO CARD -->
        <div class="settings-preview-col">
          <div class="card-panel">
            <h3 style="margin-bottom:10px;">☁️ Multi-Device Cloud Sync</h3>
            <p style="font-size:13px; color:#475569; line-height:1.55;">
              Aapka Security Password encrypted hash ke roop me aapke store profile ke saath save hota hai, isliye doosre laptop ya phone par login karne par bhi wahi Security Lock kaam karega.
            </p>
            <div style="margin-top:14px; padding:12px; border-radius:10px; background:#eff6ff; border:1px solid #bfdbfe; font-size:12.5px; color:#1e3a8a;">
              <strong>Tip:</strong> Staff ke saath store login share karne ke baad apna Security Password alag rakhein taaki inventory &amp; purchase rates safe rahein.
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, isLocked);
  },

  bindEvents(container, isLocked) {
    const self = this;

    // Eye toggles
    container.querySelectorAll(".security-pwd-eye").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.textContent = show ? "🙈" : "👁️";
        input.focus();
      });
    });

    // Toggle recovery using Store Account Login Password
    document.getElementById("btn-toggle-sec-recovery")?.addEventListener("click", () => {
      self.useLoginFallback = !self.useLoginFallback;
      self.render(container);
    });

    // Save / Update Security Password
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
        saveBtn.innerHTML = `${MedHub.icons.check} ${isLocked ? "Update Security Password" : "Activate Security Lock"}`;
      }

      if (!res.success) {
        MedHub.toast(res.message || "Security password save nahi ho paya", "error");
        return;
      }

      self.useLoginFallback = false;
      MedHub.toast(
        isLocked
          ? "🔒 Security Password successfully update ho gaya!"
          : "🔒 Security Lock activate ho gaya! Ab Medicine/Stock edits protected hain.",
        "success"
      );
      await self.render(container);
    });

    // Disable / Remove Security Lock
    document.getElementById("btn-disable-security-lock")?.addEventListener("click", async () => {
      const promptMsg = self.useLoginFallback
        ? "Security Lock hatane ke liye apna Store Account Login Password daalein:"
        : "Security Lock hatane ke liye apna Current Security Password daalein:";
      const entered = await MedHub.prompt(promptMsg, "", {
        title: "Disable Security Lock",
        type: "password",
        placeholder: self.useLoginFallback ? "Login password..." : "Current security password...",
        confirmText: "Disable Lock",
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
