// ============================================================================
// MedEduHub - Suppliers Screen (js/suppliers.js)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.suppliers = {
  suppliersList: [],

  async render(container) {
    this.suppliersList = await MedHub.api.getSuppliers();

    const totalSuppliers = this.suppliersList.length;
    const totalPayable = this.suppliersList.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    const lockActive = MedHub.api.isEditSecurityEnabled();
    const canViewDetails = MedHub.api.canShowEditControls();

    if (lockActive && !canViewDetails) {
      container.innerHTML = `
        <div class="suppliers-page-wrap">
          <div class="page-header-flex">
            <div>
              <h2 class="page-title">Pharma Suppliers & Distributors</h2>
              <p class="page-subtitle">Vendor contacts, GSTIN, Drug License & outstanding payables are protected</p>
            </div>
            <div class="header-action-btns">
              <button type="button" class="btn-unlock-edit" id="btn-unlock-sup-edit">
                🔒 Unlock Full Details
              </button>
            </div>
          </div>
          ${MedHub.renderSecurityLockedPanel({
            title: "Supplier Details Hidden",
            message: "All supplier contact numbers, GSTIN, Drug Licenses, payables, and Edit/Delete options remain hidden until you enter your Security PIN.",
            metaBadge: `${totalSuppliers} Active Suppliers`,
            buttonId: "btn-unlock-sup-panel",
            buttonLabel: "🔒 Enter PIN to View Supplier Details"
          })}
        </div>
        <div id="supplier-modal-wrap"></div>
      `;
      const doUnlock = async () => {
        if (await MedHub.api.promptUnlockEditMode("Suppliers Full Details")) {
          this.render(container);
        }
      };
      container.querySelector("#btn-unlock-sup-edit")?.addEventListener("click", doUnlock);
      container.querySelector("#btn-unlock-sup-panel")?.addEventListener("click", doUnlock);
      return;
    }

    container.innerHTML = `
      <div class="suppliers-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Pharma Suppliers & Distributors</h2>
            <p class="page-subtitle">Manage medicine vendors, GSTIN, Drug License numbers & outstanding payables</p>
          </div>
          <div class="header-action-btns">
            ${lockActive ? `
              <button type="button" class="btn-lock-edit" id="btn-lock-sup-edit" title="Hide and lock details">
                🔓 Lock Details
              </button>
            ` : ""}
            <button type="button" class="btn-primary" id="btn-open-supplier-modal">
              ${MedHub.icons.plus} Add New Supplier
            </button>
          </div>
        </div>

        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Active Suppliers</span>
            <span class="stat-value" id="sup-kpi-count">${totalSuppliers}</span>
            <span class="stat-note">Wholesalers & Distributors</span>
          </div>
          <div class="stat-card ${totalPayable > 0 ? 'stat-low' : ''}" id="sup-kpi-card-payable">
            <span class="stat-label">Outstanding Payable</span>
            <span class="stat-value" id="sup-kpi-payable">${MedHub.rupee(totalPayable)}</span>
            <span class="stat-note">Pending payment to vendors</span>
          </div>
        </div>

        <div class="card table-card" style="margin-top: 20px;">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Supplier Name</th>
                  <th>Contact Phone</th>
                  <th>GSTIN</th>
                  <th>Drug License (DL)</th>
                  <th>Address</th>
                  <th>Balance Due</th>
                  <th style="width: 145px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody id="suppliers-tbody">
                ${this.renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="supplier-modal-wrap"></div>
    `;

    this.bindEvents(container);
  },

  renderTableRows() {
    if (!this.suppliersList.length) {
      return `<tr><td colspan="8" class="table-empty">Koi supplier nahi mila. "Add New Supplier" par click karein.</td></tr>`;
    }
    return this.suppliersList.map((s, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.phone || "—"}</td>
        <td><span class="badge-code">${s.gstin || "—"}</span></td>
        <td>${s.dl_no || "—"}</td>
        <td>${s.address || "—"}</td>
        <td style="${s.balance > 0 ? 'color:#ef4444;font-weight:700;' : ''}">${MedHub.rupee(s.balance || 0)}</td>
        <td class="cell-nowrap table-actions-cell" style="justify-content: center;">
          <button type="button" class="btn-action-edit btn-edit-supplier" data-id="${s.id}" title="Edit Supplier Details">
            Edit
          </button>
          <button type="button" class="btn-action-delete btn-delete-supplier" data-id="${s.id}" title="Delete Supplier">
            Delete
          </button>
        </td>
      </tr>
    `).join("");
  },

  updateStatsAndTable() {
    const totalSuppliers = this.suppliersList.length;
    const totalPayable = this.suppliersList.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);

    const elCount = document.getElementById("sup-kpi-count");
    if (elCount) elCount.innerText = totalSuppliers;

    const elPayable = document.getElementById("sup-kpi-payable");
    if (elPayable) elPayable.innerText = MedHub.rupee(totalPayable);

    const cardPayable = document.getElementById("sup-kpi-card-payable");
    if (cardPayable) {
      if (totalPayable > 0) cardPayable.classList.add("stat-low");
      else cardPayable.classList.remove("stat-low");
    }

    const tbody = document.getElementById("suppliers-tbody");
    if (tbody) tbody.innerHTML = this.renderTableRows();
  },

  bindEvents(container) {
    const self = this;
    container.querySelector("#btn-lock-sup-edit")?.addEventListener("click", () => {
      MedHub.api.lockEditSession();
      MedHub.toast("Details are now hidden and locked.", "info");
      self.render(container);
    });
    container.querySelector("#btn-open-supplier-modal")?.addEventListener("click", () => {
      self.openModal();
    });

    container.addEventListener("click", async (e) => {
      const editBtn = e.target.closest(".btn-edit-supplier");
      if (editBtn) {
        const id = editBtn.dataset.id;
        const sup = self.suppliersList.find(s => String(s.id) === String(id));
        if (sup) self.openEditModal(sup);
        return;
      }

      const delBtn = e.target.closest(".btn-delete-supplier");
      if (delBtn) {
        const id = delBtn.dataset.id;
        const sup = self.suppliersList.find(s => String(s.id) === String(id));
        if (sup && await MedHub.confirm(`Kya aap supplier '${sup.name}' ko delete karna chahte hain?`)) {
          const ok = await MedHub.api.deleteSupplier(id);
          if (ok) {
            MedHub.toast(`Supplier '${sup.name}' delete ho gaya`, "success");
            self.suppliersList = await MedHub.api.getSuppliers();
            self.updateStatsAndTable();
          } else {
            MedHub.toast("Supplier delete karne me samasya aayi", "error");
          }
        }
        return;
      }
    });
  },

  openEditModal(sup) {
    const modalWrap = document.getElementById("supplier-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 600px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Edit Supplier / Distributor</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-edit-sup-modal">${MedHub.icons.close}</button>
          </div>
          <form id="edit-supplier-form" class="modal-dialog-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Distributor / Agency Name <span class="req">*</span></label>
                <input type="text" id="edit-s-name" class="input-field" value="${sup.name || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span class="req">*</span></label>
                <input type="tel" id="edit-s-phone" class="input-field" value="${sup.phone || ''}" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">GSTIN</label>
                <input type="text" id="edit-s-gstin" class="input-field" value="${sup.gstin || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License No</label>
                <input type="text" id="edit-s-dl" class="input-field" value="${sup.dl_no || ''}" />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Warehouse / Office Address</label>
                <input type="text" id="edit-s-address" class="input-field" value="${sup.address || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Balance Due (₹)</label>
                <input type="number" step="0.01" id="edit-s-balance" class="input-field" value="${sup.balance || 0}" />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 24px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-edit-sup-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeEditModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-edit-sup-modal")?.addEventListener("click", closeEditModal);
    document.getElementById("btn-cancel-edit-sup-modal")?.addEventListener("click", closeEditModal);

    document.getElementById("edit-supplier-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("edit-s-name").value.trim();
      const phone = document.getElementById("edit-s-phone").value.trim();
      const gstin = document.getElementById("edit-s-gstin").value.trim();
      const dl_no = document.getElementById("edit-s-dl").value.trim();
      const address = document.getElementById("edit-s-address").value.trim();
      const balance = parseFloat(document.getElementById("edit-s-balance").value) || 0.00;

      const updated = await MedHub.api.updateSupplier(sup.id, { name, phone, gstin, dl_no, address, balance });
      if (updated) {
        MedHub.toast(`Supplier "${name}" update ho gaya!`, "success");
        closeEditModal();
        this.suppliersList = await MedHub.api.getSuppliers();
        this.updateStatsAndTable();
      }
    });
  },

  openModal() {
    const modalWrap = document.getElementById("supplier-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 600px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Add New Supplier / Distributor</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-sup-modal">${MedHub.icons.close}</button>
          </div>
          <form id="supplier-form" class="modal-dialog-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Distributor / Agency Name <span class="req">*</span></label>
                <input type="text" id="s-name" class="input-field" placeholder="e.g. Mankind Pharma Agency" required />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number <span class="req">*</span></label>
                <input type="tel" id="s-phone" class="input-field" placeholder="10-digit number" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">GSTIN</label>
                <input type="text" id="s-gstin" class="input-field" placeholder="27XXXXX1234X1ZX" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License No</label>
                <input type="text" id="s-dl" class="input-field" placeholder="MH-XX-123456" />
              </div>
            </div>

            <div class="form-row-1" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Warehouse / Office Address</label>
                <input type="text" id="s-address" class="input-field" placeholder="e.g. Gala 4, Pharma Hub, Bhiwandi" />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 24px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-sup-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save">Save Supplier</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-sup-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-sup-modal")?.addEventListener("click", closeModal);

    document.getElementById("supplier-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("s-name").value.trim();
      const phone = document.getElementById("s-phone").value.trim();
      const gstin = document.getElementById("s-gstin").value.trim();
      const dl_no = document.getElementById("s-dl").value.trim();
      const address = document.getElementById("s-address").value.trim();

      const created = await MedHub.api.createSupplier({ name, phone, gstin, dl_no, address });
      if (created) {
        MedHub.toast(`Supplier "${name}" saved!`, "success");
        closeModal();
        this.suppliersList = await MedHub.api.getSuppliers();
        this.updateStatsAndTable();
      }
    });
  }
};
