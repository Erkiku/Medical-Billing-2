// ============================================================================
// MedEduHub - Security Lock Screen (js/security.js)
// English-only clean interface with Security Question recovery
// ============================================================================

MedHub.security = {
  useForgotRecovery: false,
  presetQuestions: [
    "What is your birth city?",
    "What was the name of your first school?",
    "What is your childhood nickname?",
    "What is your mother's maiden name?",
    "What was the name of your first pet?"
  ],

  _escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  },

  async render(container) {
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading Security Lock settings...</p></div>`;

    await MedHub.api.getStoreSettings();
    const isLocked = MedHub.api.isEditSecurityEnabled();
    const isEditUnlocked = MedHub.api.isEditModeUnlocked();
    const savedQuestion = MedHub.api.getEditSecurityQuestion();
    const hasRecoveryQuestion = MedHub.api.hasEditSecurityQuestion();
    const storeName = this._escapeHtml(MedHub.state.store?.store_name || "Your Medical Store");

    const isPreset = savedQuestion && this.presetQuestions.includes(savedQuestion);
    const initialSelectVal = !savedQuestion
      ? this.presetQuestions[0]
      : (isPreset ? savedQuestion : "__custom__");

    container.innerHTML = `
      <div class="security-page-shell">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Security Lock</h2>
            <p class="page-subtitle">Hide edit and stock controls by default for ${storeName} until unlocked with your password.</p>
          </div>
          <span class="security-status-badge ${isLocked ? "locked" : "unlocked"}">
            ${isLocked ? (isEditUnlocked ? "🔓 Unlocked" : "🔒 Lock Active") : "🔓 Not Set"}
          </span>
        </div>

        <div class="security-hero-banner ${isLocked ? "is-locked" : "is-unlocked"}" style="justify-content: space-between; flex-wrap: wrap;">
          <div style="display:flex; align-items:center; gap:14px; flex:1; min-width:240px;">
            <div class="security-hero-icon">${isLocked ? (isEditUnlocked ? "🔓" : "🛡️") : "🔐"}</div>
            <div>
              <div class="security-hero-title">
                ${!isLocked
                  ? "No Security Password Configured"
                  : (isEditUnlocked
                    ? "Edit Options Are Currently Visible"
                    : "Normal Mode: Edit & Stock Options Are Hidden")}
              </div>
              <div class="security-hero-desc">
                ${!isLocked
                  ? "Set a security password and a recovery security question below. Once enabled, adding new records stays available while editing or deleting stays protected behind your PIN."
                  : (isEditUnlocked
                    ? "You can edit or delete existing medicines, stock, purchases, suppliers, and bills during this session. Click Lock Now when finished."
                    : "Adding new records works normally without a PIN. Enter your security password once to show edit and delete controls across the app.")}
              </div>
            </div>
          </div>
          ${isLocked ? `
            <div>
              ${isEditUnlocked ? `
                <button type="button" id="btn-sec-lock-edit-now" class="btn-lock-edit">
                  🔒 Lock Edit Options
                </button>
              ` : `
                <button type="button" id="btn-sec-unlock-edit-now" class="btn-unlock-edit">
                  🔓 Unlock Edit Options
                </button>
              `}
            </div>
          ` : ""}
        </div>

        <form id="security-password-form" class="settings-card security-main-card">
          <div class="settings-card-header" style="justify-content: space-between;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="settings-card-icon">${MedHub.icons.lock}</span>
              <h3 class="settings-card-title">${isLocked ? "UPDATE OR REMOVE SECURITY PASSWORD" : "SET SECURITY PASSWORD"}</h3>
            </div>
            <span class="security-hint-pill">Min. 4 characters</span>
          </div>

          ${isLocked ? `
            <div class="form-group" style="margin-bottom: 16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                <label class="form-label" style="margin:0;">
                  ${this.useForgotRecovery
                    ? (hasRecoveryQuestion ? "Answer Your Security Question" : "Store Account Login Password")
                    : "Current Security Password"} <span class="req">*</span>
                </label>
                <button type="button" id="btn-toggle-sec-recovery" class="security-link-btn">
                  ${this.useForgotRecovery ? "Use current password instead" : "Forgot Password?"}
                </button>
              </div>

              ${this.useForgotRecovery && hasRecoveryQuestion ? `
                <div class="security-question-box">
                  <span class="security-q-label">Security Question:</span>
                  <span class="security-q-text">${this._escapeHtml(savedQuestion)}</span>
                </div>
                <input type="text" id="sec-recovery-verify-input" class="input-field"
                  placeholder="Enter your recovery answer..." autocomplete="off" required />
              ` : `
                <div class="security-pwd-wrap">
                  <input type="password" id="sec-current-pwd" class="input-field security-pwd-input" autocomplete="current-password"
                    placeholder="${this.useForgotRecovery ? "Enter your store account login password..." : "Enter current security password..."}" required />
                  <button type="button" class="security-pwd-eye" data-target="sec-current-pwd" aria-label="Show password">👁️</button>
                </div>
              `}
            </div>
          ` : ""}

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">${isLocked ? "New Security Password" : "Security Password"} <span class="req">*</span></label>
              <div class="security-pwd-wrap">
                <input type="password" id="sec-new-pwd" class="input-field security-pwd-input" autocomplete="new-password"
                  placeholder="Enter at least 4 characters" required minlength="4" />
                <button type="button" class="security-pwd-eye" data-target="sec-new-pwd" aria-label="Show password">👁️</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password <span class="req">*</span></label>
              <div class="security-pwd-wrap">
                <input type="password" id="sec-confirm-pwd" class="input-field security-pwd-input" autocomplete="new-password"
                  placeholder="Re-enter password" required minlength="4" />
                <button type="button" class="security-pwd-eye" data-target="sec-confirm-pwd" aria-label="Show password">👁️</button>
              </div>
            </div>
          </div>

          <!-- SECURITY RECOVERY QUESTION & ANSWER -->
          <div class="security-recovery-section">
            <div class="security-recovery-header">
              <span>🔑</span>
              <div>
                <strong>Password Recovery Security Question</strong>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">
                  Required to reset or remove your Security Lock if you ever forget your password.
                </div>
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 12px;">
              <div class="form-group">
                <label class="form-label">Security Question <span class="req">*</span></label>
                <select id="sec-question-select" class="input-field" required>
                  ${this.presetQuestions.map(q => `
                    <option value="${this._escapeHtml(q)}" ${initialSelectVal === q ? "selected" : ""}>${this._escapeHtml(q)}</option>
                  `).join("")}
                  <option value="__custom__" ${initialSelectVal === "__custom__" ? "selected" : ""}>Write a custom question...</option>
                </select>
                <input type="text" id="sec-custom-question" class="input-field"
                  style="margin-top:8px; display:${initialSelectVal === "__custom__" ? "block" : "none"};"
                  placeholder="Type your custom security question..."
                  value="${initialSelectVal === "__custom__" ? this._escapeHtml(savedQuestion) : ""}" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  Security Answer ${!isLocked || !hasRecoveryQuestion ? `<span class="req">*</span>` : `(Optional to keep existing)`}
                </label>
                <input type="text" id="sec-recovery-answer" class="input-field" autocomplete="off"
                  placeholder="${isLocked && hasRecoveryQuestion ? "Enter new answer (or leave blank to keep current)" : "Enter recovery answer (case-insensitive)"}"
                  ${!isLocked || !hasRecoveryQuestion ? "required" : ""} />
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
          <span class="security-scope-label">Protected Actions:</span>
          <span class="security-chip">💊 Medicine Add / Edit / Delete</span>
          <span class="security-chip">📦 Add Stock</span>
          <span class="security-chip">🧾 Purchase &amp; Invoice Edit</span>
          <span class="security-chip is-free">⚡ POS Billing Always Open</span>
        </div>
      </div>
    `;

    this.bindEvents(container, isLocked, hasRecoveryQuestion, savedQuestion);
  },

  bindEvents(container, isLocked, hasRecoveryQuestion, savedQuestion) {
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

    document.getElementById("sec-question-select")?.addEventListener("change", (e) => {
      const customEl = document.getElementById("sec-custom-question");
      if (!customEl) return;
      const isCustom = e.target.value === "__custom__";
      customEl.style.display = isCustom ? "block" : "none";
      customEl.required = isCustom;
      if (isCustom) customEl.focus();
    });

    document.getElementById("btn-toggle-sec-recovery")?.addEventListener("click", () => {
      self.useForgotRecovery = !self.useForgotRecovery;
      self.render(container);
    });

    document.getElementById("btn-sec-unlock-edit-now")?.addEventListener("click", async () => {
      const ok = await MedHub.api.promptUnlockEditMode("Edit & Stock Options");
      if (ok) self.render(container);
    });

    document.getElementById("btn-sec-lock-edit-now")?.addEventListener("click", () => {
      MedHub.api.lockEditSession();
      MedHub.toast("Edit options are now hidden and locked.", "info");
      self.render(container);
    });

    const form = document.getElementById("security-password-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPwd = document.getElementById("sec-new-pwd")?.value || "";
      const confirmPwd = document.getElementById("sec-confirm-pwd")?.value || "";
      const qSelect = document.getElementById("sec-question-select")?.value || "";
      const qCustom = document.getElementById("sec-custom-question")?.value || "";
      const finalQuestion = (qSelect === "__custom__" ? qCustom : qSelect).trim();
      const newAnswer = (document.getElementById("sec-recovery-answer")?.value || "").trim();

      if (newPwd.trim().length < 4) {
        MedHub.toast("Security password must be at least 4 characters long.", "warning");
        document.getElementById("sec-new-pwd")?.focus();
        return;
      }

      if (newPwd !== confirmPwd) {
        MedHub.toast("New password and confirm password do not match.", "error");
        document.getElementById("sec-confirm-pwd")?.focus();
        return;
      }

      if (!finalQuestion) {
        MedHub.toast("Please enter your security question.", "warning");
        document.getElementById("sec-custom-question")?.focus();
        return;
      }

      const questionChanged = isLocked && savedQuestion && finalQuestion !== savedQuestion;
      if ((!isLocked || !hasRecoveryQuestion || questionChanged) && !newAnswer) {
        MedHub.toast("Please enter an answer for your security question.", "warning");
        document.getElementById("sec-recovery-answer")?.focus();
        return;
      }

      const opts = {
        securityQuestion: finalQuestion,
        securityAnswerInput: newAnswer,
        preserveExistingAnswer: Boolean(isLocked && hasRecoveryQuestion && !newAnswer && !questionChanged)
      };

      if (isLocked) {
        if (self.useForgotRecovery) {
          if (hasRecoveryQuestion) {
            opts.securityAnswer = document.getElementById("sec-recovery-verify-input")?.value || "";
          } else {
            opts.loginPassword = document.getElementById("sec-current-pwd")?.value || "";
          }
        } else {
          opts.currentPassword = document.getElementById("sec-current-pwd")?.value || "";
        }
      }

      const saveBtn = document.getElementById("btn-save-security-pwd");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
      }

      const res = await MedHub.api.setEditSecurityPassword(newPwd, opts);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `${MedHub.icons.check} ${isLocked ? "Update Password" : "Save & Enable Lock"}`;
      }

      if (!res.success) {
        MedHub.toast(res.message || "Could not save security password.", "error");
        return;
      }

      self.useForgotRecovery = false;
      MedHub.toast(
        isLocked
          ? "Security password updated. Edit options remain hidden until unlocked."
          : "Security Lock enabled. Edit options are now hidden by default.",
        "success"
      );
      await self.render(container);
    });

    document.getElementById("btn-disable-security-lock")?.addEventListener("click", async () => {
      const useRecoveryPrompt = self.useForgotRecovery;
      let promptMsg = "Enter your current security password to remove Security Lock:";
      let promptTitle = "Remove Security Lock";
      let promptType = "password";
      let promptPlaceholder = "Enter current security password...";

      if (useRecoveryPrompt && hasRecoveryQuestion) {
        promptMsg = `Security Question: ${savedQuestion}\nEnter your recovery answer to remove Security Lock:`;
        promptTitle = "Recover & Remove Lock";
        promptType = "text";
        promptPlaceholder = "Enter security answer...";
      } else if (useRecoveryPrompt) {
        promptMsg = "Enter your store account login password to remove Security Lock:";
        promptTitle = "Verify Store Account";
        promptType = "password";
        promptPlaceholder = "Enter login password...";
      }

      const entered = await MedHub.prompt(promptMsg, "", {
        title: promptTitle,
        type: promptType,
        placeholder: promptPlaceholder,
        confirmText: "Remove Lock",
        cancelText: "Keep Lock",
        danger: true,
        icon: "🔓"
      });

      if (entered === null) return;

      const authPayload = useRecoveryPrompt
        ? (hasRecoveryQuestion ? { securityAnswer: entered } : { loginPassword: entered })
        : { currentPassword: entered };

      const res = await MedHub.api.removeEditSecurityPassword(authPayload);

      if (!res.success) {
        MedHub.toast(res.message || "Verification failed. Security Lock was not removed.", "error");
        return;
      }

      self.useForgotRecovery = false;
      MedHub.toast("Security Lock disabled. Edit options are now visible.", "warning");
      await self.render(container);
    });

    if (MedHub.enableEnterNavigation && form) {
      MedHub.enableEnterNavigation(form, { focusSubmitOnLast: true });
    }
  }
};
