// ============================================================================
// MedEduHub - Dashboard Overview Screen (js/dashboard.js)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.dashboard = {
  async render(container) {
    const [medicines, bills] = await Promise.all([
      MedHub.api.getMedicines(),
      MedHub.api.getBills()
    ]);

    const totalSales = bills.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
    const totalDue = bills.reduce((sum, b) => sum + (Number(b.due_amount) || 0), 0);
    const lowStockCount = medicines.filter(m => m.status === "low" || m.status === "out").length;
    const lockActive = MedHub.api.isEditSecurityEnabled();
    const canEdit = MedHub.api.canShowEditControls();

    container.innerHTML = `
      <div class="dashboard-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Pharmacy Management Dashboard</h2>
            <p class="page-subtitle">Real-time overview of sales, stock alerts, invoices & fast billing</p>
          </div>
          <div class="header-action-btns">
            ${lockActive && !canEdit ? `
              <button type="button" class="btn-unlock-edit" id="btn-dash-unlock">
                🔒 Unlock Edit Mode
              </button>
            ` : (lockActive ? `
              <button type="button" class="btn-lock-edit" id="btn-dash-lock">
                🔓 Lock Edit
              </button>
            ` : "")}
            <button type="button" class="btn-primary" id="btn-dash-pos">
              ${MedHub.icons.pos} Open POS Billing
            </button>
          </div>
        </div>

        <div class="stats-grid" style="margin-top: 20px;">
          <div class="stat-card">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">${MedHub.rupee(totalSales)}</span>
            <span class="stat-note">${bills.length} invoices generated</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Catalog Medicines</span>
            <span class="stat-value">${medicines.length}</span>
            <span class="stat-note">Active SKUs tracked</span>
          </div>
          <div class="stat-card ${lowStockCount > 0 ? 'stat-low' : ''}">
            <span class="stat-label">Low / Out of Stock</span>
            <span class="stat-value">${lowStockCount}</span>
            <span class="stat-note">Needs urgent reorder</span>
          </div>
          <div class="stat-card ${totalDue > 0 ? 'stat-out' : ''}">
            <span class="stat-label">Customer Dues (Udhaar)</span>
            <span class="stat-value">${MedHub.rupee(totalDue)}</span>
            <span class="stat-note">Credit pending collection</span>
          </div>
        </div>

        <!-- RECENT ACTIVITY GRID -->
        <div class="dashboard-bottom-grid" style="margin-top: 24px;">
          <!-- Recent Invoices -->
          <div class="card">
            <div class="card-header-flex" style="margin-bottom: 12px;">
              <h3 class="card-title">Recent Invoices</h3>
              <button type="button" class="btn-link-sm" id="link-all-invoices">View all</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${bills.slice(0, 5).map(b => `
                  <tr>
                    <td><strong>#${b.bill_no}</strong></td>
                    <td>${b.customer_name || "Walk-in"}</td>
                    <td><strong>${MedHub.rupee(b.grand_total)}</strong></td>
                    <td><span class="badge-status ${b.paid_amount >= b.grand_total ? 'status-paid' : 'status-low'}">${b.paid_amount >= b.grand_total ? 'PAID' : 'DUE'}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Stock Alerts -->
          <div class="card">
            <div class="card-header-flex" style="margin-bottom: 12px;">
              <h3 class="card-title">Low Stock Alerts</h3>
              <button type="button" class="btn-link-sm" id="link-all-stock">View stock</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Pack</th>
                  <th>Available</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${medicines.filter(m => m.status !== "in").slice(0, 5).map(m => `
                  <tr>
                    <td><strong>${m.name}</strong></td>
                    <td>${m.pack_size || "1x10"}</td>
                    <td><strong>${m.available_qty || 0}</strong></td>
                    <td><span class="badge-status ${m.status === 'out' ? 'status-out' : 'status-low'}">${m.status.toUpperCase()}</span></td>
                  </tr>
                `).join("") || `<tr><td colspan="4" class="table-empty">Sabhi medicines stock me hain!</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelector("#btn-dash-unlock")?.addEventListener("click", async () => {
      if (await MedHub.api.promptUnlockEditMode("Edit Options")) {
        this.render(container);
      }
    });
    container.querySelector("#btn-dash-lock")?.addEventListener("click", () => {
      MedHub.api.lockEditSession();
      MedHub.toast("Edit options are now hidden and locked.", "info");
      this.render(container);
    });
    container.querySelector("#btn-dash-pos")?.addEventListener("click", () => {
      MedHub.router.navigate("billing");
    });
    container.querySelector("#link-all-invoices")?.addEventListener("click", () => {
      MedHub.router.navigate("invoices");
    });
    container.querySelector("#link-all-stock")?.addEventListener("click", () => {
      MedHub.router.navigate("inventory");
    });
  }
};

window.addEventListener("medhub:stock_updated", () => {
  if (window.MedHub && window.MedHub.router && window.MedHub.router.currentPage === "dashboard") {
    const pageContent = document.getElementById("page-content");
    if (pageContent) window.MedHub.dashboard.render(pageContent);
  }
});
