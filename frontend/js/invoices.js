// ============================================================================
// MedEduHub - Invoices & Bills Screen (js/invoices.js)
// Supports Viewing, Printing, Exporting, and Full Invoice / Bill Editing
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.invoices = {
  billsList: [],
  searchFilter: "",

  async render(container) {
    this.billsList = await MedHub.api.getBills();

    const totalBills = this.billsList.length;
    const totalSales = this.billsList.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
    const totalDue = this.billsList.reduce((sum, b) => sum + Math.max(0, Number(b.due_amount !== undefined ? b.due_amount : (Number(b.grand_total || 0) - Number(b.paid_amount || 0)))), 0);

    container.innerHTML = `
      <div class="invoices-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Invoices & Bills</h2>
            <p class="page-subtitle">View past sales receipts, edit bills & customer dues, print duplicate invoices & export GST records</p>
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
            <span class="stat-value" id="bills-kpi-count">${totalBills}</span>
            <span class="stat-note">Lifetime bills issued</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value" id="bills-kpi-sales">${MedHub.rupee(totalSales)}</span>
            <span class="stat-note">All sales combined</span>
          </div>
          <div class="stat-card ${totalDue > 0 ? 'stat-out' : ''}" id="bills-kpi-due-card">
            <span class="stat-label">Total Outstanding Dues</span>
            <span class="stat-value" id="bills-kpi-due">${MedHub.rupee(totalDue)}</span>
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
                  <th style="width: 170px; text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody id="bills-tbody">
                ${this.renderRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- EDIT INVOICE MODAL CONTAINER -->
      <div id="edit-invoice-modal-wrap"></div>
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
      const grand = Number(b.grand_total) || 0;
      const paid = Number(b.paid_amount) || 0;
      const due = Math.max(0, b.due_amount !== undefined ? Number(b.due_amount) : (grand - paid));
      const isPaid = paid >= grand && grand > 0 ? true : (due === 0);
      const isPartial = paid > 0 && due > 0;
      const statusBadge = isPaid ? `<span class="badge-status status-paid">PAID</span>` :
        (isPartial ? `<span class="badge-status status-low">PARTIAL</span>` : `<span class="badge-status status-out">UNPAID</span>`);

      return `
        <tr>
          <td><strong>#${b.bill_no}</strong></td>
          <td>${new Date(b.bill_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          <td>
            <strong>${b.customer_name || "Walk-in Customer"}</strong>
            ${b.customer_mobile ? `<div class="sub-text">${b.customer_mobile}</div>` : ""}
          </td>
          <td>${b.doctor_name || "—"}</td>
          <td><strong>${MedHub.rupee(grand)}</strong></td>
          <td>${MedHub.rupee(paid)}</td>
          <td style="${due > 0 ? 'color:#ef4444;font-weight:700;' : ''}">${MedHub.rupee(due)}</td>
          <td>${statusBadge}</td>
          <td class="cell-nowrap table-actions-cell" style="justify-content: center;">
            <button type="button" class="btn-outline-sm btn-view-invoice" data-id="${b.id || b.bill_no}" title="Print / View Invoice">
              ${MedHub.icons.print} Print
            </button>
            <button type="button" class="btn-action-edit btn-edit-invoice" data-id="${b.id || b.bill_no}" title="Edit Invoice & Items">
              ✏️ Edit
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  updateStatsAndTable() {
    const totalBills = this.billsList.length;
    const totalSales = this.billsList.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
    const totalDue = this.billsList.reduce((sum, b) => sum + Math.max(0, Number(b.due_amount !== undefined ? b.due_amount : (Number(b.grand_total || 0) - Number(b.paid_amount || 0)))), 0);

    const cEl = document.getElementById("bills-kpi-count");
    const sEl = document.getElementById("bills-kpi-sales");
    const dEl = document.getElementById("bills-kpi-due");
    const dCard = document.getElementById("bills-kpi-due-card");
    if (cEl) cEl.innerText = totalBills;
    if (sEl) sEl.innerText = MedHub.rupee(totalSales);
    if (dEl) dEl.innerText = MedHub.rupee(totalDue);
    if (dCard) {
      if (totalDue > 0) dCard.classList.add("stat-out");
      else dCard.classList.remove("stat-out");
    }

    const tbody = document.getElementById("bills-tbody");
    if (tbody) tbody.innerHTML = this.renderRows();
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
        "Due Amount (₹)": Math.max(0, b.due_amount !== undefined ? Number(b.due_amount) : (Number(b.grand_total || 0) - Number(b.paid_amount || 0))),
        "Payment Status": b.payment_status || (b.paid_amount >= b.grand_total ? "PAID" : "DUE")
      }));
      MedHub.exportToExcel(data, "Sales_Invoices", "Invoices");
    });

    // Export PDF
    container.querySelector("#btn-export-bills-pdf")?.addEventListener("click", () => {
      MedHub.exportToPdf("printable-bills-table", "Invoices_Report");
    });

    // View / Print & Edit Invoice
    container.addEventListener("click", (e) => {
      const viewBtn = e.target.closest(".btn-view-invoice");
      if (viewBtn) {
        const id = viewBtn.dataset.id;
        const bill = self.billsList.find(b => String(b.id) === String(id) || String(b.bill_no) === String(id));
        if (bill) {
          MedHub.billing.showInvoiceModal(bill);
        } else {
          MedHub.toast("Invoice details nahi mili", "warning");
        }
        return;
      }

      const editBtn = e.target.closest(".btn-edit-invoice");
      if (editBtn) {
        const id = editBtn.dataset.id;
        const bill = self.billsList.find(b => String(b.id) === String(id) || String(b.bill_no) === String(id));
        if (bill) {
          self.openEditInvoiceModal(bill);
        } else {
          MedHub.toast("Invoice edit karne ke liye data nahi mila", "warning");
        }
      }
    });
  },

  // ==========================================================================
  // FULL INVOICE & BILL EDITING MODAL (Customer, Doctor, Line Items, GST, Dues)
  // ==========================================================================
  openEditInvoiceModal(bill) {
    const modalWrap = document.getElementById("edit-invoice-modal-wrap");
    if (!modalWrap) return;
    const self = this;

    // Clone items so canceling doesn't mutate original bill
    const editableItems = (bill.items && bill.items.length ? bill.items : (bill.bill_items || [])).map(it => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const rate = Number(it.rate) || 0;
      const discPct = Number(it.discount_percent ?? it.discount ?? 0);
      const gstPct = Number(it.gst_percent) || 0;
      const lineTotal = Number(it.line_total) || Math.max(0, (qty * rate) * (1 - discPct / 100));
      return {
        medicine_id: it.medicine_id || null,
        batch_id: it.batch_id || null,
        medicine_name: it.medicine_name || it.name || "Medicine",
        name: it.medicine_name || it.name || "Medicine",
        batch_no: it.batch_no || "BT-01",
        expiry_date: it.expiry_date || "",
        pack_size: it.pack_size || "1x10",
        drug_schedule: it.drug_schedule || "General (OTC / Non-Rx)",
        salt_composition: it.salt_composition || "",
        quantity: qty,
        rate,
        discount_percent: discPct,
        gst_percent: gstPct,
        line_total: Number(lineTotal.toFixed(2))
      };
    });

    const billDiscountInit = Number(bill.discount) || 0;
    const billPaidInit = Number(bill.paid_amount) || 0;
    const payModeInit = (bill.payment_mode || "CASH").toUpperCase();

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 960px; width: 96%; max-height: 92vh; display: flex; flex-direction: column;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">✏️ Edit Invoice / Bill #${bill.bill_no}</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-edit-bill">${MedHub.icons.close}</button>
          </div>

          <form id="edit-invoice-form" class="modal-dialog-body" style="padding: 18px 22px; overflow-y: auto;">
            <!-- CUSTOMER & DOCTOR DETAILS -->
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Patient / Customer Name <span class="req">*</span></label>
                <input type="text" id="eb-cust-name" class="input-field" value="${(bill.customer_name || "Walk-in Customer").replace(/"/g, "&quot;")}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Mobile Number</label>
                <input type="tel" id="eb-cust-mobile" class="input-field" maxlength="10" placeholder="10-digit mobile" value="${bill.customer_mobile || ""}" />
              </div>
              <div class="form-group">
                <label class="form-label">Patient Address</label>
                <input type="text" id="eb-cust-address" class="input-field" placeholder="Address / City" value="${(bill.patient_address || "").replace(/"/g, "&quot;")}" />
              </div>
            </div>

            <div class="form-row-3" style="margin-top: 12px;">
              <div class="form-group">
                <label class="form-label">Prescribing Doctor</label>
                <input type="text" id="eb-doc-name" class="input-field" placeholder="Dr. Name" value="${(bill.doctor_name || "").replace(/"/g, "&quot;")}" />
              </div>
              <div class="form-group">
                <label class="form-label">Doctor Hospital / Address</label>
                <input type="text" id="eb-doc-hosp" class="input-field" placeholder="Clinic / Hospital" value="${(bill.doctor_hospital || "").replace(/"/g, "&quot;")}" />
              </div>
              <div class="form-group">
                <label class="form-label">Payment Mode</label>
                <select id="eb-pay-mode" class="input-field select-field">
                  <option value="CASH" ${payModeInit === "CASH" ? "selected" : ""}>Cash</option>
                  <option value="UPI" ${payModeInit === "UPI" ? "selected" : ""}>UPI / QR</option>
                  <option value="CARD" ${payModeInit === "CARD" ? "selected" : ""}>Card</option>
                  <option value="CREDIT" ${payModeInit === "CREDIT" ? "selected" : ""}>Udhaar / Credit</option>
                </select>
              </div>
            </div>

            <!-- ADD MEDICINE SEARCH BAR INSIDE EDIT MODAL -->
            <div style="margin-top: 16px; position: relative; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1.5px solid var(--cream-border);">
              <label class="form-label" style="margin-bottom: 6px; display: block;">+ Add Another Medicine to This Bill</label>
              <div class="search-input-wrap-sm" style="width: 100%; max-width: none;">
                <span class="search-icon">${MedHub.icons.search}</span>
                <input type="text" id="eb-add-med-search" placeholder="Type medicine name / salt to add..." autocomplete="off" />
              </div>
              <div id="eb-add-med-dropdown" class="medicine-dropdown-results" style="display: none; position: absolute; left: 12px; right: 12px; top: 72px; z-index: 3000;"></div>
            </div>

            <!-- EDITABLE LINE ITEMS TABLE -->
            <div class="table-wrap" style="margin-top: 14px; border: 1.5px solid var(--cream-border); border-radius: 8px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 30px;">#</th>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th>Exp</th>
                    <th style="width: 75px;">Qty</th>
                    <th style="width: 95px;">MRP (₹)</th>
                    <th style="width: 72px;">Dis %</th>
                    <th style="width: 72px;">GST %</th>
                    <th style="text-align: right;">Total (₹)</th>
                    <th style="width: 44px;"></th>
                  </tr>
                </thead>
                <tbody id="eb-items-tbody"></tbody>
              </table>
            </div>

            <!-- TOTALS & PAYMENT RECONCILIATION -->
            <div style="margin-top: 16px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; align-items: start;">
              <div class="form-group">
                <label class="form-label">Notes / Edit Remarks</label>
                <textarea id="eb-notes" class="textarea-field" rows="3" placeholder="Optional bill notes or correction reason...">${bill.notes || ""}</textarea>
              </div>

              <div style="background: #fdf8f0; border: 1.5px solid var(--cream-border-dark); border-radius: 10px; padding: 14px;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px;">
                  <span>Items Subtotal:</span>
                  <strong id="eb-subtotal-val">₹0.00</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 8px;">
                  <span>Extra Discount (₹):</span>
                  <input type="number" step="0.01" min="0" id="eb-discount" class="input-inline" style="width: 95px; text-align: right;" value="${billDiscountInit}" />
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 8px;">
                  <span>GST Amount (₹):</span>
                  <input type="number" step="0.01" min="0" id="eb-gst-amt" class="input-inline" style="width: 95px; text-align: right;" value="${Number(bill.gst_amount) || 0}" />
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; border-top: 1.5px solid var(--cream-border-dark); padding-top: 8px; margin-top: 6px; margin-bottom: 10px;">
                  <span>Grand Total:</span>
                  <span id="eb-grand-total-val" style="color: #0f766e;">₹0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 8px;">
                  <span>Paid Amount (₹):</span>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <button type="button" class="btn-cat-mini" id="btn-eb-full-paid" title="Mark Full Paid">Full</button>
                    <input type="number" step="0.01" min="0" id="eb-paid-amt" class="input-inline" style="width: 95px; text-align: right; font-weight: 700;" value="${billPaidInit}" />
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 700;">
                  <span>Balance Due:</span>
                  <span id="eb-due-val" style="color: #dc2626;">₹0.00</span>
                </div>
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-edit-bill">Cancel</button>
              <button type="submit" class="btn-dialog-save" id="btn-save-edit-bill">Save Invoice Changes 💾</button>
              <button type="button" class="btn-primary" id="btn-save-print-edit-bill" style="background: #0f766e !important;">
                ${MedHub.icons.print} Save & Print
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-edit-bill")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-edit-bill")?.addEventListener("click", closeModal);

    const tbody = document.getElementById("eb-items-tbody");
    const discInput = document.getElementById("eb-discount");
    const gstInput = document.getElementById("eb-gst-amt");
    const paidInput = document.getElementById("eb-paid-amt");
    const subEl = document.getElementById("eb-subtotal-val");
    const grandEl = document.getElementById("eb-grand-total-val");
    const dueEl = document.getElementById("eb-due-val");

    const computeSummary = () => {
      const subtotal = editableItems.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);
      const disc = Number(discInput?.value) || 0;
      const gstAmt = Number(gstInput?.value) || 0;
      const grand = Math.max(0, Number((subtotal - disc + gstAmt).toFixed(2)));
      const paid = Math.max(0, Number(paidInput?.value) || 0);
      const due = Math.max(0, Number((grand - paid).toFixed(2)));

      if (subEl) subEl.innerText = MedHub.rupee(subtotal);
      if (grandEl) grandEl.innerText = MedHub.rupee(grand);
      if (dueEl) {
        dueEl.innerText = MedHub.rupee(due);
        dueEl.style.color = due > 0 ? "#dc2626" : "#16a34a";
      }
      return { subtotal: Number(subtotal.toFixed(2)), disc, gstAmt, grand, paid, due };
    };

    const renderEditableRows = () => {
      if (!tbody) return;
      if (!editableItems.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="table-empty">Bill me kam se kam 1 medicine honi chahiye. Upar search karke add karein.</td></tr>`;
        computeSummary();
        return;
      }
      tbody.innerHTML = editableItems.map((it, idx) => `
        <tr data-idx="${idx}">
          <td>${idx + 1}</td>
          <td><strong>${it.medicine_name}</strong></td>
          <td><input type="text" class="input-inline eb-batch-inp" data-idx="${idx}" value="${it.batch_no || ""}" style="width: 82px;" /></td>
          <td class="cell-nowrap">${MedHub.renderMonthYearPicker("", it.expiry_date || "", { compact: true, mmClass: "eb-exp-mm", yyClass: "eb-exp-yy", dataIdx: idx })}</td>
          <td><input type="number" min="1" class="input-inline eb-qty-inp" data-idx="${idx}" value="${it.quantity}" style="width: 60px; text-align: center;" /></td>
          <td><input type="number" step="0.01" min="0" class="input-inline eb-rate-inp" data-idx="${idx}" value="${Number(it.rate).toFixed(2)}" style="width: 80px; text-align: right;" /></td>
          <td><input type="number" step="0.1" min="0" max="100" class="input-inline eb-disc-inp" data-idx="${idx}" value="${it.discount_percent || 0}" style="width: 58px; text-align: right;" /></td>
          <td><input type="number" step="0.1" min="0" max="28" class="input-inline eb-gst-inp" data-idx="${idx}" value="${it.gst_percent || 0}" style="width: 58px; text-align: right;" /></td>
          <td style="text-align: right;"><strong class="eb-row-total" data-idx="${idx}">₹${Number(it.line_total).toFixed(2)}</strong></td>
          <td style="text-align: center;">
            <button type="button" class="btn-action-delete eb-remove-row" data-idx="${idx}" title="Remove item">🗑️</button>
          </td>
        </tr>
      `).join("");
      computeSummary();
    };

    renderEditableRows();

    // Row input updates
    tbody?.addEventListener("input", (e) => {
      const idx = Number(e.target.dataset.idx);
      if (isNaN(idx) || !editableItems[idx]) return;
      const item = editableItems[idx];

      if (e.target.classList.contains("eb-batch-inp")) {
        item.batch_no = e.target.value.trim();
      } else if (e.target.classList.contains("eb-qty-inp")) {
        item.quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
      } else if (e.target.classList.contains("eb-rate-inp")) {
        item.rate = Math.max(0, parseFloat(e.target.value) || 0);
      } else if (e.target.classList.contains("eb-disc-inp")) {
        item.discount_percent = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
      } else if (e.target.classList.contains("eb-gst-inp")) {
        item.gst_percent = Math.max(0, parseFloat(e.target.value) || 0);
      }

      const gross = item.quantity * item.rate;
      item.line_total = Number(Math.max(0, gross - (gross * (item.discount_percent / 100))).toFixed(2));
      const rowTotalEl = tbody.querySelector(`.eb-row-total[data-idx="${idx}"]`);
      if (rowTotalEl) rowTotalEl.innerText = `₹${item.line_total.toFixed(2)}`;
      computeSummary();
    });

    tbody?.addEventListener("change", (e) => {
      const idx = Number(e.target.dataset.idx);
      if (isNaN(idx) || !editableItems[idx]) return;
      if (e.target.classList.contains("eb-exp-mm") || e.target.classList.contains("eb-exp-yy")) {
        const row = e.target.closest("tr");
        const mm = row?.querySelector(".eb-exp-mm")?.value?.trim() || "";
        const yy = row?.querySelector(".eb-exp-yy")?.value?.trim() || "";
        if (mm && yy) {
          editableItems[idx].expiry_date = `${yy}-${mm}`;
        }
      }
    });

    tbody?.addEventListener("click", (e) => {
      const rmBtn = e.target.closest(".eb-remove-row");
      if (rmBtn) {
        const idx = Number(rmBtn.dataset.idx);
        editableItems.splice(idx, 1);
        renderEditableRows();
      }
    });

    discInput?.addEventListener("input", computeSummary);
    gstInput?.addEventListener("input", computeSummary);
    paidInput?.addEventListener("input", computeSummary);

    document.getElementById("btn-eb-full-paid")?.addEventListener("click", () => {
      const { grand } = computeSummary();
      if (paidInput) paidInput.value = grand.toFixed(2);
      computeSummary();
    });

    // Search & add medicine inside Edit Bill Modal
    const medSearchInp = document.getElementById("eb-add-med-search");
    const medDrop = document.getElementById("eb-add-med-dropdown");
    let foundMeds = [];

    medSearchInp?.addEventListener("input", MedHub.debounce(async (e) => {
      const q = e.target.value.trim();
      if (!q) {
        if (medDrop) medDrop.style.display = "none";
        return;
      }
      foundMeds = await MedHub.api.searchMedicines(q);
      if (!foundMeds.length) {
        medDrop.innerHTML = `<div class="dropdown-empty">Koi medicine nahi mili "${q}" ke liye</div>`;
        medDrop.style.display = "block";
        return;
      }
      medDrop.innerHTML = foundMeds.slice(0, 12).map((m, i) => `
        <div class="dropdown-item eb-pick-med" data-idx="${i}">
          <div class="dd-item-main">
            <strong>${m.name}</strong>
            <span class="dd-company">${m.company || ""}</span>
          </div>
          <div class="dd-item-meta">
            <span>Stock: <strong>${m.available_qty || 0}</strong></span>
            <span>MRP: ₹${Number(m.selling_rate || m.mrp || 0).toFixed(2)}</span>
          </div>
        </div>
      `).join("");
      medDrop.style.display = "block";
    }, 200));

    medDrop?.addEventListener("click", async (e) => {
      const row = e.target.closest(".eb-pick-med");
      if (!row) return;
      const med = foundMeds[Number(row.dataset.idx)];
      if (!med) return;

      const batches = await MedHub.api.getBatches(med.id);
      const chosenBatch = (batches && batches.length) ? batches[0] : null;
      const rate = Number(med.selling_rate || (chosenBatch ? chosenBatch.selling_price : med.mrp) || 0);

      editableItems.push({
        medicine_id: med.id,
        batch_id: chosenBatch ? chosenBatch.id : null,
        medicine_name: med.name,
        name: med.name,
        batch_no: chosenBatch ? chosenBatch.batch_no : "BT-01",
        expiry_date: chosenBatch ? chosenBatch.expiry_date : (med.nearest_expiry || ""),
        pack_size: med.pack_size || "1x10",
        drug_schedule: med.drug_schedule || "General (OTC / Non-Rx)",
        salt_composition: med.salt_composition || "",
        quantity: 1,
        rate,
        discount_percent: 0,
        gst_percent: Number(med.gst_percent) || 12,
        line_total: Number(rate.toFixed(2))
      });

      if (medSearchInp) medSearchInp.value = "";
      medDrop.style.display = "none";
      renderEditableRows();
    });

    const saveInvoiceChanges = async (openPrintAfter = false) => {
      if (!editableItems.length) {
        MedHub.toast("Kam se kam 1 medicine bill me add karein", "warning");
        return;
      }

      const summary = computeSummary();
      const saveBtn = document.getElementById("btn-save-edit-bill");
      const printBtn = document.getElementById("btn-save-print-edit-bill");
      if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = "Saving..."; }
      if (printBtn) { printBtn.disabled = true; }

      const updatedPayload = {
        customer_name: document.getElementById("eb-cust-name")?.value.trim() || "Walk-in Customer",
        customer_mobile: document.getElementById("eb-cust-mobile")?.value.trim() || "",
        patient_address: document.getElementById("eb-cust-address")?.value.trim() || "",
        doctor_name: document.getElementById("eb-doc-name")?.value.trim() || "",
        doctor_hospital: document.getElementById("eb-doc-hosp")?.value.trim() || "",
        payment_mode: document.getElementById("eb-pay-mode")?.value || "CASH",
        notes: document.getElementById("eb-notes")?.value.trim() || "",
        subtotal: summary.subtotal,
        discount: summary.disc,
        gst_amount: summary.gstAmt,
        grand_total: summary.grand,
        paid_amount: summary.paid,
        items: editableItems
      };

      const saved = await MedHub.api.updateBill(bill.id || bill.bill_no, updatedPayload);
      if (saved) {
        closeModal();
        self.billsList = await MedHub.api.getBills();
        self.updateStatsAndTable();
        MedHub.toast(`Invoice #${bill.bill_no} successfully update ho gaya!`, "success");
        if (openPrintAfter && MedHub.billing) {
          MedHub.billing.showInvoiceModal(saved);
        }
      } else {
        MedHub.toast("Invoice update karne me samasya aayi", "error");
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = "Save Invoice Changes 💾"; }
        if (printBtn) { printBtn.disabled = false; }
      }
    };

    document.getElementById("edit-invoice-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      saveInvoiceChanges(false);
    });

    document.getElementById("btn-save-print-edit-bill")?.addEventListener("click", () => {
      saveInvoiceChanges(true);
    });

    if (MedHub.enableEnterNavigation) {
      MedHub.enableEnterNavigation(document.getElementById("edit-invoice-form"), {
        focusSubmitOnLast: true
      });
    }
  }
};
