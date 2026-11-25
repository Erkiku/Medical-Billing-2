// ============================================================================
// MedEduHub - Store Settings Screen (js/settings.js)
// Redesigned to exact UI of Screenshot 2 (Store Profile & Regulatory Numbers)
// Real-time topbar update for any store name change!
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.settings = {
  async render(container) {
    const store = await MedHub.api.getStoreSettings();
    const s = { ...MedHub.state.store, ...store };

    container.innerHTML = `
      <div class="settings-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Store & Database Settings</h2>
            <p class="page-subtitle">Configure medical store profile, DL/GST compliance numbers & Supabase cloud sync</p>
          </div>
          <div class="header-action-btns">
            <button type="submit" form="full-store-settings-form" class="btn-primary" id="btn-save-settings-top">
              ${MedHub.icons.check} Save Store Profile
            </button>
          </div>
        </div>

        <form id="full-store-settings-form" class="settings-page-wrap">
          <!-- CARD 1: STORE PROFILE & PRINTED BILL HEADER (Screenshot 2) -->
          <div class="settings-card">
            <div class="settings-card-header">
              <span class="settings-card-icon">${MedHub.icons.store}</span>
              <h3 class="settings-card-title">STORE PROFILE & PRINTED BILL HEADER</h3>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Pharmacist In-Charge Name <span class="req">*</span></label>
                <input type="text" id="st-pharmacist-name" class="input-field" placeholder="e.g. Dr. Anil Kumar" value="${s.pharmacist_name || MedHub.state.user?.name || ""}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Medical Store Name <span class="req">*</span></label>
                <input type="text" id="st-name" class="input-field" placeholder="e.g. SAGAR MEDICAL STORE" value="${s.store_name || ""}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Tagline / Subheading</label>
                <input type="text" id="st-tagline" class="input-field" placeholder="Retail & Wholesale Chemists" value="${s.tagline || "Retail & Wholesale Chemists"}" />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Address / Street</label>
                <input type="text" id="st-address" class="input-field" placeholder="e.g. Shop 4, Medical Plaza, Main Road" value="${s.address || ""}" />
              </div>
              <div class="form-group">
                <label class="form-label">City</label>
                <input type="text" id="st-city" class="input-field" placeholder="e.g. New Delhi" value="${s.city || ""}" />
              </div>
            </div>

            <div class="form-row-3" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">State</label>
                <input type="text" id="st-state" class="input-field" placeholder="e.g. Delhi" value="${s.state || ""}" />
              </div>
              <div class="form-group">
                <label class="form-label">PIN Code</label>
                <input type="text" id="st-pincode" class="input-field" placeholder="110001" value="${s.pincode || ""}" />
              </div>
              <div class="form-group">
                <label class="form-label">Store Phone / Contact <span class="req">*</span></label>
                <input type="tel" id="st-phone" class="input-field" placeholder="10-digit number" value="${s.phone || ""}" required />
              </div>
            </div>
          </div>

          <!-- CARD 2: DRUG LICENSE & GST REGULATORY NUMBERS (Screenshot 2) -->
          <div class="settings-card">
            <div class="settings-card-header">
              <span class="settings-card-icon">${MedHub.icons.shield}</span>
              <h3 class="settings-card-title">DRUG LICENSE & GST REGULATORY NUMBERS</h3>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">GSTIN (15 Digits)</label>
                <input type="text" id="st-gstin" class="input-field" placeholder="07AAAAA0000A1Z5 (Optional)" maxlength="15" style="text-transform: uppercase;" value="${s.gstin || ""}" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (DL No. 20B) <span class="req">*</span></label>
                <input type="text" id="st-dl20" class="input-field" placeholder="DL-20B-123456" value="${s.dl_no_20b || s.drug_license_no || ""}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (DL No. 21B)</label>
                <input type="text" id="st-dl21" class="input-field" placeholder="DL-21B-654321" value="${s.dl_no_21b || ""}" />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">FSSAI Registration No.</label>
                <input type="text" id="st-fssai" class="input-field" placeholder="10012345678901" value="${s.fssai_no || ""}" />
              </div>
              <div class="form-group">
                <label class="form-label">Store UPI ID for Digital Payments</label>
                <input type="text" id="st-upi" class="input-field" placeholder="e.g. 9876543210@paytm or store@okaxis" value="${s.upi_id || ""}" />
              </div>
            </div>

            <!-- PAYMENT QR CODE MANAGER (IMAGE UPLOAD & CUSTOM QR) -->
            <div style="margin-top: 18px; padding: 18px; border: 1.5px dashed var(--cream-border-dark); border-radius: 12px; background: var(--cream-surface);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
                <div>
                  <h4 style="font-size: 14px; font-weight: 800; color: var(--black-deep); display: flex; align-items: center; gap: 8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Store Payment QR Code (Prints on Invoices & Counter)
                  </h4>
                  <p style="font-size: 12px; color: var(--black-soft); margin-top: 4px;">Har medical store login karke apna khud ka official QR code (PhonePe, GPay, Paytm, BharatPe ya Bank standee) upload kar sakta hai.</p>
                </div>
                <span id="qr-preview-badge" class="badge-status ${s.custom_qr_image ? 'status-paid' : 'status-low'}">
                  ${s.custom_qr_image ? 'Custom QR Uploaded' : 'Auto UPI QR'}
                </span>
              </div>

              <div style="display: flex; gap: 24px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
                <div style="background: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid var(--cream-border); width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <img id="qr-preview-img" src="${s.custom_qr_image || (s.upi_id ? `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`upi://pay?pa=${s.upi_id}&pn=${encodeURIComponent(s.payee_name || s.store_name || "Pharmacy")}&cu=INR`)}` : 'https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=upi://pay?pa=sagarstore@upi')}" alt="Store QR" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                </div>

                <div style="flex: 1; min-width: 250px;">
                  <div class="form-group">
                    <label class="form-label">Payee / Account Name</label>
                    <input type="text" id="st-payee" class="input-field" placeholder="e.g. SAGAR MEDICAL STORE" value="${s.payee_name || s.store_name || ""}" />
                  </div>

                  <div style="display: flex; gap: 10px; align-items: center; margin-top: 12px; flex-wrap: wrap;">
                    <label for="st-qr-upload" class="btn-outline-sm" style="cursor: pointer; padding: 7px 14px; background: #ffffff;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Apna Shop QR Upload Karein
                    </label>
                    <input type="file" id="st-qr-upload" accept="image/*" style="display: none;" />

                    <button type="button" class="btn-text-danger" id="btn-reset-qr" style="display: ${s.custom_qr_image ? 'inline-flex' : 'none'};">
                      ${MedHub.icons.close} Remove & Use Auto UPI QR
                    </button>
                  </div>
                  <input type="hidden" id="st-custom-qr-base64" value="${s.custom_qr_image || ""}" />
                </div>
              </div>
            </div>

            <div class="form-row-1" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Invoice Terms & Conditions (Prints on bottom of A4 Invoice)</label>
                <textarea id="st-terms" class="textarea-field" placeholder="Terms and conditions for invoice prints...">${s.bill_terms || s.bill_footer || "Dawai wapas nahi hogi. Get well soon!"}</textarea>
              </div>
            </div>

            <div style="margin-top: 18px;">
              <button type="submit" class="btn-primary">Save All Store Profile Details</button>
            </div>
          </div>
        </form>
      </div>
    `;

    // Live form submission
    const form = container.querySelector("#full-store-settings-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const pharmacistName = document.getElementById("st-pharmacist-name")?.value.trim() || "Dr. Anil Kumar";
      const storeName = document.getElementById("st-name").value.trim();
      const tagline = document.getElementById("st-tagline").value.trim();
      const address = document.getElementById("st-address").value.trim();
      const city = document.getElementById("st-city").value.trim();
      const state = document.getElementById("st-state").value.trim();
      const pincode = document.getElementById("st-pincode").value.trim();
      const phone = document.getElementById("st-phone").value.trim();
      const gstin = document.getElementById("st-gstin").value.trim().toUpperCase();
      if (gstin && gstin.length !== 15) {
        MedHub.toast("GSTIN 15 characters ka hona chahiye (ya khali chhod dein agar GST unregistered hai)", "warning");
        return;
      }
      const dl20 = document.getElementById("st-dl20").value.trim();
      const dl21 = document.getElementById("st-dl21").value.trim();
      const fssai = document.getElementById("st-fssai").value.trim();
      const upi = document.getElementById("st-upi").value.trim();
      const payee = document.getElementById("st-payee") ? document.getElementById("st-payee").value.trim() : storeName;
      const customQr = document.getElementById("st-custom-qr-base64") ? document.getElementById("st-custom-qr-base64").value.trim() : "";
      const terms = document.getElementById("st-terms").value.trim();

      const payload = {
        pharmacist_name: pharmacistName,
        store_name: storeName,
        tagline,
        address,
        city,
        state,
        pincode,
        phone,
        gstin,
        dl_no_20b: dl20,
        dl_no_21b: dl21,
        drug_license_no: dl20,
        fssai_no: fssai,
        upi_id: upi,
        payee_name: payee,
        custom_qr_image: customQr,
        bill_terms: terms,
        bill_footer: terms
      };

      // REAL-TIME UPDATE TO TOPBAR & SIDEBAR USER BADGE
      MedHub.updateStoreHeader(payload);
      MedHub.updateUserBadge(pharmacistName);

      // SAVE TO SUPABASE & LOCAL
      await MedHub.api.saveStoreSettings(payload);
      MedHub.toast(`Store "${storeName}" profile successfully saved! Topbar updated in real time.`, "success");
    });

    // QR Code Image Upload and Reset Handlers
    const qrUploadInput = container.querySelector("#st-qr-upload");
    const qrPreviewImg = container.querySelector("#qr-preview-img");
    const qrHiddenInput = container.querySelector("#st-custom-qr-base64");
    const qrBadge = container.querySelector("#qr-preview-badge");
    const btnResetQr = container.querySelector("#btn-reset-qr");
    const stUpiInput = container.querySelector("#st-upi");

    qrUploadInput?.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          MedHub.toast("QR image size 2MB se kam honi chahiye", "warning");
          return;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64 = evt.target.result;
          if (qrHiddenInput) qrHiddenInput.value = base64;
          if (qrPreviewImg) qrPreviewImg.src = base64;
          if (qrBadge) {
            qrBadge.className = "badge-status status-paid";
            qrBadge.textContent = "Custom QR Uploaded";
          }
          if (btnResetQr) btnResetQr.style.display = "inline-flex";
          MedHub.toast("Shop QR code image select ho gayi! Save button daba kar confirm karein.", "success");
        };
        reader.readAsDataURL(file);
      }
    });

    btnResetQr?.addEventListener("click", () => {
      if (qrHiddenInput) qrHiddenInput.value = "";
      const upiVal = stUpiInput?.value.trim() || "sagarstore@upi";
      if (qrPreviewImg) {
        qrPreviewImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`upi://pay?pa=${upiVal}&pn=Store&cu=INR`)}`;
      }
      if (qrBadge) {
        qrBadge.className = "badge-status status-low";
        qrBadge.textContent = "Auto UPI QR";
      }
      btnResetQr.style.display = "none";
      MedHub.toast("Custom QR reset ho gaya, ab auto UPI QR use hoga.", "info");
    });

    stUpiInput?.addEventListener("input", (e) => {
      if (!qrHiddenInput || !qrHiddenInput.value) {
        const upiVal = e.target.value.trim() || "sagarstore@upi";
        if (qrPreviewImg) {
          qrPreviewImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`upi://pay?pa=${upiVal}&pn=Store&cu=INR`)}`;
        }
      }
    });

    // Real-time typing reflection in topbar
    const stNameInput = container.querySelector("#st-name");
    stNameInput?.addEventListener("input", (e) => {
      MedHub.updateStoreHeader({ store_name: e.target.value.trim() || "SAGAR MEDICAL STORE" });
    });

    const stGstinInput = container.querySelector("#st-gstin");
    stGstinInput?.addEventListener("input", (e) => {
      e.target.value = e.target.value.toUpperCase();
      MedHub.updateStoreHeader({ gstin: e.target.value.trim() });
    });

    const stDlInput = container.querySelector("#st-dl20");
    stDlInput?.addEventListener("input", (e) => {
      MedHub.updateStoreHeader({ dl_no_20b: e.target.value.trim(), drug_license_no: e.target.value.trim() });
    });

    const stDl21Input = container.querySelector("#st-dl21");
    stDl21Input?.addEventListener("input", (e) => {
      MedHub.updateStoreHeader({ dl_no_21b: e.target.value.trim() });
    });

    const stPharmaNameInput = container.querySelector("#st-pharmacist-name");
    stPharmaNameInput?.addEventListener("input", (e) => {
      MedHub.updateUserBadge(e.target.value.trim() || "Pharmacist Admin");
    });
  }
};
