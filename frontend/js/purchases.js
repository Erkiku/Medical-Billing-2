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
            <table class="data-table" id="purchases-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Supplier Name</th>
                  <th>Purchased Medicines (Details)</th>
                  <th>Total Amount</th>
                  <th>Payment Done</th>
                  <th>Payment Dues</th>
                  <th>Status</th>
                  <th style="width: 185px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.purchasesList.length ? this.purchasesList.map(p => {
                  const hasItems = Array.isArray(p.items) && p.items.length > 0;
                  const total = Number(p.total_amount) || 0;
                  const paid = Number(p.paid_amount !== undefined ? p.paid_amount : p.total_amount) || 0;
                  const dues = Math.max(0, total - paid);
                  const isFullyPaid = dues === 0;
                  const statusClass = isFullyPaid ? "status-in" : (paid > 0 ? "status-low" : "status-out");
                  const displayStatus = p.status || (isFullyPaid ? "PAID" : (paid > 0 ? "PARTIAL DUE" : "DUE"));
                  return `
                    <tr>
                      <td><strong>${p.invoice_no || "INV-NEW"}</strong></td>
                      <td>${MedHub.formatDate(p.purchase_date)}</td>
                      <td>${p.supplier_name || "Pharma Distributor"}</td>
                      <td>
                        ${hasItems ? `
                          <div class="pur-items-cell">
                            ${p.items.map(it => `
                              <span class="pur-med-badge" title="Batch: ${it.batch_no || '—'} | Exp: ${MedHub.formatExpiry ? MedHub.formatExpiry(it.expiry_date) : it.expiry_date}">
                                💊 <strong>${it.medicine_name || it.name}</strong> (${it.quantity} ${it.pack_size || "packs"} @ ₹${Number(it.purchase_rate || 0).toFixed(2)})
                              </span>
                            `).join("")}
                          </div>
                        ` : `
                          <span style="color:#64748b;font-size:12px;">General Invoice (₹${total.toFixed(2)})</span>
                        `}
                      </td>
                      <td><strong>${MedHub.rupee(total)}</strong></td>
                      <td><span style="color:#1d4ed8;font-weight:700;">${MedHub.rupee(paid)}</span></td>
                      <td>
                        ${dues > 0 
                          ? `<span style="color:#dc2626;font-weight:800;background:#fee2e2;padding:2px 8px;border-radius:4px;">${MedHub.rupee(dues)}</span>`
                          : `<span style="color:#16a34a;font-weight:700;">₹0.00</span>`
                        }
                      </td>
                      <td><span class="badge-status ${statusClass}">${displayStatus}</span></td>
                      <td class="cell-nowrap table-actions-cell">
                        <button type="button" class="btn-outline-sm btn-view-purchase-detail" data-id="${p.id || p.invoice_no}" title="View Details">
                          👁️ Details
                        </button>
                        <button type="button" class="btn-action-edit btn-edit-purchase" data-id="${p.id || p.invoice_no}" title="Edit Payment & Dues">
                          ✏️ Edit
                        </button>
                        <button type="button" class="btn-action-delete btn-delete-purchase" data-id="${p.id || p.invoice_no}" title="Delete Invoice">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("") : `<tr><td colspan="9" class="table-empty">Koi purchase record nahi hai. "Record New Purchase" par click karein.</td></tr>`}
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

    // Purchase Actions: View Details, Edit, Delete
    container.addEventListener("click", async (e) => {
      const viewBtn = e.target.closest(".btn-view-purchase-detail");
      if (viewBtn) {
        const id = viewBtn.dataset.id;
        const purchase = self.purchasesList.find(p => String(p.id) === String(id) || String(p.invoice_no) === String(id));
        if (purchase) {
          self.openPurchaseDetailModal(purchase);
        }
        return;
      }

      const editBtn = e.target.closest(".btn-edit-purchase");
      if (editBtn) {
        const id = editBtn.dataset.id;
        const purchase = self.purchasesList.find(p => String(p.id) === String(id) || String(p.invoice_no) === String(id));
        if (purchase) {
          self.openEditPurchaseModal(purchase);
        }
        return;
      }

      const deleteBtn = e.target.closest(".btn-delete-purchase");
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const purchase = self.purchasesList.find(p => String(p.id) === String(id) || String(p.invoice_no) === String(id));
        if (purchase && await MedHub.confirm(`Kya aap Purchase Invoice '${purchase.invoice_no}' ko delete karna chahte hain?`)) {
          const ok = await MedHub.api.deletePurchase(id);
          if (ok) {
            MedHub.toast(`Purchase Invoice #${purchase.invoice_no} delete ho gaya`, "success");
            self.purchasesList = await MedHub.api.getPurchases();
            self.render(document.getElementById("page-content"));
          } else {
            MedHub.toast("Delete karne me samasya aayi", "error");
          }
        }
        return;
      }
    });
  },

  calculatePurchaseItem({ qty, rate, discPct, gstPct }) {
    const q = Math.max(0, Number(qty) || 0);
    const r = Math.max(0, Number(rate) || 0);
    const dPct = Math.min(100, Math.max(0, Number(discPct) || 0));
    const gPct = Math.max(0, Number(gstPct) || 0);
    const gross = q * r;
    const discAmt = (gross * dPct) / 100;
    const taxable = Math.max(0, gross - discAmt);
    const gstAmt = (taxable * gPct) / 100;
    const lineTotal = taxable + gstAmt;
    return { gross, discPct: dPct, discAmt, taxable, gstPct: gPct, gstAmt, lineTotal };
  },

  calculatePurchaseSummary(rowsData, billDiscountVal = 0, billDiscountType = "AMOUNT") {
    let totalQty = 0;
    let totalTablets = 0;
    let rawTaxable = 0;
    let itemDiscTotal = 0;
    let itemCount = 0;
    const computedRows = [];

    (rowsData || []).forEach(row => {
      const hasContent = (row.name && String(row.name).trim()) || Number(row.qty) > 0 || Number(row.rate) > 0;
      if (!hasContent) return;
      itemCount++;
      const q = Math.max(0, Number(row.qty) || 0);
      totalQty += q;
      const packInfo = MedHub.parsePackSize
        ? MedHub.parsePackSize(row.pack_size || row.packSize || "1x10")
        : { unitsPerPack: 10 };
      totalTablets += Math.max(0, Number((q * packInfo.unitsPerPack).toFixed(2)));
      const calc = this.calculatePurchaseItem({
        qty: q,
        rate: row.rate,
        discPct: row.discPct,
        gstPct: row.gstPct
      });
      rawTaxable += calc.taxable;
      itemDiscTotal += calc.discAmt;
      computedRows.push(calc);
    });

    const rawBillVal = Math.max(0, Number(billDiscountVal) || 0);
    const extraDisc = billDiscountType === "PERCENT"
      ? (rawTaxable * Math.min(100, rawBillVal)) / 100
      : Math.min(rawTaxable, rawBillVal);

    const factor = rawTaxable > 0 ? Math.max(0, (rawTaxable - extraDisc) / rawTaxable) : 1;
    const finalTaxable = Math.max(0, rawTaxable - extraDisc);
    const finalGst = computedRows.reduce((sum, r) => sum + ((r.taxable * factor * r.gstPct) / 100), 0);
    const totalDiscount = itemDiscTotal + extraDisc;
    const netTotal = finalTaxable + finalGst;

    return {
      itemCount,
      totalQty,
      totalTablets,
      rawTaxable,
      itemDiscTotal,
      extraDisc,
      totalDiscount,
      finalTaxable,
      finalGst,
      netTotal
    };
  },

  // --------------------------------------------------------------------------
  // MODAL 1: RECORD NEW PURCHASE (WITH MEDICINE-WISE BREAKDOWN)
  // --------------------------------------------------------------------------
  openNewPurchaseModal(existingPurchase = null) {
    const self = this;
    const modalWrap = document.getElementById("new-purchase-modal-wrap");
    if (!modalWrap) return;

    const isEdit = Boolean(existingPurchase);
    const suppliers = this.suppliersList || [];
    let medicines = this.medicinesList || [];
    const todayStr = new Date().toISOString().slice(0, 10);

    const initSupplier = existingPurchase?.supplier_name || "";
    const initInvNo = existingPurchase?.invoice_no || `INV-${Date.now().toString().slice(-5)}`;
    const initDate = existingPurchase?.purchase_date ? String(existingPurchase.purchase_date).slice(0, 10) : todayStr;
    const initPayMode = (existingPurchase?.payment_mode || "BANK TRANSFER").toUpperCase();
    const initExtraDiscType = existingPurchase?.extra_discount_type === "PERCENT" ? "PERCENT" : "AMOUNT";
    const initExtraDisc = Number(existingPurchase?.extra_discount) || 0;
    const initPaidVal = isEdit && existingPurchase?.paid_amount !== undefined && existingPurchase?.paid_amount !== null
      ? Number(existingPurchase.paid_amount).toFixed(2)
      : "";

    const escAttr = (v) => String(v ?? "").replace(/"/g, "&quot;");

    modalWrap.innerHTML = `
      <div class="modal-overlay purchase-modal-overlay">
        <div class="modal-box purchase-modal-box">
          <div class="modal-header-dialog" style="padding: 16px 28px; border-bottom: 1.5px solid var(--cream-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 class="modal-dialog-title" style="margin: 0; font-size: 18px; color: var(--black-deep);">
                ${isEdit ? `Edit Supplier Purchase & Stock Inward — ${initInvNo}` : "Record Supplier Purchase & Stock Inward"}
              </h3>
              <p style="margin: 3px 0 0; font-size: 12px; color: var(--black-soft);">
                ${isEdit ? "Update supplier invoice, medicines, batches, rates, discounts & payment details" : "Add purchased medicines, batch numbers, purchase rates, discounts & auto-inward stock"}
              </p>
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
                  value="${escAttr(initSupplier)}"
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
                  value="${escAttr(initInvNo)}" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Purchase Date</label>
                <input type="date" id="pur-date" class="input-field" value="${escAttr(initDate)}" required />
              </div>
            </div>

            <!-- 2. MEDICINES PURCHASED TABLE (FULL DETAILS) -->
            <div style="margin-top: 20px;">
              <div class="pur-section-title">
                <span>📦 Purchased Medicines & Rates Breakdown</span>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <span style="font-size: 11.5px; color: var(--black-soft); font-weight: 600;">⌨️ ENTER ↵ switches box • Empty Medicine + Enter ➔ Discount / Payment</span>
                  <button type="button" class="btn-cat-action btn-cat-action-primary" id="btn-pur-new-medicine" style="font-size: 12px; font-weight: 700; padding: 6px 12px;" title="Add a brand new medicine directly to Catalog">
                    + New Medicine
                  </button>
                  <button type="button" class="btn-outline-sm" id="btn-add-pur-item" style="font-size: 12px; font-weight: 700;">
                    + Add Medicine Item
                  </button>
                </div>
              </div>

              <!-- Datalist of existing inventory medicines for quick selection -->
              <datalist id="pur-meds-datalist">
                ${medicines.map(m => `<option value="${m.name}">${m.name} | MRP: ₹${m.mrp || m.selling_rate || 0}</option>`).join("")}
              </datalist>

              <div style="overflow-x: auto; border: 1px solid var(--cream-border); border-radius: 8px;">
                <table class="pur-items-table" id="pur-items-table">
                  <thead>
                    <tr>
                      <th style="width: 36px; text-align: center;">#</th>
                      <th style="min-width: 210px;">Medicine Name *</th>
                      <th style="min-width: 120px;">Batch No *</th>
                      <th style="min-width: 130px;">Expiry *</th>
                      <th style="min-width: 112px;">Pack</th>
                      <th style="min-width: 82px;">Qty *</th>
                      <th style="min-width: 108px;">Pur. Rate (₹) *</th>
                      <th style="min-width: 100px;">MRP (₹)</th>
                      <th style="min-width: 84px;">Dis %</th>
                      <th style="min-width: 92px;">GST %</th>
                      <th style="min-width: 115px;">Total (₹)</th>
                      <th style="width: 46px; text-align: center;">✕</th>
                    </tr>
                  </thead>
                  <tbody id="pur-items-tbody">
                    <!-- Dynamic Item Rows -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 3. LIVE TOTALS, DISCOUNT & PAYMENT DETAILS -->
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
                <span class="pur-stat-label">Taxable Amount</span>
                <span class="pur-stat-val" id="pur-taxable-amount-display">₹0.00</span>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Total Discount</span>
                <span class="pur-stat-val" style="color: #16a34a;" id="pur-total-discount-display">-₹0.00</span>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">GST Tax Total</span>
                <span class="pur-stat-val" id="pur-gst-amount-display">₹0.00</span>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Net Purchase Total</span>
                <span class="pur-stat-val" style="color: #1d4ed8;" id="pur-total-amount-display">₹0.00</span>
              </div>
              <div class="pur-summary-stat">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                  <span class="pur-stat-label">Extra Discount</span>
                  <div class="disc-type-toggle" id="pur-discount-type-toggle">
                    <button type="button" class="disc-type-btn pur-disc-type-btn ${initExtraDiscType === 'AMOUNT' ? 'active' : ''}" data-type="AMOUNT" title="Discount in Rupees (₹)">₹</button>
                    <button type="button" class="disc-type-btn pur-disc-type-btn ${initExtraDiscType === 'PERCENT' ? 'active' : ''}" data-type="PERCENT" title="Discount in Percentage (%)">%</button>
                  </div>
                </div>
                <input type="number" step="0.01" min="0" id="pur-bill-discount" class="input-field" style="width: 105px; padding: 4px 8px; font-size: 14px; font-weight: 700; text-align: right;" value="${initExtraDisc}" />
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Payment Mode</span>
                <select id="pur-payment-mode" class="input-field" style="padding: 4px 8px; font-size: 13px;">
                  <option value="BANK TRANSFER" ${initPayMode === 'BANK TRANSFER' ? 'selected' : ''}>Bank Transfer</option>
                  <option value="CASH" ${initPayMode === 'CASH' ? 'selected' : ''}>Cash</option>
                  <option value="UPI" ${initPayMode === 'UPI' ? 'selected' : ''}>UPI</option>
                  <option value="CREDIT / DUE" ${initPayMode.includes('CREDIT') || initPayMode.includes('DUE') ? 'selected' : ''}>Credit / Due</option>
                </select>
              </div>
              <div class="pur-summary-stat">
                <span class="pur-stat-label">Paid Amount (₹)</span>
                <input type="number" step="0.01" min="0" id="pur-paid-amount" class="input-field" style="width: 140px; padding: 4px 8px; font-size: 14px; font-weight: 700;" placeholder="Enter paid amount" value="${initPaidVal}" />
              </div>
            </div>

            <!-- 4. MODAL FOOTER -->
            <div class="modal-dialog-footer" style="margin-top: 22px; display: flex; justify-content: flex-end; gap: 12px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-pur-modal">Cancel</button>
              <button type="submit" id="btn-save-pur-modal" class="btn-dialog-save" style="background: #2563eb !important; color: #ffffff !important; font-weight: 700;">
                ${isEdit ? "💾 Update Purchase & Inward Stock" : "💾 Save Purchase & Inward Stock"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div id="pur-sub-add-medicine-wrap"></div>
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

      let monthVal = "2028-11";
      if (prefill?.expiry_date) {
        monthVal = String(prefill.expiry_date).slice(0, 7);
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
          ${MedHub.renderMonthYearPicker("", monthVal, { compact: true, required: true, mmClass: "pur-item-exp-mm", yyClass: "pur-item-exp-yy" })}
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
          <div class="pur-pack-units-hint" style="font-size: 10px; color: #1d4ed8; font-weight: 700; text-align: center; margin-top: 2px;">
            1 pk = ${MedHub.parsePackSize ? MedHub.parsePackSize(`${packA}x${packB}`).unitsPerPack : (Number(packA) * Number(packB) || 10)} tabs
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
          <div class="pur-qty-tablets-hint" style="font-size: 10px; color: #475569; font-weight: 600; text-align: center; margin-top: 2px;">
            = ${(prefill?.quantity || 10) * (MedHub.parsePackSize ? MedHub.parsePackSize(`${packA}x${packB}`).unitsPerPack : 10)} tabs
          </div>
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
            type="number" 
            class="pur-item-disc" 
            min="0" 
            max="100" 
            step="0.1" 
            placeholder="0" 
            value="${prefill?.discount_percent ?? 0}" 
            style="text-align: center; font-weight: 700;" 
          />
        </td>
        <td>
          <select class="pur-item-gst" style="padding: 6px 6px; border-radius: 6px; border: 1.5px solid var(--cream-border-dark); font-size: 13px; font-weight: 700; width: 100%; min-width: 82px; background: #ffffff;">
            <option value="12" ${prefill?.gst_percent === 12 || (!prefill && prefill?.gst_percent === undefined) ? 'selected' : ''}>12%</option>
            <option value="0" ${prefill?.gst_percent === 0 ? 'selected' : ''}>0%</option>
            <option value="5" ${prefill?.gst_percent === 5 ? 'selected' : ''}>5%</option>
            <option value="18" ${prefill?.gst_percent === 18 ? 'selected' : ''}>18%</option>
            <option value="28" ${prefill?.gst_percent === 28 ? 'selected' : ''}>28%</option>
          </select>
        </td>
        <td>
          <input 
            type="text" 
            class="pur-item-total" 
            readonly 
            value="0.00" 
            style="background: #f8fafc; font-weight: 700; color: #1d4ed8; text-align: right;" 
          />
        </td>
        <td style="text-align: center;">
          <button type="button" class="pur-del-btn" title="Remove row">✕</button>
        </td>
      `;

      tbody.appendChild(tr);

      // Event Listeners for Row Inputs
      const nameInput = tr.querySelector(".pur-item-name");
      const batchInput = tr.querySelector(".pur-item-batch");
      const expMmSelect = tr.querySelector(".pur-item-exp-mm");
      const expYySelect = tr.querySelector(".pur-item-exp-yy");
      const packAInput = tr.querySelector(".pur-item-pack-a");
      const packBInput = tr.querySelector(".pur-item-pack-b");
      const qtyInput = tr.querySelector(".pur-item-qty");
      const rateInput = tr.querySelector(".pur-item-rate");
      const mrpInput = tr.querySelector(".pur-item-mrp");
      const discInput = tr.querySelector(".pur-item-disc");
      const gstInput = tr.querySelector(".pur-item-gst");
      const totalInput = tr.querySelector(".pur-item-total");
      const delBtn = tr.querySelector(".pur-del-btn");

      // Auto-populate MRP, Rate, GST & Pack if selected from catalog
      const applyCatalogMatch = () => {
        const val = nameInput.value.trim().toLowerCase();
        if (!val) return;
        const matched = medicines.find(m => m.name.toLowerCase() === val || (m.name.toLowerCase().startsWith(val) && val.length > 2));
        if (matched) {
          nameInput.value = matched.name;
          if (!mrpInput.value || Number(mrpInput.value) === 0) mrpInput.value = matched.mrp || "";
          if (!rateInput.value || Number(rateInput.value) === 0) rateInput.value = matched.purchase_price || "";
          if (matched.gst_percent !== undefined) gstInput.value = String(matched.gst_percent);
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
      };
      tr._applyCatalogMatch = applyCatalogMatch;
      nameInput.addEventListener("change", applyCatalogMatch);

      const calcRow = () => {
        let dPct = Number(discInput?.value) || 0;
        if (dPct < 0) dPct = 0;
        if (dPct > 100) {
          dPct = 100;
          if (discInput) discInput.value = "100";
        }
        const pA = packAInput?.value.trim() || "1";
        const pB = packBInput?.value.trim() || "10";
        const packInfo = MedHub.parsePackSize ? MedHub.parsePackSize(`${pA}x${pB}`) : { unitsPerPack: 10 };
        const qVal = Math.max(0, Number(qtyInput.value) || 0);
        const packHintEl = tr.querySelector(".pur-pack-units-hint");
        const qtyTabsHintEl = tr.querySelector(".pur-qty-tablets-hint");
        if (packHintEl) packHintEl.innerText = `1 pk = ${packInfo.unitsPerPack} tabs`;
        if (qtyTabsHintEl) qtyTabsHintEl.innerText = `= ${Number((qVal * packInfo.unitsPerPack).toFixed(2))} tabs`;

        const calc = self.calculatePurchaseItem({
          qty: qtyInput.value,
          rate: rateInput.value,
          discPct: dPct,
          gstPct: gstInput.value
        });
        totalInput.value = calc.lineTotal.toFixed(2);
        recalcSummary();
      };

      packAInput?.addEventListener("input", calcRow);
      packBInput?.addEventListener("input", calcRow);
      qtyInput.addEventListener("input", calcRow);
      rateInput.addEventListener("input", calcRow);
      discInput?.addEventListener("input", calcRow);
      gstInput.addEventListener("change", calcRow);

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

    let billDiscountType = initExtraDiscType;
    const billDiscInput = document.getElementById("pur-bill-discount");
    const billDiscTypeBtns = document.querySelectorAll(".pur-disc-type-btn");

    // Calculate Summary Totals (Taxable, Discount, GST, Net Total)
    const recalcSummary = () => {
      const rowsData = Array.from(tbody.querySelectorAll("tr")).map(tr => {
        const pA = tr.querySelector(".pur-item-pack-a")?.value.trim() || "1";
        const pB = tr.querySelector(".pur-item-pack-b")?.value.trim() || "10";
        return {
          name: tr.querySelector(".pur-item-name")?.value.trim() || "",
          pack_size: `${pA}x${pB}`,
          qty: Number(tr.querySelector(".pur-item-qty")?.value) || 0,
          rate: Number(tr.querySelector(".pur-item-rate")?.value) || 0,
          discPct: Number(tr.querySelector(".pur-item-disc")?.value) || 0,
          gstPct: Number(tr.querySelector(".pur-item-gst")?.value) || 0
        };
      });

      let billDiscVal = Number(billDiscInput?.value) || 0;
      if (billDiscVal < 0) {
        billDiscVal = 0;
        if (billDiscInput) billDiscInput.value = "0";
      }
      if (billDiscountType === "PERCENT" && billDiscVal > 100) {
        billDiscVal = 100;
        if (billDiscInput) billDiscInput.value = "100";
      }

      const summary = self.calculatePurchaseSummary(rowsData, billDiscVal, billDiscountType);

      const elItems = document.getElementById("pur-total-items-count");
      if (elItems) elItems.innerText = `${summary.itemCount} Medicines`;

      const elQty = document.getElementById("pur-total-qty-count");
      if (elQty) elQty.innerText = `${summary.totalQty} Packs (${summary.totalTablets} Tabs)`;

      const elTaxable = document.getElementById("pur-taxable-amount-display");
      if (elTaxable) elTaxable.innerText = `₹${summary.finalTaxable.toFixed(2)}`;

      const elDisc = document.getElementById("pur-total-discount-display");
      if (elDisc) elDisc.innerText = `-₹${summary.totalDiscount.toFixed(2)}`;

      const elGst = document.getElementById("pur-gst-amount-display");
      if (elGst) elGst.innerText = `₹${summary.finalGst.toFixed(2)}`;

      const elTotal = document.getElementById("pur-total-amount-display");
      if (elTotal) {
        const displayTotal = (isEdit && summary.itemCount === 0 && Number(existingPurchase?.total_amount) > 0)
          ? Number(existingPurchase.total_amount)
          : summary.netTotal;
        elTotal.innerText = `₹${displayTotal.toFixed(2)}`;
      }

      return summary;
    };

    billDiscTypeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        billDiscTypeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        billDiscountType = btn.dataset.type === "PERCENT" ? "PERCENT" : "AMOUNT";
        if (billDiscInput) {
          if (billDiscountType === "PERCENT") {
            billDiscInput.setAttribute("max", "100");
            if (Number(billDiscInput.value) > 100) billDiscInput.value = "100";
          } else {
            billDiscInput.removeAttribute("max");
          }
        }
        recalcSummary();
      });
    });

    billDiscInput?.addEventListener("input", recalcSummary);

    document.getElementById("pur-paid-amount")?.addEventListener("input", (e) => {
      e.target.dataset.touched = "true";
    });

    // Populate pre-filled items in Edit mode, or 1 initial empty row in New mode
    const existingItems = Array.isArray(existingPurchase?.items) ? existingPurchase.items : [];
    if (isEdit && existingItems.length > 0) {
      existingItems.forEach(it => {
        addItemRow({
          ...it,
          name: it.medicine_name || it.name || ""
        });
      });
      recalcSummary();
    } else {
      addItemRow();
      if (isEdit) recalcSummary();
    }

    // Inline "+ New Medicine" directly from Purchase Screen (same modal as Medicines & Stock)
    document.getElementById("btn-pur-new-medicine")?.addEventListener("click", () => {
      const subWrap = document.getElementById("pur-sub-add-medicine-wrap");
      if (!subWrap || !MedHub.inventory?.openAddMedicineModal) {
        MedHub.toast("Add Medicine modal uplabdh nahi hai", "error");
        return;
      }

      MedHub.inventory.openAddMedicineModal({
        wrapEl: subWrap,
        overlayZIndex: 2500,
        onSaved: async (savedMed) => {
          // Refresh medicines catalog & datalist inside Purchase modal
          medicines = await MedHub.api.getMedicines();
          self.medicinesList = medicines;
          const dl = document.getElementById("pur-meds-datalist");
          if (dl) {
            dl.innerHTML = medicines.map(m => `<option value="${m.name}">${m.name} | MRP: ₹${m.mrp || m.selling_rate || 0}</option>`).join("");
          }

          if (savedMed && savedMed.name) {
            // Find first empty row or append a new row
            let targetRow = Array.from(tbody.querySelectorAll("tr.pur-item-row"))
              .find(r => !r.querySelector(".pur-item-name")?.value.trim());
            if (!targetRow) {
              addItemRow();
              targetRow = tbody.lastElementChild;
            }
            if (targetRow) {
              const nameInp = targetRow.querySelector(".pur-item-name");
              const mrpInp = targetRow.querySelector(".pur-item-mrp");
              const rateInp = targetRow.querySelector(".pur-item-rate");
              const gstSel = targetRow.querySelector(".pur-item-gst");
              const packA = targetRow.querySelector(".pur-item-pack-a");
              const packB = targetRow.querySelector(".pur-item-pack-b");

              if (nameInp) nameInp.value = savedMed.name;
              if (mrpInp && savedMed.mrp) mrpInp.value = savedMed.mrp;
              if (rateInp && savedMed.purchase_price) rateInp.value = savedMed.purchase_price;
              if (gstSel && savedMed.gst_percent !== undefined) gstSel.value = String(savedMed.gst_percent);
              if (savedMed.pack_size) {
                const parts = String(savedMed.pack_size).split(/[xX×]/);
                if (parts.length >= 2) {
                  if (packA) packA.value = parts[0].trim() || "1";
                  if (packB) packB.value = parts[1].trim() || "10";
                } else if (packB) {
                  packB.value = savedMed.pack_size.trim();
                }
              }
              rateInp?.dispatchEvent(new Event("input"));
              targetRow.querySelector(".pur-item-batch")?.focus();
              targetRow.querySelector(".pur-item-batch")?.select();
            }
          }
        }
      });
    });

    // Auto-switch across ALL Purchase inputs & selects on Enter key
    const purchaseFormEl = document.getElementById("purchase-form");
    if (purchaseFormEl && MedHub.enableEnterNavigation) {
      MedHub.enableEnterNavigation(purchaseFormEl, {
        focusSubmitOnLast: true,
        autoFocusFirst: true,
        onEnter: (target, e, { focusField }) => {
          if (e.shiftKey) return false;

          const row = target.closest("tr.pur-item-row");
          if (target.classList.contains("pur-item-name") && row) {
            row._applyCatalogMatch?.();
            const hasOtherFilledRow = Array.from(tbody.querySelectorAll("tr.pur-item-row"))
              .some(r => r !== row && r.querySelector(".pur-item-name")?.value.trim());
            if (!target.value.trim() && hasOtherFilledRow) {
              e.preventDefault();
              e.stopPropagation();
              focusField(document.getElementById("pur-bill-discount") || document.getElementById("pur-payment-mode"));
              return true;
            }
            return false;
          }

          if (target.classList.contains("pur-item-gst") && row) {
            e.preventDefault();
            e.stopPropagation();
            const nextTr = row.nextElementSibling;
            if (nextTr) {
              focusField(nextTr.querySelector(".pur-item-name"));
            } else {
              addItemRow();
              const newTr = tbody.lastElementChild;
              focusField(newTr?.querySelector(".pur-item-name"));
            }
            return true;
          }

          return false;
        }
      });
    }

    // Add row button
    document.getElementById("btn-add-pur-item")?.addEventListener("click", () => {
      addItemRow();
      tbody.lastElementChild?.querySelector(".pur-item-name")?.focus();
    });

    // Close Modal helper
    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-pur-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-pur-modal")?.addEventListener("click", closeModal);

    // Form Submission (Create or Full Edit)
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
      const rowsForSummary = [];

      rows.forEach(tr => {
        const name = tr.querySelector(".pur-item-name")?.value.trim();
        const batchNo = tr.querySelector(".pur-item-batch")?.value.trim();
        const expMm = tr.querySelector(".pur-item-exp-mm")?.value?.trim();
        const expYy = tr.querySelector(".pur-item-exp-yy")?.value?.trim();
        const expDate = (expMm && expYy) ? `${expYy}-${expMm}` : "";
        const packA = tr.querySelector(".pur-item-pack-a")?.value.trim() || "1";
        const packB = tr.querySelector(".pur-item-pack-b")?.value.trim() || "10";
        const packSize = `${packA}x${packB}`;
        const packInfo = MedHub.parsePackSize ? MedHub.parsePackSize(packSize) : { unitsPerPack: 10 };
        const qty = Number(tr.querySelector(".pur-item-qty")?.value) || 0;
        const purchaseRate = Number(tr.querySelector(".pur-item-rate")?.value) || 0;
        const mrp = Number(tr.querySelector(".pur-item-mrp")?.value) || purchaseRate;
        const discPercent = Math.min(100, Math.max(0, Number(tr.querySelector(".pur-item-disc")?.value) || 0));
        const gstPercent = Number(tr.querySelector(".pur-item-gst")?.value) || 0;

        if (name && qty > 0) {
          const calc = self.calculatePurchaseItem({
            qty,
            rate: purchaseRate,
            discPct: discPercent,
            gstPct: gstPercent
          });
          rowsForSummary.push({ name, pack_size: packSize, qty, rate: purchaseRate, discPct: discPercent, gstPct: gstPercent });
          items.push({
            medicine_name: name,
            name: name,
            batch_no: batchNo || ("BT-" + Date.now().toString().slice(-4)),
            expiry_date: expDate || "2028-12-31",
            pack_size: packSize,
            units_per_pack: packInfo.unitsPerPack,
            total_tablets: Number((qty * packInfo.unitsPerPack).toFixed(2)),
            quantity: qty,
            purchase_rate: purchaseRate,
            mrp: mrp,
            discount_percent: discPercent,
            discount_amount: Number(calc.discAmt.toFixed(2)),
            gst_percent: gstPercent,
            taxable_amount: Number(calc.taxable.toFixed(2)),
            gst_amount: Number(calc.gstAmt.toFixed(2)),
            line_total: Number(calc.lineTotal.toFixed(2))
          });
        }
      });

      const isLegacyGeneralEdit = isEdit && existingItems.length === 0 && Number(existingPurchase?.total_amount) > 0;
      if (items.length === 0 && !isLegacyGeneralEdit) {
        MedHub.toast("Kripya kam se kam ek valid medicine aur quantity add karein.", "warning");
        return;
      }

      const finalSummary = self.calculatePurchaseSummary(
        rowsForSummary,
        Number(billDiscInput?.value) || 0,
        billDiscountType
      );
      const totalAmount = (items.length === 0 && isLegacyGeneralEdit)
        ? Number(existingPurchase.total_amount)
        : Number(finalSummary.netTotal.toFixed(2));
      const status = paidAmount >= totalAmount ? "PAID" : (paidAmount > 0 ? "PARTIAL" : "DUE");

      const purchasePayload = {
        supplier_name: supplierName,
        invoice_no: invoiceNo,
        purchase_date: purchaseDate,
        taxable_amount: Number(finalSummary.finalTaxable.toFixed(2)),
        discount_amount: Number(finalSummary.totalDiscount.toFixed(2)),
        extra_discount: Number(billDiscInput?.value) || 0,
        extra_discount_type: billDiscountType,
        gst_amount: Number(finalSummary.finalGst.toFixed(2)),
        total_amount: totalAmount,
        paid_amount: paidAmount,
        status: status,
        payment_mode: paymentMode,
        items: items
      };

      const saved = isEdit
        ? await MedHub.api.updatePurchase(existingPurchase.id || existingPurchase.invoice_no, purchasePayload, existingItems)
        : await MedHub.api.createPurchase(purchasePayload);

      if (saved) {
        MedHub.toast(
          isEdit
            ? `Purchase Invoice "${invoiceNo}" updated successfully!`
            : `Purchase Invoice "${invoiceNo}" with ${items.length} medicines saved & stock updated!`,
          "success"
        );
        closeModal();
        self.purchasesList = await MedHub.api.getPurchases();
        self.render(document.getElementById("page-content"));
      } else {
        MedHub.toast(isEdit ? "Purchase update karne me samasya aayi" : "Purchase save karne me samasya aayi", "error");
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
                    <th style="text-align: center;">Dis %</th>
                    <th style="text-align: center;">GST %</th>
                    <th style="text-align: right;">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length ? items.map((it, idx) => `
                    <tr>
                      <td style="color: #64748b; font-weight: 600;">${idx + 1}</td>
                      <td><strong>${it.medicine_name || it.name}</strong></td>
                      <td><code>${it.batch_no || "—"}</code></td>
                      <td>${MedHub.formatExpiry ? MedHub.formatExpiry(it.expiry_date) : MedHub.formatDate(it.expiry_date)}</td>
                      <td>${it.pack_size || "1x10"}</td>
                      <td style="text-align: center; font-weight: 700;">${it.quantity}</td>
                      <td style="text-align: right;">₹${Number(it.purchase_rate || 0).toFixed(2)}</td>
                      <td style="text-align: right;">₹${Number(it.mrp || 0).toFixed(2)}</td>
                      <td style="text-align: center;">${Number(it.discount_percent || 0)}%</td>
                      <td style="text-align: center;"><span class="badge-cat">${it.gst_percent !== undefined ? it.gst_percent + '%' : '12%'}</span></td>
                      <td style="text-align: right; font-weight: 700; color: #1d4ed8;">₹${Number(it.line_total || (it.quantity * it.purchase_rate) || 0).toFixed(2)}</td>
                    </tr>
                  `).join("") : `
                    <tr>
                      <td colspan="11" style="text-align: center; color: #64748b; padding: 18px;">
                        Is invoice ke specific medicine items logged nahi hain. Total Invoice Amount: ₹${Number(purchase.total_amount).toFixed(2)}
                      </td>
                    </tr>
                  `}
                </tbody>
                <tfoot>
                  ${(Number(purchase.discount_amount) > 0 || Number(purchase.gst_amount) > 0) ? `
                    <tr style="background: #ffffff; font-size: 12.5px; color: var(--black-soft);">
                      <td colspan="10" style="text-align: right;">
                        ${Number(purchase.taxable_amount) > 0 ? `Taxable: <strong>₹${Number(purchase.taxable_amount).toFixed(2)}</strong> &nbsp;|&nbsp; ` : ""}
                        ${Number(purchase.discount_amount) > 0 ? `Total Discount: <strong style="color:#16a34a;">-₹${Number(purchase.discount_amount).toFixed(2)}</strong> &nbsp;|&nbsp; ` : ""}
                        ${Number(purchase.gst_amount) > 0 ? `GST: <strong>₹${Number(purchase.gst_amount).toFixed(2)}</strong>` : ""}
                      </td>
                      <td></td>
                    </tr>
                  ` : ""}
                  <tr style="background: #f8fafc; font-weight: 800; font-size: 14px;">
                    <td colspan="5">Grand Total:</td>
                    <td style="text-align: center;">${totalQty}</td>
                    <td colspan="4"></td>
                    <td style="text-align: right; color: #1d4ed8;">₹${Number(purchase.total_amount).toFixed(2)}</td>
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
  },

  // --------------------------------------------------------------------------
  // MODAL 3: EDIT PURCHASE INVOICE (FULL-SCREEN PRE-FILLED EDITOR)
  // --------------------------------------------------------------------------
  openEditPurchaseModal(p) {
    this.openNewPurchaseModal(p);
  }
};
