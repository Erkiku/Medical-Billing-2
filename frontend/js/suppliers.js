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

    container.innerHTML = `
      <div class="suppliers-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Pharma Suppliers & Distributors</h2>
            <p class="page-subtitle">Manage medicine vendors, GSTIN, Drug License numbers & outstanding payables</p>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-primary" id="btn-open-supplier-modal">
              ${MedHub.icons.plus} Add New Supplier
            </button>
          </div>
        </div>

        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Active Suppliers</span>
            <span class="stat-value">${totalSuppliers}</span>
            <span class="stat-note">Wholesalers & Distributors</span>
          </div>
          <div class="stat-card ${totalPayable > 0 ? 'stat-low' : ''}">
            <span class="stat-label">Outstanding Payable</span>
            <span class="stat-value">${MedHub.rupee(totalPayable)}</span>
            <span class="stat-note">Pending payment to vendors</span>
          </div>
        </div>

        <div class="card table-card" style="margin-top: 20px;">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Supplier Name</th>
                  <th>Contact Phone</th>
                  <th>GSTIN</th>
                  <th>Drug License (DL)</th>
                  <th>Address</th>
                  <th>Balance Due</th>
                </tr>
              </thead>
              <tbody>
                ${this.suppliersList.map((s, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.phone || "—"}</td>
                    <td><span class="badge-code">${s.gstin || "—"}</span></td>
                    <td>${s.dl_no || "—"}</td>
                    <td>${s.address || "—"}</td>
                    <td style="${s.balance > 0 ? 'color:#ef4444;font-weight:700;' : ''}">${MedHub.rupee(s.balance || 0)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div id="supplier-modal-wrap"></div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const self = this;
    container.querySelector("#btn-open-supplier-modal")?.addEventListener("click", () => {
      self.openModal();
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
        this.render(document.getElementById("page-content"));
      }
    });
  }
};
