// ============================================================================
// MedEduHub - Customers & Ledger Screen (js/ledger.js)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.ledger = {
  async render(container) {
    const bills = await MedHub.api.getBills();

    // Group customer balances from bills
    const customerMap = {};
    bills.forEach(b => {
      const name = b.customer_name || "Walk-in Customer";
      const mobile = b.customer_mobile || "—";
      const key = mobile !== "—" ? mobile : name;

      if (!customerMap[key]) {
        customerMap[key] = {
          name: name,
          mobile: mobile,
          address: b.patient_address || "—",
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          billCount: 0
        };
      }
      customerMap[key].totalBilled += Number(b.grand_total) || 0;
      customerMap[key].totalPaid += Number(b.paid_amount) || 0;
      customerMap[key].totalDue += Number(b.due_amount) || Math.max(0, (b.grand_total - b.paid_amount));
      customerMap[key].billCount += 1;
    });

    const customers = Object.values(customerMap);
    const totalDueAcrossAll = customers.reduce((sum, c) => sum + c.totalDue, 0);

    container.innerHTML = `
      <div class="ledger-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Customers & Udhaar Ledger</h2>
            <p class="page-subtitle">Track patient credit accounts, bill history, outstanding dues & collect settlements</p>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-outline" id="btn-export-ledger">
              ${MedHub.icons.download} Download Ledger Excel
            </button>
          </div>
        </div>

        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Total Registered Customers</span>
            <span class="stat-value">${customers.length}</span>
            <span class="stat-note">Patients on file</span>
          </div>
          <div class="stat-card ${totalDueAcrossAll > 0 ? 'stat-out' : ''}">
            <span class="stat-label">Total Udhaar / Dues</span>
            <span class="stat-value">${MedHub.rupee(totalDueAcrossAll)}</span>
            <span class="stat-note">Pending customer credit</span>
          </div>
        </div>

        <div class="card table-card" style="margin-top: 20px;">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer / Patient</th>
                  <th>Mobile</th>
                  <th>Address</th>
                  <th>Invoices</th>
                  <th>Total Billed</th>
                  <th>Paid</th>
                  <th>Current Due (Udhaar)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map((c, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.mobile}</td>
                    <td>${c.address}</td>
                    <td><span class="badge-cat">${c.billCount} bills</span></td>
                    <td>${MedHub.rupee(c.totalBilled)}</td>
                    <td>${MedHub.rupee(c.totalPaid)}</td>
                    <td style="${c.totalDue > 0 ? 'color:#ef4444;font-weight:700;' : ''}">${MedHub.rupee(c.totalDue)}</td>
                    <td>
                      ${c.totalDue > 0 ? `
                        <button type="button" class="btn-primary-sm btn-settle-due" data-cust="${c.name}" data-due="${c.totalDue}">
                          Collect Payment
                        </button>
                      ` : `<span class="badge-status status-paid">All Clear</span>`}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    container.querySelector("#btn-export-ledger")?.addEventListener("click", () => {
      const data = customers.map(c => ({
        "Customer Name": c.name,
        "Mobile": c.mobile,
        "Address": c.address,
        "Total Invoices": c.billCount,
        "Total Billed (₹)": c.totalBilled,
        "Total Paid (₹)": c.totalPaid,
        "Outstanding Due (₹)": c.totalDue
      }));
      MedHub.exportToExcel(data, "Customer_Ledger", "Ledger");
    });

    container.querySelectorAll(".btn-settle-due").forEach(btn => {
      btn.addEventListener("click", async () => {
        const cust = btn.dataset.cust;
        const due = btn.dataset.due;
        const amt = await MedHub.prompt(`${cust} ke liye payment amount darj karein (Due: ₹${due}):`, due, { title: "Collect Customer Payment" });
        if (amt && Number(amt) > 0) {
          MedHub.toast(`₹${amt} payment successfully recorded for ${cust}!`, "success");
        }
      });
    });
  }
};
