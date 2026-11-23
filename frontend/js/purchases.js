// ============================================================================
// MedEduHub - Purchases & Stock Inward Screen (js/purchases.js)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.purchases = {
  purchasesList: [],

  async render(container) {
    this.purchasesList = await MedHub.api.getPurchases();
    const suppliers = await MedHub.api.getSuppliers();

    const totalPurchases = this.purchasesList.length;
    const totalAmount = this.purchasesList.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

    container.innerHTML = `
      <div class="purchases-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Purchases & Inward Stock</h2>
            <p class="page-subtitle">Record supplier purchase bills, auto-update medicine stock batches & track vendor payments</p>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-outline" id="btn-export-purchases">
              ${MedHub.icons.download} Download Excel
            </button>
            <button type="button" class="btn-primary" id="btn-open-purchase-modal">
              ${MedHub.icons.plus} Record New Purchase
            </button>
          </div>
        </div>

        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Total Inward Orders</span>
            <span class="stat-value">${totalPurchases}</span>
            <span class="stat-note">Purchase invoices logged</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Stock Purchased</span>
            <span class="stat-value">${MedHub.rupee(totalAmount)}</span>
            <span class="stat-note">Procurement expenditure</span>
          </div>
        </div>

        <div class="card table-card" style="margin-top: 20px;">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Supplier Name</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.purchasesList.length ? this.purchasesList.map(p => `
                  <tr>
                    <td><strong>${p.invoice_no || "INV-NEW"}</strong></td>
                    <td>${MedHub.formatDate(p.purchase_date)}</td>
                    <td>${p.supplier_name || "Pharma Distributor"}</td>
                    <td><strong>${MedHub.rupee(p.total_amount)}</strong></td>
                    <td>${MedHub.rupee(p.paid_amount || p.total_amount)}</td>
                    <td><span class="badge-status status-in">${p.status || "RECEIVED"}</span></td>
                  </tr>
                `).join("") : `<tr><td colspan="6" class="table-empty">Koi purchase record nahi hai. "Record New Purchase" par click karein.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- NEW PURCHASE MODAL -->
      <div id="new-purchase-modal-wrap"></div>
    `;

    this.bindEvents(container, suppliers);
  },

  bindEvents(container, suppliers) {
    const self = this;

    // Export Excel
    container.querySelector("#btn-export-purchases")?.addEventListener("click", () => {
      const data = self.purchasesList.map(p => ({
        "Invoice No": p.invoice_no,
        "Purchase Date": p.purchase_date,
        "Supplier Name": p.supplier_name,
        "Total Amount (₹)": p.total_amount,
        "Paid Amount (₹)": p.paid_amount,
        "Status": p.status
      }));
      MedHub.exportToExcel(data, "Purchases_Record", "Purchases");
    });

    // Open Modal
    container.querySelector("#btn-open-purchase-modal")?.addEventListener("click", () => {
      self.openNewPurchaseModal(suppliers);
    });
  },

  openNewPurchaseModal(suppliers) {
    const modalWrap = document.getElementById("new-purchase-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 650px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Record Supplier Purchase</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-pur-modal">${MedHub.icons.close}</button>
          </div>
          <form id="purchase-form" class="modal-dialog-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Supplier <span class="req">*</span></label>
                <select id="pur-supplier" class="input-field select-field" required>
                  <option value="">Select Supplier</option>
                  ${suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join("")}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Supplier Invoice No <span class="req">*</span></label>
                <input type="text" id="pur-inv-no" class="input-field" placeholder="e.g. INV-98210" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Purchase Date</label>
                <input type="date" id="pur-date" class="input-field" value="${new Date().toISOString().slice(0, 10)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Total Invoice Amount (₹) <span class="req">*</span></label>
                <input type="number" step="0.01" id="pur-amount" class="input-field" placeholder="12500.00" required />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 24px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-pur-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save">Save Purchase</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-pur-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-pur-modal")?.addEventListener("click", closeModal);

    document.getElementById("purchase-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const supplierName = document.getElementById("pur-supplier").value;
      const invoiceNo = document.getElementById("pur-inv-no").value;
      const date = document.getElementById("pur-date").value;
      const amt = Number(document.getElementById("pur-amount").value);

      const saved = await MedHub.api.createPurchase({
        supplier_name: supplierName,
        invoice_no: invoiceNo,
        purchase_date: date,
        total_amount: amt,
        paid_amount: amt,
        status: "RECEIVED"
      });

      if (saved) {
        MedHub.toast(`Purchase invoice "${invoiceNo}" saved!`, "success");
        closeModal();
        this.render(document.getElementById("page-content"));
      }
    });
  }
};
