// ============================================================================
// MedEduHub - Invoices & Bills Screen (js/invoices.js)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.invoices = {
  billsList: [],
  searchFilter: "",

  async render(container) {
    this.billsList = await MedHub.api.getBills();

    const totalBills = this.billsList.length;
    const totalSales = this.billsList.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
    const totalDue = this.billsList.reduce((sum, b) => sum + (Number(b.due_amount) || 0), 0);

    container.innerHTML = `
      <div class="invoices-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Invoices & Bills</h2>
            <p class="page-subtitle">View past sales receipts, customer credit dues, print duplicate invoices & export GST records</p>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-outline" id="btn-export-bills-excel">
              ${MedHub.icons.download} Download Excel
            </button>
            <button type="button" class="btn-outline" id="btn-export-bills-pdf">
              ${MedHub.icons.print} Download PDF
            </button>
          </div>
        </div>

        <!-- STATS -->
        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Total Invoices</span>
            <span class="stat-value">${totalBills}</span>
            <span class="stat-note">Lifetime bills issued</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">${MedHub.rupee(totalSales)}</span>
            <span class="stat-note">All sales combined</span>
          </div>
          <div class="stat-card ${totalDue > 0 ? 'stat-out' : ''}">
            <span class="stat-label">Total Outstanding Dues</span>
            <span class="stat-value">${MedHub.rupee(totalDue)}</span>
            <span class="stat-note">Customer credit balance</span>
          </div>
        </div>

        <!-- FILTER -->
        <div class="card filter-bar-card" style="margin-top: 20px;">
          <div class="filter-bar-flex">
            <div class="search-input-wrap-sm" style="flex: 1; max-width: 400px;">
              <span class="search-icon">${MedHub.icons.search}</span>
              <input type="text" id="bill-search-input" placeholder="Search by Bill No, Customer Name, Mobile, Doctor..." value="${this.searchFilter}" />
            </div>
          </div>
        </div>

        <!-- BILLS TABLE -->
        <div class="card table-card" style="margin-top: 16px;">
          <div class="table-wrap" id="printable-bills-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Doctor</th>
                  <th>Total (₹)</th>
                  <th>Paid (₹)</th>
                  <th>Due (₹)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="bills-tbody">
                ${this.renderRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  getFilteredBills() {
    let list = this.billsList;
    if (this.searchFilter.trim().length > 0) {
      const q = this.searchFilter.trim().toLowerCase();
      list = list.filter(b => 
        String(b.bill_no).includes(q) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.customer_mobile && b.customer_mobile.includes(q)) ||
        (b.doctor_name && b.doctor_name.toLowerCase().includes(q))
      );
    }
    return list;
  },

  renderRows() {
    const list = this.getFilteredBills();
    if (!list.length) {
      return `<tr><td colspan="9" class="table-empty">Koi invoice nahi mila.</td></tr>`;
    }

    return list.map((b) => {
      const isPaid = (b.paid_amount >= b.grand_total);
      const isPartial = (b.paid_amount > 0 && b.paid_amount < b.grand_total);
      const statusBadge = isPaid ? `<span class="badge-status status-paid">PAID</span>` :
        (isPartial ? `<span class="badge-status status-low">PARTIAL</span>` : `<span class="badge-status status-out">UNPAID</span>`);

      return `
        <tr>
          <td><strong>#${b.bill_no}</strong></td>
          <td>${new Date(b.bill_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          <td>
            <strong>${b.customer_name || "Walk-in"}</strong>
            ${b.customer_mobile ? `<div class="sub-text">${b.customer_mobile}</div>` : ""}
          </td>
          <td>${b.doctor_name || "—"}</td>
          <td><strong>${MedHub.rupee(b.grand_total)}</strong></td>
          <td>${MedHub.rupee(b.paid_amount)}</td>
          <td style="${b.due_amount > 0 ? 'color:#ef4444;font-weight:700;' : ''}">${MedHub.rupee(b.due_amount || (b.grand_total - b.paid_amount))}</td>
          <td>${statusBadge}</td>
          <td>
            <button type="button" class="btn-outline-sm btn-view-invoice" data-id="${b.id || b.bill_no}">
              ${MedHub.icons.print} Print
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  bindEvents(container) {
    const self = this;

    const searchInput = container.querySelector("#bill-search-input");
    searchInput?.addEventListener("input", MedHub.debounce((e) => {
      self.searchFilter = e.target.value;
      const tbody = document.getElementById("bills-tbody");
      if (tbody) tbody.innerHTML = self.renderRows();
    }, 200));

    // Export Excel
    container.querySelector("#btn-export-bills-excel")?.addEventListener("click", () => {
      const data = self.getFilteredBills().map(b => ({
        "Bill No": b.bill_no,
        "Date": b.bill_date,
        "Customer Name": b.customer_name || "",
        "Mobile": b.customer_mobile || "",
        "Doctor": b.doctor_name || "",
        "Grand Total (₹)": b.grand_total,
        "Paid Amount (₹)": b.paid_amount,
        "Due Amount (₹)": b.due_amount || (b.grand_total - b.paid_amount),
        "Payment Status": b.payment_status || (b.paid_amount >= b.grand_total ? "PAID" : "DUE")
      }));
      MedHub.exportToExcel(data, "Sales_Invoices", "Invoices");
    });

    // Export PDF
    container.querySelector("#btn-export-bills-pdf")?.addEventListener("click", () => {
      MedHub.exportToPdf("printable-bills-table", "Invoices_Report");
    });

    // View / Print Invoice
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-view-invoice");
      if (btn) {
        const id = btn.dataset.id;
        const bill = self.billsList.find(b => String(b.id) === String(id) || String(b.bill_no) === String(id));
        if (bill) {
          MedHub.billing.showInvoiceModal(bill);
        } else {
          MedHub.toast("Invoice details nahi mili", "warning");
        }
      }
    });
  }
};
