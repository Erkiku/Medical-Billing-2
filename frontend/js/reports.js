// ============================================================================
// MedEduHub - Reports & GST Screen (js/reports.js)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.reports = {
  async render(container) {
    const bills = await MedHub.api.getBills();
    const lockActive = MedHub.api.isEditSecurityEnabled();
    const canViewDetails = MedHub.api.canShowEditControls();

    if (lockActive && !canViewDetails) {
      container.innerHTML = `
        <div class="reports-page-wrap">
          <div class="page-header-flex">
            <div>
              <h2 class="page-title">Reports & GST Compliance</h2>
              <p class="page-subtitle">Sales turnover, tax breakdown & Schedule H audit details are protected</p>
            </div>
            <div class="header-action-btns">
              <button type="button" class="btn-unlock-edit" id="btn-unlock-reports-edit">
                🔒 Unlock Full Details
              </button>
            </div>
          </div>
          ${MedHub.renderSecurityLockedPanel({
            title: "Reports & GST Details Hidden",
            message: "Gross sales, GST tax totals, and Schedule H / H1 transaction registers remain hidden until you enter your Security PIN.",
            metaBadge: `${bills.length} Sales Records`,
            buttonId: "btn-unlock-reports-panel",
            buttonLabel: "🔒 Enter PIN to View Reports & GST Details"
          })}
        </div>
      `;
      const doUnlock = async () => {
        if (await MedHub.api.promptUnlockEditMode("Reports & GST Full Details")) {
          this.render(container);
        }
      };
      container.querySelector("#btn-unlock-reports-edit")?.addEventListener("click", doUnlock);
      container.querySelector("#btn-unlock-reports-panel")?.addEventListener("click", doUnlock);
      return;
    }

    const totalSales = bills.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
    const taxableSales = totalSales / 1.12; // Approx 12% GST average
    const totalGst = totalSales - taxableSales;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    // Filter Schedule H / H1 items across bills
    const scheduleHItems = [];
    bills.forEach(b => {
      (b.items || []).forEach(it => {
        if (it.drug_schedule && it.drug_schedule.includes("H")) {
          scheduleHItems.push({
            bill_no: b.bill_no,
            date: b.bill_date,
            customer_name: b.customer_name,
            patient_address: b.patient_address,
            doctor_name: b.doctor_name,
            medicine_name: it.medicine_name || it.name,
            salt: it.salt_composition || "",
            batch_no: it.batch_no,
            quantity: it.quantity,
            schedule: it.drug_schedule
          });
        }
      });
    });

    container.innerHTML = `
      <div class="reports-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Reports & GST Compliance</h2>
            <p class="page-subtitle">GSTR-1 sales tax breakdown & Schedule H / H1 drug audit register for FDA inspection</p>
          </div>
          <div class="header-action-btns">
            ${lockActive ? `
              <button type="button" class="btn-lock-edit" id="btn-lock-reports-edit" title="Hide and lock details">
                🔓 Lock Details
              </button>
            ` : ""}
            <button type="button" class="btn-outline" id="btn-export-gst">
              ${MedHub.icons.download} Download GST Excel
            </button>
            <button type="button" class="btn-primary" id="btn-export-schedule-h">
              ${MedHub.icons.download} Export Schedule H Register
            </button>
          </div>
        </div>

        <!-- GST KPI METRICS -->
        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Total Gross Sales</span>
            <span class="stat-value">${MedHub.rupee(totalSales)}</span>
            <span class="stat-note">Including GST</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Taxable Turnover</span>
            <span class="stat-value">${MedHub.rupee(taxableSales)}</span>
            <span class="stat-note">Net value before tax</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">CGST (Central Tax)</span>
            <span class="stat-value">${MedHub.rupee(cgst)}</span>
            <span class="stat-note">50% of GST</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">SGST (State Tax)</span>
            <span class="stat-value">${MedHub.rupee(sgst)}</span>
            <span class="stat-note">50% of GST</span>
          </div>
        </div>

        <!-- SCHEDULE H / H1 AUDIT REGISTER -->
        <div class="card table-card" style="margin-top: 24px;">
          <div class="card-header-flex" style="margin-bottom: 12px;">
            <div>
              <h3 class="card-title">Schedule H & H1 Rx Drug Audit Register</h3>
              <p class="sub-text">Mandatory register for Drugs & Cosmetics Rules inspection</p>
            </div>
            <span class="badge-status status-low">${scheduleHItems.length} Rx Transactions</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Date</th>
                  <th>Patient Name & Address</th>
                  <th>Prescribing Doctor</th>
                  <th>Medicine Name & Salt</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                ${scheduleHItems.length ? scheduleHItems.map(it => `
                  <tr>
                    <td><strong>#${it.bill_no}</strong></td>
                    <td>${MedHub.formatDate(it.date)}</td>
                    <td>
                      <strong>${it.customer_name || "Patient"}</strong>
                      ${it.patient_address ? `<div class="sub-text">${it.patient_address}</div>` : ""}
                    </td>
                    <td>${it.doctor_name || "Dr. Rajesh Sharma"}</td>
                    <td>
                      <strong>${it.medicine_name}</strong>
                      ${it.salt ? `<div class="sub-text">${it.salt}</div>` : ""}
                    </td>
                    <td><span class="badge-code">${it.batch_no || "BT-01"}</span></td>
                    <td><strong>${it.quantity}</strong></td>
                    <td><span class="badge-schedule schedule-h">${it.schedule}</span></td>
                  </tr>
                `).join("") : `<tr><td colspan="8" class="table-empty">Koi Schedule H medicine sale abhi tak record nahi hui hai.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Bind lock & exports
    container.querySelector("#btn-lock-reports-edit")?.addEventListener("click", () => {
      MedHub.api.lockEditSession();
      MedHub.toast("Details are now hidden and locked.", "info");
      this.render(container);
    });
    container.querySelector("#btn-export-gst")?.addEventListener("click", () => {
      const gstData = bills.map(b => {
        const taxable = (Number(b.grand_total) || 0) / 1.12;
        const tax = (Number(b.grand_total) || 0) - taxable;
        return {
          "Invoice No": b.bill_no,
          "Date": b.bill_date,
          "Customer Name": b.customer_name || "Cash Customer",
          "Taxable Value (₹)": taxable.toFixed(2),
          "CGST (₹)": (tax / 2).toFixed(2),
          "SGST (₹)": (tax / 2).toFixed(2),
          "Total Invoice (₹)": b.grand_total
        };
      });
      MedHub.exportToExcel(gstData, "GST_GSTR1_Sales", "GSTR1");
    });

    container.querySelector("#btn-export-schedule-h")?.addEventListener("click", () => {
      MedHub.exportToExcel(scheduleHItems, "Schedule_H_Register", "Schedule_H");
    });
  }
};
