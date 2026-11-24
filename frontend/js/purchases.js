// ============================================================================
// MedEduHub - Purchases & Stock Inward Screen (js/purchases.js)
// Supports full medicine details (medicine name, batch, expiry, pack, purchase rate, mrp, total)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.purchases = {
  purchasesList: [],
  medicinesList: [],
  suppliersList: [],

  async render(container) {
    this.purchasesList = await MedHub.api.getPurchases();
    this.suppliersList = await MedHub.api.getSuppliers();
    this.medicinesList = await MedHub.api.getMedicines();

    const totalPurchases = this.purchasesList.length;
    const totalAmount = this.purchasesList.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);

    container.innerHTML = `
      <div class="purchases-page-wrap">
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Purchases & Inward Stock</h2>
            <p class="page-subtitle">Record supplier purchase bills, view medicine-wise purchase amounts & auto-update stock batches</p>
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
                  <th>Purchased Medicines (Details)</th>
                  <th>Total Amount</th>
                  <th>Paid Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.purchasesList.length ? this.purchasesList.map(p => {
                  const hasItems = Array.isArray(p.items) && p.items.length > 0;
                  const statusClass = (p.status || "").toLowerCase().includes("paid") ? "status-in" : ((p.status || "").toLowerCase().includes("due") ? "status-low" : "status-in");
                  return `
                    <tr>
                      <td><strong>${p.invoice_no || "INV-NEW"}</strong></td>
                      <td>${MedHub.formatDate(p.purchase_date)}</td>
                      <td>${p.supplier_name || "Pharma Distributor"}</td>
                      <td>
                        ${hasItems ? `
                          <div class="pur-items-cell">
                            ${p.items.map(it => `
                              <span class="pur-med-badge" title="Batch: ${it.batch_no || '—'} | Exp: ${it.expiry_date || '—'}">
                                💊 <strong>${it.medicine_name || it.name}</strong> (${it.quantity} ${it.pack_size || "packs"} @ ₹${Number(it.purchase_rate || 0).toFixed(2)})
                              </span>
                            `).join("")}
                          </div>
                        ` : `
                          <span style="color:#64748b;font-size:12px;">General Invoice (₹${Number(p.total_amount).toFixed(2)})</span>
                        `}
                      </td>
                      <td><strong>${MedHub.rupee(p.total_amount)}</strong></td>
                      <td>${MedHub.rupee(p.paid_amount || p.total_amount)}</td>
                      <td><span class="badge-status ${statusClass}">${p.status || "RECEIVED"}</span></td>
                      <td>
                        <button type="button" class="btn-outline-sm btn-view-purchase-detail" data-id="${p.id || p.invoice_no}">
                          👁️ Details
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("") : `<tr><td colspan="8" class="table-empty">Koi purchase record nahi hai. "Record New Purchase" par click karein.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- NEW PURCHASE MODAL CONTAINER -->
      <div id="new-purchase-modal-wrap"></div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const self = this;

    // Export Excel
    container.querySelector("#btn-export-purchases")?.addEventListener("click", () => {
      const data = self.purchasesList.map(p => ({
        "Invoice No": p.invoice_no,
        "Purchase Date": p.purchase_date,
        "Supplier Name": p.supplier_name,
        "Total Amount (₹)": p.total_amount,
        "Paid Amount (₹)": p.paid_amount,
        "Status": p.status,
        "Items Count": Array.isArray(p.items) ? p.items.length : 0
      }));
      MedHub.exportToExcel(data, "Purchases_Record", "Purchases");
    });

    // Open New Purchase Modal
    container.querySelector("#btn-open-purchase-modal")?.addEventListener("click", () => {
      self.openNewPurchaseModal();
    });

    // View Purchase Details Modal
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-view-purchase-detail");
      if (btn) {
        const id = btn.dataset.id;
        const purchase = self.purchasesList.find(p => String(p.id) === String(id) || String(p.invoice_no) === String(id));
        if (purchase) {
          self.openPurchaseDetailModal(purchase);
        }
      }
    });
  },

  // --------------------------------------------------------------------------
  // MODAL 1: RECORD NEW PURCHASE (WITH MEDICINE-WISE BREAKDOWN)
  // --------------------------------------------------------------------------
  openNewPurchaseModal() {
    const self = this;
    const modalWrap = document.getElementById("new-purchase-modal-wrap");
    if (!modalWrap) return;

    const suppliers = this.suppliersList || [];
    const medicines = this.medicinesList || [];
    const todayStr = new Date().toISOString().slice(0, 10);

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box purchase-modal-box">
          <div class="modal-header-dialog" style="padding: 16px 24px; border-bottom: 1.5px solid var(--cream-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 class="modal-dialog-title" style="margin: 0; font-size: 18px; color: var(--black-deep);">Record Supplier Purchase & Stock Inward</h3>
              <p style="margin: 3px 0 0; font-size: 12px; color: var(--black-soft);">Add purchased medicines, batch numbers, purchase rates & auto-inward stock</p>
            </div>
            <button type="button" class="btn-dialog-close" id="btn-close-pur-modal">${MedHub.icons.close}</button>
          </div>

          <form id="purchase-form" class="purchase-modal-body">
            <!-- 1. SUPPLIER & INVOICE DETAILS -->
            <div class="form-row-3" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Supplier / Distributor <span class="req">*</span></label>
                <input 
                  type="text" 
                  id="pur-supplier" 
                  class="input-field" 
                  list="pur-suppliers-datalist" 
                  placeholder="Select or type supplier name" 
                  required 
                />
                <datalist id="pur-suppliers-datalist">
                  ${suppliers.map(s => `<option value="${s.name}">${s.name} (${s.phone || 'Supplier'})</option>`).join("")}
                </datalist>
              </div>

              <div class="form-group">
                <label class="form-label">Supplier Invoice No <span class="req">*</span></label>
                <input 
                  type="text" 
                  id="pur-inv-no" 
                  class="input-field" 
                  placeholder="e.g. INV-98210" 
                  value="INV-${Date.now().toString().slice(-5)}" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Purchase Date</label>
                <input type="date" id="pur-date" class="input-field" value="${todayStr}" required />
              </div>
            </div>

            <!-- 2. MEDICINES PURCHASED TABLE (FULL DETAILS) -->
            <div style="margin-top: 20px;">
              <div class="pur-section-title">
                <span>📦 Purchased Medicines & Rates Breakdown</span>
                <button type="button" class="btn-outline-sm" id="btn-add-pur-item" style="font-size: 12px; font-weight: 700;">
                  + Add Medicine Item
                </button>
              </div>

              <!-- Datalist of existing inventory medicines for quick selection -->
              <datalist id="pur-meds-datalist">
                ${medicines.map(m => `<option value="${m.name}">${m.name} | MRP: ₹${m.mrp || m.selling_rate || 0}</option>`).join("")}
              </datalist>

              <div style="overflow-x: auto; border: 1px solid var(--cream-border); border-radius: 8px;">
                <table class="pur-items-table" id="pur-items-table">
                  <thead>
                    <tr>
                      <th style="width: 30px;">#</th>
                      <th style="min-width: 190px;">Medicine Name *</th>
                      <th style="width: 120px;">Batch No *</th>
                      <th style="width: 120px;">Expiry *</th>
                      <th style="width: 115px;">Pack</th>
                      <th style="width: 80px;">Qty *</th>
                      <th style="width: 100px;">Pur. Rate (₹) *</th>
                      <th style="width: 90px;">MRP (₹)</th>
                      <th style="width: 110px;">Total (₹)</th>
                      <th style="width: 40px; text-align: center;">✕</th>
                    </tr>
                  </thead>
                  <tbody id="pur-items-tbody">
                    <!-- Dynamic Item Rows -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. LIVE TOTALS & PAYMENT DETAILS -->
            <div class="pur-summary-banner">
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Total Medicines</span>
                <span class="pur-stat-val" id="pur-total-items-count">0 Items</span>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Total Units</span>
                <span class="pur-stat-val" id="pur-total-qty-count">0 Packs</span>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Total Purchase Amount</span>
                <span class="pur-stat-val" style="color: #0f766e;" id="pur-total-amount-display">₹0.00</span>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Payment Mode</span>
                <select id="pur-payment-mode" class="input-field" style="padding: 4px 8px; font-size: 13px;">
                  <option value="BANK TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT / DUE">Credit / Due</option>
                </select>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Paid Amount (₹)</span>
                <input type="number" step="0.01" id="pur-paid-amount" class="input-field" style="width: 120px; padding: 4px 8px; font-size: 14px; font-weight: 700;" value="0.00" />
              </div>
            </div>

            <!-- 4. MODAL FOOTER -->
            <div class="modal-dialog-footer" style="margin-top: 22px; display: flex; justify-content: flex-end; gap: 12px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-pur-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #0f766e !important; color: #ffffff !important; font-weight: 700;">
                💾 Save Purchase & Inward Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const tbody = document.getElementById("pur-items-tbody");

    // Helper: Add Item Row
    let rowCount = 0;
    const addItemRow = (prefill = null) => {
      rowCount++;
      const tr = document.createElement("tr");
      tr.className = "pur-item-row";
      const randomBatch = "BT-" + Date.now().toString().slice(-4);
      const defaultExp = new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10);

      let packA = "1";
      let packB = "10";
      if (prefill?.pack_size) {
        const parts = String(prefill.pack_size).split(/[xX×]/);
        if (parts.length >= 2) {
          packA = parts[0].trim() || "1";
          packB = parts[1].trim() || "10";
        } else if (parts.length === 1 && parts[0].trim()) {
          packB = parts[0].trim();
        }
      }

      tr.innerHTML = `
        <td style="text-align: center; font-weight: 600; color: #64748b;">${rowCount}</td>
        <td>
          <input 
            type="text" 
            class="pur-item-name" 
            list="pur-meds-datalist" 
            placeholder="Type or pick medicine" 
            value="${prefill?.name || ""}" 
            required 
          />
        </td>
        <td>
          <input 
            type="text" 
            class="pur-item-batch" 
            placeholder="e.g. BT-01" 
            value="${prefill?.batch_no || randomBatch}" 
            required 
          />
        </td>
        <td>
          <input 
            type="date" 
            class="pur-item-exp" 
            value="${prefill?.expiry_date || defaultExp}" 
            required 
          />
        </td>
        <td>
          <div class="pur-pack-duo-wrap">
            <input 
              type="text" 
              class="pur-item-pack-a" 
              placeholder="1" 
              value="${packA}" 
              title="Strips / Outer Pack"
            />
            <span class="pur-pack-x">x</span>
            <input 
              type="text" 
              class="pur-item-pack-b" 
              placeholder="10" 
              value="${packB}" 
              title="Units / Tablets per pack"
            />
          </div>
        </td>
        <td>
          <input 
            type="number" 
            class="pur-item-qty" 
            min="1" 
            step="1" 
            value="${prefill?.quantity || 10}" 
            required 
            style="font-weight: 700; text-align: center;" 
          />
        </td>
        <td>
          <input 
            type="number" 
            class="pur-item-rate" 
            min="0" 
            step="0.01" 
            placeholder="0.00" 
            value="${prefill?.purchase_rate || ""}" 
            required 
            style="font-weight: 700;" 
          />
        </td>
        <td>
          <input 
            type="number" 
            class="pur-item-mrp" 
            min="0" 
            step="0.01" 
            placeholder="0.00" 
            value="${prefill?.mrp || ""}" 
          />
        </td>
        <td>
          <input 
            type="text" 
            class="pur-item-total" 
            readonly 
            value="0.00" 
            style="background: #f8fafc; font-weight: 700; color: #0f766e; text-align: right;" 
          />
        </td>
        <td style="text-align: center;">
          <button type="button" class="pur-del-btn" title="Remove row">✕</button>
        </td>
      `;

      tbody.appendChild(tr);

      // Event Listeners for Row Inputs
      const nameInput = tr.querySelector(".pur-item-name");
      const qtyInput = tr.querySelector(".pur-item-qty");
      const rateInput = tr.querySelector(".pur-item-rate");
      const mrpInput = tr.querySelector(".pur-item-mrp");
      const packAInput = tr.querySelector(".pur-item-pack-a");
      const packBInput = tr.querySelector(".pur-item-pack-b");
      const totalInput = tr.querySelector(".pur-item-total");
      const delBtn = tr.querySelector(".pur-del-btn");

      // Auto-populate MRP and Pack if selected from datalist
      nameInput.addEventListener("change", () => {
        const val = nameInput.value.trim().toLowerCase();
        const matched = medicines.find(m => m.name.toLowerCase() === val);
        if (matched) {
          if (!mrpInput.value && matched.mrp) mrpInput.value = matched.mrp;
          if (!rateInput.value && matched.purchase_price) rateInput.value = matched.purchase_price;
          if (matched.pack_size) {
            const parts = String(matched.pack_size).split(/[xX×]/);
            if (parts.length >= 2) {
              if (packAInput) packAInput.value = parts[0].trim() || "1";
              if (packBInput) packBInput.value = parts[1].trim() || "10";
            } else if (packBInput) {
              packBInput.value = matched.pack_size.trim();
            }
          }
          calcRow();
        }
      });

      const calcRow = () => {
        const qty = Number(qtyInput.value) || 0;
        const rate = Number(rateInput.value) || 0;
        const lineTot = qty * rate;
        totalInput.value = lineTot.toFixed(2);
        recalcSummary();
      };

      qtyInput.addEventListener("input", calcRow);
      rateInput.addEventListener("input", calcRow);

      delBtn.addEventListener("click", () => {
        if (tbody.querySelectorAll("tr").length > 1) {
          tr.remove();
          recalcSummary();
        } else {
          MedHub.toast("Kam se kam 1 medicine item hona zaroori hai.", "warning");
        }
      });

      calcRow();
    };

    // Calculate Summary Totals
    const recalcSummary = () => {
      const rows = tbody.querySelectorAll("tr");
      let totalQty = 0;
      let totalAmt = 0;
      let itemCount = 0;

      rows.forEach(tr => {
        const name = tr.querySelector(".pur-item-name")?.value.trim();
        const qty = Number(tr.querySelector(".pur-item-qty")?.value) || 0;
        const rate = Number(tr.querySelector(".pur-item-rate")?.value) || 0;
        if (name || qty > 0 || rate > 0) {
          itemCount++;
          totalQty += qty;
          totalAmt += (qty * rate);
        }
      });

      document.getElementById("pur-total-items-count").innerText = `${itemCount} Medicines`;
      document.getElementById("pur-total-qty-count").innerText = `${totalQty} Units/Packs`;
      document.getElementById("pur-total-amount-display").innerText = `₹${totalAmt.toFixed(2)}`;

      const paidInput = document.getElementById("pur-paid-amount");
      if (paidInput && (!paidInput.dataset.touched || Number(paidInput.value) === 0)) {
        paidInput.value = totalAmt.toFixed(2);
      }
    };

    document.getElementById("pur-paid-amount")?.addEventListener("input", (e) => {
      e.target.dataset.touched = "true";
    });

    // Add initial 1 empty row
    addItemRow();

    // Add row button
    document.getElementById("btn-add-pur-item")?.addEventListener("click", () => {
      addItemRow();
    });

    // Close Modal helper
    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-pur-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-pur-modal")?.addEventListener("click", closeModal);

    // Form Submission
    document.getElementById("purchase-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const supplierName = document.getElementById("pur-supplier").value.trim();
      const invoiceNo = document.getElementById("pur-inv-no").value.trim();
      const purchaseDate = document.getElementById("pur-date").value;
      const paymentMode = document.getElementById("pur-payment-mode").value;
      const paidAmount = Number(document.getElementById("pur-paid-amount").value) || 0;

      // Extract all medicine rows
      const rows = tbody.querySelectorAll("tr");
      const items = [];
      let totalAmount = 0;

      rows.forEach(tr => {
        const name = tr.querySelector(".pur-item-name")?.value.trim();
        const batchNo = tr.querySelector(".pur-item-batch")?.value.trim();
        const expDate = tr.querySelector(".pur-item-exp")?.value;
        const packA = tr.querySelector(".pur-item-pack-a")?.value.trim() || "1";
        const packB = tr.querySelector(".pur-item-pack-b")?.value.trim() || "10";
        const packSize = `${packA}x${packB}`;
        const qty = Number(tr.querySelector(".pur-item-qty")?.value) || 0;
        const purchaseRate = Number(tr.querySelector(".pur-item-rate")?.value) || 0;
        const mrp = Number(tr.querySelector(".pur-item-mrp")?.value) || purchaseRate;

        if (name && qty > 0) {
          const lineTotal = qty * purchaseRate;
          totalAmount += lineTotal;
          items.push({
            medicine_name: name,
            name: name,
            batch_no: batchNo || ("BT-" + Date.now().toString().slice(-4)),
            expiry_date: expDate || "2028-12-31",
            pack_size: packSize,
            quantity: qty,
            purchase_rate: purchaseRate,
            mrp: mrp,
            line_total: lineTotal
          });
        }
      });

      if (items.length === 0) {
        MedHub.toast("Kripya kam se kam ek valid medicine aur quantity add karein.", "warning");
        return;
      }

      const status = paidAmount >= totalAmount ? "PAID" : (paidAmount > 0 ? "PARTIAL" : "DUE");

      const purchasePayload = {
        supplier_name: supplierName,
        invoice_no: invoiceNo,
        purchase_date: purchaseDate,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        status: status,
        payment_mode: paymentMode,
        items: items
      };

      const saved = await MedHub.api.createPurchase(purchasePayload);

      if (saved) {
        MedHub.toast(`Purchase Invoice "${invoiceNo}" with ${items.length} medicines saved & stock updated!`, "success");
        closeModal();
        self.render(document.getElementById("page-content"));
      }
    });
  },

  // --------------------------------------------------------------------------
  // MODAL 2: VIEW PURCHASE DETAILS & INVOICE BREAKDOWN
  // --------------------------------------------------------------------------
  openPurchaseDetailModal(purchase) {
    const modalWrap = document.getElementById("new-purchase-modal-wrap");
    if (!modalWrap) return;

    const items = Array.isArray(purchase.items) ? purchase.items : [];
    const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const isPaid = (purchase.status || "").toUpperCase().includes("PAID");

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 850px; width: 95vw;">
          <div class="modal-header-dialog" style="padding: 16px 24px; border-bottom: 1.5px solid var(--cream-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 class="modal-dialog-title" style="margin: 0; font-size: 18px; color: var(--black-deep);">
                Purchase Invoice Details — ${purchase.invoice_no || "INV-DETAILS"}
              </h3>
              <p style="margin: 3px 0 0; font-size: 12px; color: var(--black-soft);">
                Supplier: <strong>${purchase.supplier_name || "Pharma Distributor"}</strong> • Date: ${MedHub.formatDate(purchase.purchase_date)}
              </p>
            </div>
            <button type="button" class="btn-dialog-close" id="btn-close-pur-view">${MedHub.icons.close}</button>
          </div>

          <div class="modal-dialog-body" style="padding: 20px 24px; max-height: 75vh; overflow-y: auto;">
            <!-- Meta Details Card -->
            <div style="background: #f8fafc; border: 1px solid var(--cream-border); border-radius: 8px; padding: 14px 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px;">
              <div>
                <span style="font-size: 11px; color: var(--black-soft); font-weight: 600; text-transform: uppercase;">Invoice No</span>
                <div style="font-size: 14px; font-weight: 800; color: var(--black-deep); margin-top: 2px;">${purchase.invoice_no || "—"}</div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--black-soft); font-weight: 600; text-transform: uppercase;">Purchase Date</span>
                <div style="font-size: 14px; font-weight: 800; color: var(--black-deep); margin-top: 2px;">${MedHub.formatDate(purchase.purchase_date)}</div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--black-soft); font-weight: 600; text-transform: uppercase;">Payment Status</span>
                <div style="margin-top: 2px;"><span class="badge-status ${isPaid ? 'status-in' : 'status-low'}">${purchase.status || "RECEIVED"}</span></div>
              </div>
              <div>
                <span style="font-size: 11px; color: var(--black-soft); font-weight: 600; text-transform: uppercase;">Payment Mode</span>
                <div style="font-size: 14px; font-weight: 800; color: var(--black-deep); margin-top: 2px;">${purchase.payment_mode || "BANK TRANSFER"}</div>
              </div>
            </div>

            <!-- Medicines Breakdown Table -->
            <h4 style="font-size: 14px; font-weight: 700; color: var(--black-deep); margin: 0 0 8px;">
              Medicine Breakdown (${items.length} items, ${totalQty} units)
            </h4>

            <div style="overflow-x: auto; border: 1px solid var(--cream-border); border-radius: 8px;">
              <table class="data-table" style="width: 100%;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="width: 30px;">#</th>
                    <th>Medicine Name</th>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th>Pack</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Pur. Rate</th>
                    <th style="text-align: right;">MRP</th>
                    <th style="text-align: right;">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length ? items.map((it, idx) => `
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">${idx + 1}</td>
                      <td><strong>${it.medicine_name || it.name}</strong></td>
                      <td><code>${it.batch_no || "—"}</code></td>
                      <td>${MedHub.formatDate(it.expiry_date)}</td>
                      <td>${it.pack_size || "1x10"}</td>
                      <td style="text-align: center; font-weight: 700;">${it.quantity}</td>
                      <td style="text-align: right;">₹${Number(it.purchase_rate || 0).toFixed(2)}</td>
                      <td style="text-align: right;">₹${Number(it.mrp || 0).toFixed(2)}</td>
                      <td style="text-align: right; font-weight: 700; color: #0f766e;">₹${Number(it.line_total || (it.quantity * it.purchase_rate) || 0).toFixed(2)}</td>
                    </tr>
                  `).join("") : `
                    <tr>
                      <td colspan="9" style="text-align: center; color: #64748b; padding: 18px;">
                        Is invoice ke specific medicine items logged nahi hain. Total Invoice Amount: ₹${Number(purchase.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  `}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; font-weight: 800; font-size: 14px;">
                    <td colspan="5">Grand Total:</td>
                    <td style="text-align: center;">${totalQty}</td>
                    <td colspan="2"></td>
                    <td style="text-align: right; color: #0f766e;">₹${Number(purchase.total_amount).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
              <button type="button" class="btn-outline" id="btn-print-pur-invoice">
                ${MedHub.icons.print} Print Purchase Record
              </button>
              <button type="button" class="btn-primary" id="btn-close-pur-view-ok">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeDetail = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-pur-view")?.addEventListener("click", closeDetail);
    document.getElementById("btn-close-pur-view-ok")?.addEventListener("click", closeDetail);

    document.getElementById("btn-print-pur-invoice")?.addEventListener("click", () => {
      window.print();
    });
  }
};
