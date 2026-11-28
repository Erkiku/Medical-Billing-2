// ============================================================================
// MedEduHub - POS Billing Screen (js/billing.js)
// Redesigned to exact UI of Screenshot 1 (Customer & Doctor 2-card layout)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.billing = {
  inspectedItem: null,
  _isSubmittingBill: false,
  _f9Handler: null,
  _printKeyHandler: null,
  _lastBillSig: "",
  _lastBillAt: 0,

  render(container) {
    if ((!MedHub.state.medicines || MedHub.state.medicines.length === 0) && MedHub.api?.getMedicines) {
      MedHub.api.getMedicines().catch(() => {});
    }
    const store = { ...MedHub.defaultStore, ...MedHub.state.store };
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(/\//g, "-");
    const activeInspect = this.inspectedItem || MedHub.state.cart[MedHub.state.cart.length - 1] || null;
    const fillerCount = Math.max(0, 6 - MedHub.state.cart.length);

    container.innerHTML = `
      <div class="billing-page-wrap marg-full-blueprint">
        <!-- TOP MARG ERP 9+ TITLE BAR -->
        <div class="marg-erp-shell">
          <div class="marg-blue-header marg-erp-topbar">
            <div class="marg-header-left">
              <span class="marg-logo-text">⚡ MARG ERP 9+ • SALE / BILLING ENTRY</span>
              <span class="marg-mode-badge">TYPE: LOCAL / RETAIL</span>
            </div>
            <div class="marg-header-right">
              <span class="marg-shortcut-hint"><strong>${store.store_name || "SAGAR MEDICAL STORE"}</strong> • Date: <strong>${todayStr}</strong> • Enter ↵ shifts box</span>
            </div>
          </div>

          <!-- PARTY / CUSTOMER & DOCTOR LEDGER HEADER (MARG BLUEPRINT) -->
          <div class="marg-party-header">
            <div class="marg-party-row">
              <div class="marg-party-field marg-pf-name">
                <label class="marg-pf-lbl" for="cust-name">Name / Patient <span class="req">*</span></label>
                <input type="text" id="cust-name" class="marg-erp-input"
                  placeholder="Enter the patient name"
                  value="${MedHub.state.customer.name || ""}" />
              </div>
              <div class="marg-party-field marg-pf-mobile">
                <label class="marg-pf-lbl" for="cust-mobile">Mobile</label>
                <input type="tel" id="cust-mobile" class="marg-erp-input"
                  placeholder="10-digit mobile" maxlength="10"
                  value="${MedHub.state.customer.mobile || ""}" />
              </div>
              <div class="marg-party-field marg-pf-date">
                <label class="marg-pf-lbl">Date</label>
                <div class="marg-pf-static">${todayStr}</div>
              </div>
            </div>
            <div class="marg-party-row">
              <div class="marg-party-field marg-pf-addr">
                <label class="marg-pf-lbl" for="cust-address">Address</label>
                <input type="text" id="cust-address" class="marg-erp-input"
                  placeholder="Address / Town / Village"
                  value="${MedHub.state.customer.address || ""}" />
              </div>
              <div class="marg-party-field marg-pf-doc">
                <label class="marg-pf-lbl" for="doc-name">Doctor</label>
                <input type="text" id="doc-name" class="marg-erp-input"
                  placeholder="Enter the doctor name"
                  value="${MedHub.state.doctor.name || ""}" />
              </div>
              <div class="marg-party-field marg-pf-meta">
                <label class="marg-pf-lbl">Items</label>
                <div class="marg-pf-static"><span id="cart-count">${MedHub.state.cart.length}</span> Added</div>
              </div>
            </div>
          </div>

          <!-- UNIFIED MARG ERP SPREADSHEET ENTRY + LEDGER TABLE -->
          <div class="marg-spreadsheet-wrap">
            <table class="marg-spreadsheet-table" id="cart-table">
              <thead>
                <tr>
                  <th style="width: 34px;">#</th>
                  <th class="col-prod">PRODUCT</th>
                  <th class="col-pack">PACK</th>
                  <th class="col-batch">BATCH</th>
                  <th class="col-exp">EXPIRY</th>
                  <th class="col-qty">QTY</th>
                  <th class="col-free">FREE</th>
                  <th class="col-mrp">MRP (₹)</th>
                  <th class="col-dis">DIS %</th>
                  <th class="col-amt">AMOUNT (₹)</th>
                  <th style="width: 64px;">ACT</th>
                </tr>
              </thead>
              <tbody>
                <!-- LIVE ACTIVE ENTRY ROW (ALWAYS AT TOP FOR RAPID KEYBOARD ENTRY) -->
                <tr class="marg-active-entry-row" id="marg-sale-entry-container">
                  <td class="marg-sn-cell">↵</td>
                  <td class="marg-cell-td" style="position: relative;">
                    <input type="text" id="marg-prod-name" class="marg-grid-input" placeholder="Type medicine / brand..." autocomplete="off" />
                    <div id="marg-prod-dropdown" class="medicine-dropdown-results" style="display: none;"></div>
                  </td>
                  <td class="marg-cell-td">
                    <input type="text" id="marg-prod-pack" class="marg-grid-input text-center" placeholder="1x10" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="text" id="marg-prod-batch" class="marg-grid-input text-center" placeholder="Batch" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="text" id="marg-prod-exp" class="marg-grid-input text-center" placeholder="MM/YY" maxlength="7" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="number" id="marg-prod-qty" class="marg-grid-input text-right" value="1" min="1" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="number" id="marg-prod-free" class="marg-grid-input text-right" value="0" min="0" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="number" step="0.01" id="marg-prod-rate" class="marg-grid-input text-right" placeholder="0.00" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="number" step="0.01" min="0" max="100" id="marg-prod-dis" class="marg-grid-input text-right" value="0" />
                  </td>
                  <td class="marg-cell-td">
                    <input type="text" id="marg-prod-amount" class="marg-grid-input marg-readonly text-right" readonly placeholder="0.00" tabindex="-1" />
                  </td>
                  <td class="marg-cell-td text-center">
                    <button type="button" id="btn-marg-add" class="marg-add-btn" title="Add Item (Enter)">+ Add</button>
                  </td>
                </tr>
              </tbody>
              <!-- ADDED BILL ITEMS ROWS -->
              <tbody id="cart-items-body">
                ${this.renderCartRows()}
              </tbody>
              <!-- EMPTY SPREADSHEET FILLER ROWS (MARG ERP LEDGER LOOK) -->
              <tbody id="marg-filler-rows">
                ${Array.from({ length: fillerCount }).map(() => `
                  <tr class="marg-filler-tr">
                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- BOTTOM 3-PANEL MARG ERP FOOTER: ITEM INSPECTOR | PAYMENT & QR | TOTALS & PRINT -->
          <div class="marg-footer-panels">
            <!-- PANEL 1: ACTIVE ITEM DETAILS (BOTTOM LEFT OF MARG BLUEPRINT) -->
            <div class="marg-foot-panel marg-panel-inspector" id="marg-item-inspector">
              ${this.renderItemInspector(activeInspect)}
            </div>

            <!-- PANEL 2: PAYMENT MODE, QR & AMOUNT RECEIVED -->
            <div class="marg-foot-panel marg-panel-payment">
              <div class="marg-panel-title-row">
                <span class="marg-panel-title">Payment & Settlement</span>
                ${MedHub.state.cart.length > 0 ? `
                  <button type="button" class="btn-text-danger" id="btn-clear-cart" style="font-size: 11px; padding: 2px 6px;">
                    ${MedHub.icons.trash} Clear
                  </button>
                ` : ""}
              </div>
              <div class="pay-mode-chips" style="margin-top: 6px;">
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'CASH' ? 'active' : ''}" data-mode="CASH">Cash</button>
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'UPI' ? 'active' : ''}" data-mode="UPI">UPI / QR</button>
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'CARD' ? 'active' : ''}" data-mode="CARD">Card</button>
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'CREDIT' ? 'active' : ''}" data-mode="CREDIT">Udhaar</button>
              </div>
              <div class="marg-received-row">
                <label class="marg-pf-lbl" for="amt-received">Amount Received (₹):</label>
                <input type="number" step="1" min="0" id="amt-received" class="marg-erp-input text-right"
                  placeholder="Enter amount received"
                  value="${MedHub.state.amountReceived !== undefined && MedHub.state.amountReceived !== null ? MedHub.state.amountReceived : ''}" />
              </div>
              <div id="pos-due-preview-row" style="margin-top: 6px; padding: 5px 10px; border-radius: 6px; background: var(--cream-hover); border: 1px solid var(--cream-border); display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                <span style="font-weight: 700; color: var(--black-soft);">Balance Due (Udhaar):</span>
                <strong id="pos-due-amount" style="color: ${this.calculatePaymentBreakdown().dueAmount > 0 ? '#dc2626' : '#16a34a'};">${MedHub.rupee(this.calculatePaymentBreakdown().dueAmount)}</strong>
              </div>
              <div id="pos-counter-qr" style="margin-top: 8px; padding: 8px 10px; background: var(--cream-hover); border-radius: 6px; border: 1px dashed var(--cream-border-dark); display: ${MedHub.state.paymentMode === 'UPI' ? 'flex' : 'none'}; align-items: center; gap: 10px;">
                <img src="${(store.custom_qr_image && store.custom_qr_image.trim()) ? store.custom_qr_image : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(store.upi_id || "sagarstore@upi")}&pn=${encodeURIComponent(store.payee_name || store.store_name || "Pharmacy")}&am=${this.calculateGrandTotal()}&cu=INR`)}`}" alt="Shop QR" style="width: 48px; height: 48px; object-fit: contain; background: #ffffff; padding: 2px; border-radius: 4px; border: 1px solid var(--cream-border); flex-shrink: 0;" />
                <div style="font-size: 11px;">
                  <div style="font-weight: 800; color: var(--black-deep);">STORE COUNTER QR</div>
                  <div style="color: var(--black-soft);">${store.upi_id || "sagarstore@upi"}</div>
                  <div style="font-weight: 700; color: var(--pink-primary);">Pay: ${MedHub.rupee(this.calculateGrandTotal())}</div>
                </div>
              </div>
            </div>

            <!-- PANEL 3: VALUE OF GOODS, DISCOUNT & GRAND TOTAL (BOTTOM RIGHT OF MARG BLUEPRINT) -->
            <div class="marg-foot-panel marg-panel-totals checkout-card">
              <div class="summary-rows">
                <div class="summary-row">
                  <span>Value of Goods (Subtotal):</span>
                  <span id="summary-subtotal" class="summary-val">${MedHub.rupee(this.calculateSubtotal())}</span>
                </div>
                <div class="summary-row">
                  <div class="discount-label-wrap">
                    <span>Discount:</span>
                    <div class="disc-type-toggle" id="bill-discount-type-toggle">
                      <button type="button" class="disc-type-btn ${(MedHub.state.discountType || 'AMOUNT') === 'AMOUNT' ? 'active' : ''}" data-type="AMOUNT" title="Discount in Rupees (₹)">₹</button>
                      <button type="button" class="disc-type-btn ${MedHub.state.discountType === 'PERCENT' ? 'active' : ''}" data-type="PERCENT" title="Discount in Percentage (%)">%</button>
                    </div>
                  </div>
                  <input type="number" id="bill-discount" class="marg-erp-input text-right" min="0" step="0.01"
                    ${MedHub.state.discountType === 'PERCENT' ? 'max="100"' : ''}
                    value="${MedHub.state.discount || 0}" style="width: 88px;" />
                </div>
                <div class="summary-row discount-preview-row" id="summary-discount-preview-row" style="${this.calculateDiscountAmount() > 0 ? '' : 'display:none;'}">
                  <span id="summary-discount-label" style="font-size: 11.5px; color: #16a34a; font-weight: 600;">
                    Discount Applied${MedHub.state.discountType === 'PERCENT' ? ` (${Math.min(100, Number(MedHub.state.discount || 0))}%)` : ''}:
                  </span>
                  <span id="summary-discount-applied" style="font-size: 12px; font-weight: 700; color: #16a34a;">
                    -${MedHub.rupee(this.calculateDiscountAmount())}
                  </span>
                </div>
                <div class="summary-row divider-row">
                  <span class="total-label">NET GRAND TOTAL:</span>
                  <span id="summary-grand-total" class="grand-total-val">${MedHub.rupee(this.calculateGrandTotal())}</span>
                </div>
              </div>
              <button type="button" id="btn-save-print" class="btn-primary-large" style="margin-top: 10px;" ${MedHub.state.cart.length === 0 ? 'disabled' : ''}>
                ${MedHub.icons.print} Complete & Print Bill (F9)
              </button>
            </div>
          </div>

          <!-- BOTTOM ERP KEYBOARD SHORTCUT BAR -->
          <div class="marg-shortcut-bar">
            <span><strong>ENTER ↵</strong> Next Input Box</span>
            <span><strong>SHIFT + ENTER</strong> Previous Box</span>
            <span><strong>↑ ↓</strong> Select Medicine</span>
            <span><strong>Empty Product + ENTER</strong> Jump to Discount</span>
            <span><strong>F9</strong> Complete & Print Bill</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  renderItemInspector(item) {
    if (!item) {
      return `
        <div class="marg-inspector-grid">
          <div class="marg-insp-row"><span>Item :</span><strong>—</strong></div>
          <div class="marg-insp-row"><span>Batch :</span><strong>—</strong><span>Stock :</span><strong>—</strong></div>
          <div class="marg-insp-row"><span>Expiry :</span><strong>—</strong><span>MRP/Tab :</span><strong>₹0.00</strong></div>
          <div class="marg-insp-row"><span>Company :</span><strong>—</strong><span>Schedule :</span><strong>General</strong></div>
        </div>
      `;
    }
    const stockRaw = item.chosenBatch?.quantity ?? item.available_qty ?? item.max_stock;
    const batch = item.batch_no || item.chosenBatch?.batch_no || "BT-DEFAULT";
    const exp = MedHub.formatExpiry(item.expiry_date || item.chosenBatch?.expiry_date || item.nearest_expiry || "");
    const sch = item.drug_schedule || "General";
    const packInfo = MedHub.parsePackSize ? MedHub.parsePackSize(item.pack_size || "1x10") : { unitsPerPack: 10 };
    const unitsPerPack = Math.max(1, Number(item.units_per_pack || packInfo.unitsPerPack || 10));

    const hasExplicitPerTab = item.per_tab_mrp !== undefined;
    const rawFallbackMrp = Number(item.mrp) > 0
      ? Number(item.mrp)
      : (Number(item.selling_rate) > 0 ? Number(item.selling_rate) : (Number(item.rate) || Number(item.chosenBatch?.selling_price) || 0));
    const stripMrp = Number(item.strip_mrp) > 0
      ? Number(item.strip_mrp)
      : (hasExplicitPerTab ? (Number(item.per_tab_mrp) * unitsPerPack) : rawFallbackMrp);
    const perTabPrice = hasExplicitPerTab
      ? Number(item.per_tab_mrp)
      : (unitsPerPack > 0 ? stripMrp / unitsPerPack : stripMrp);

    const unitLbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(item) : { singular: "tab", plural: "tabs", packUnit: "tabs/pk" };
    const totalStockInner = (stockRaw !== undefined && stockRaw !== null && stockRaw !== "" && !isNaN(Number(stockRaw)))
      ? Number((Number(stockRaw) * unitsPerPack).toFixed(0))
      : null;
    const stockDisplay = totalStockInner !== null
      ? `${Number(stockRaw)} pk (${totalStockInner} ${totalStockInner === 1 ? unitLbl.singular : unitLbl.plural})`
      : "—";

    return `
      <div class="marg-inspector-grid">
        <div class="marg-insp-row"><span>Item :</span><strong>${item.name || "—"} (${item.pack_size || "1x10"} • ${unitsPerPack} ${unitLbl.packUnit})</strong></div>
        <div class="marg-insp-row"><span>Batch :</span><strong>${batch}</strong><span>Stock :</span><strong style="color:#1d4ed8;">${stockDisplay}</strong></div>
        <div class="marg-insp-row"><span>Expiry :</span><strong>${exp || "—"}</strong><span>MRP/${unitLbl.singular} :</span><strong>₹${perTabPrice.toFixed(2)}${unitsPerPack > 1 ? ` (Pack: ₹${stripMrp.toFixed(2)})` : ""}</strong></div>
        <div class="marg-insp-row"><span>Company :</span><strong>${item.company || "—"}</strong><span>Schedule :</span><strong>${sch}</strong></div>
      </div>
    `;
  },

  calculateSubtotal() {
    return MedHub.state.cart.reduce((sum, item) => sum + (item.line_total || 0), 0);
  },

  calculateDiscountAmount() {
    const sub = this.calculateSubtotal();
    const rawVal = Math.max(0, Number(MedHub.state.discount || 0));
    if (MedHub.state.discountType === "PERCENT") {
      const pct = Math.min(100, rawVal);
      return Math.min(sub, Number(((sub * pct) / 100).toFixed(2)));
    }
    return Math.min(sub, Number(rawVal.toFixed(2)));
  },

  calculateGrandTotal() {
    const sub = this.calculateSubtotal();
    const disc = this.calculateDiscountAmount();
    return Math.max(0, Number((sub - disc).toFixed(2)));
  },

  renderCartRows() {
    if (!MedHub.state.cart.length) return "";
    return MedHub.state.cart.map((it, idx) => {
      const freeVal = Number(it.free_qty || 0);
      const disVal = Number(it.discount_percent || 0);
      return `
        <tr data-index="${idx}" class="marg-cart-row">
          <td class="text-center">${idx + 1}</td>
          <td>
            <strong>${it.name}</strong>
          </td>
          <td class="text-center">
            ${it.pack_size || "1x10"}
            <div style="font-size:9.5px;color:#64748b;white-space:nowrap;">${(MedHub.parsePackSize ? MedHub.parsePackSize(it.pack_size || "1x10").unitsPerPack : (it.units_per_pack || 10))} ${(MedHub.getUnitLabels ? MedHub.getUnitLabels(it).packUnit : "tabs/pk")}</div>
          </td>
          <td class="text-center"><span class="badge-code">${it.batch_no || "BT-DEFAULT"}</span></td>
          <td class="text-center"><span class="badge-exp-month">${MedHub.formatExpiry(it.expiry_date)}</span></td>
          <td class="text-right">
            <input type="number" class="marg-grid-input cart-qty-input text-right" min="1" max="${it.max_stock || 999}"
              value="${it.quantity}" data-index="${idx}" />
          </td>
          <td class="text-right">
            <input type="number" class="marg-grid-input cart-free-input text-right" min="0"
              value="${freeVal}" data-index="${idx}" />
          </td>
          <td class="text-right">₹${Number(it.mrp ?? it.rate).toFixed(2)}</td>
          <td class="text-right">
            <input type="number" step="0.01" min="0" max="100" class="marg-grid-input cart-dis-input text-right"
              value="${disVal}" data-index="${idx}" />
          </td>
          <td class="text-right"><strong>₹${Number(it.line_total).toFixed(2)}</strong></td>
          <td class="text-center">
            <button type="button" class="btn-icon-danger btn-remove-item" data-index="${idx}" title="Remove">
              ${MedHub.icons.trash}
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  bindEvents(container) {
    const self = this;

    // Customer / Doctor input state bindings
    const custName = container.querySelector("#cust-name");
    const custMobile = container.querySelector("#cust-mobile");
    const custAddress = container.querySelector("#cust-address");
    const docName = container.querySelector("#doc-name");

    custName?.addEventListener("input", (e) => { MedHub.state.customer.name = e.target.value; });
    custMobile?.addEventListener("input", (e) => { MedHub.state.customer.mobile = e.target.value; });
    custAddress?.addEventListener("input", (e) => { MedHub.state.customer.address = e.target.value; });
    docName?.addEventListener("input", (e) => { MedHub.state.doctor.name = e.target.value; });

    // MARG ERP 9+ ENTRY INPUTS
    const prodInput = container.querySelector("#marg-prod-name");
    const packInput = container.querySelector("#marg-prod-pack");
    const batchInput = container.querySelector("#marg-prod-batch");
    const expInput = container.querySelector("#marg-prod-exp");
    const qtyInput = container.querySelector("#marg-prod-qty");
    const freeInput = container.querySelector("#marg-prod-free");
    const rateInput = container.querySelector("#marg-prod-rate");
    const itemDisInput = container.querySelector("#marg-prod-dis");
    const amountInput = container.querySelector("#marg-prod-amount");
    const addBtn = container.querySelector("#btn-marg-add");
    const prodDropdown = container.querySelector("#marg-prod-dropdown");
    const inspectorEl = container.querySelector("#marg-item-inspector");

    // Discount & Received bindings
    const discInput = container.querySelector("#bill-discount");
    const amtReceivedInput = container.querySelector("#amt-received");

    const focusAndSelect = (el) => {
      if (!el) return;
      el.focus();
      if (typeof el.select === "function") {
        try { el.select(); } catch (e) {}
      }
    };

    const orderedEntryInputs = [
      custName,
      custMobile,
      custAddress,
      docName,
      prodInput,
      packInput,
      batchInput,
      expInput,
      qtyInput,
      freeInput,
      rateInput,
      itemDisInput,
      discInput,
      amtReceivedInput
    ].filter(Boolean);

    // Universal Shift+Enter backward shift across ALL input boxes
    orderedEntryInputs.forEach((inp, idx) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          if (idx > 0) focusAndSelect(orderedEntryInputs[idx - 1]);
        }
      });
    });

    // Forward Enter Key Navigation Chain: Party/Doctor Header -> Product
    custName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(custMobile); }
    });
    custMobile?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(custAddress); }
    });
    custAddress?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(docName); }
    });
    docName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(prodInput); }
    });

    // Discount type toggle & value
    const discTypeBtns = container.querySelectorAll(".disc-type-btn");
    discTypeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        discTypeBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const nextType = btn.dataset.type === "PERCENT" ? "PERCENT" : "AMOUNT";
        MedHub.state.discountType = nextType;
        if (discInput) {
          if (nextType === "PERCENT") {
            discInput.setAttribute("max", "100");
            if (Number(discInput.value) > 100) {
              discInput.value = "100";
              MedHub.state.discount = 100;
            }
          } else {
            discInput.removeAttribute("max");
          }
        }
        self.updateTotals();
      });
    });

    discInput?.addEventListener("input", (e) => {
      let val = Math.max(0, Number(e.target.value) || 0);
      if (MedHub.state.discountType === "PERCENT" && val > 100) {
        val = 100;
        e.target.value = "100";
      }
      MedHub.state.discount = val;
      self.updateTotals();
    });

    amtReceivedInput?.addEventListener("input", (e) => {
      MedHub.state.amountReceived = e.target.value;
      self.updateTotals();
    });

    // Enter Key Navigation: Discount -> Received -> Complete & Print
    discInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        focusAndSelect(amtReceivedInput);
      }
    });
    amtReceivedInput?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const cur = Number(amtReceivedInput.value) || 0;
        const delta = e.key === "ArrowUp" ? 1 : -1;
        const nextVal = Math.max(0, Number((cur + delta).toFixed(2)));
        amtReceivedInput.value = String(nextVal);
        MedHub.state.amountReceived = String(nextVal);
        self.updateTotals();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        self.submitBill();
      }
    });

    // Payment mode chips
    container.querySelectorAll(".pay-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".pay-chip").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        MedHub.state.paymentMode = btn.dataset.mode;
        const upiCard = document.getElementById("pos-counter-qr");
        if (upiCard) {
          upiCard.style.display = btn.dataset.mode === "UPI" ? "flex" : "none";
        }
        self.updateTotals();
      });
    });

    let currentSelectedMed = null;
    let basePackUnits = 0;
    let baseCatalogMrp = 0;
    let manualRateOverride = false;
    let currentSearchResults = [];
    let highlightedIndex = 0;
    let inspectorLookupToken = 0;

    // Helper: Sync bottom inspector box cleanly for active entry row or matched medicine
    const syncEntryInspector = (medObj) => {
      if (!inspectorEl) return;
      if (!medObj) {
        inspectorEl.innerHTML = self.renderItemInspector(MedHub.state.cart[MedHub.state.cart.length - 1] || null);
        return;
      }
      const packStr = packInput?.value?.trim() || medObj.pack_size || "1x10";
      const parsedPack = MedHub.parsePackSize ? MedHub.parsePackSize(packStr) : { unitsPerPack: 10 };
      const catalogStripMrp = Number(medObj.strip_mrp) > 0
        ? Number(medObj.strip_mrp)
        : (Number(medObj.mrp) > 0 ? Number(medObj.mrp) : (Number(medObj.selling_rate) > 0 ? Number(medObj.selling_rate) : (Number(medObj.chosenBatch?.selling_price) || Number(baseCatalogMrp) || 0)));
      const livePerTab = rateInput && rateInput.value !== "" && !isNaN(parseFloat(rateInput.value))
        ? parseFloat(rateInput.value)
        : (parsedPack.unitsPerPack > 0 ? catalogStripMrp / parsedPack.unitsPerPack : catalogStripMrp);

      inspectorEl.innerHTML = self.renderItemInspector({
        ...medObj,
        pack_size: packStr,
        units_per_pack: parsedPack.unitsPerPack,
        strip_mrp: catalogStripMrp,
        per_tab_mrp: livePerTab,
        batch_no: (batchInput?.value?.trim()) || medObj.batch_no || medObj.chosenBatch?.batch_no,
        expiry_date: (expInput?.value?.trim()) || medObj.expiry_date || medObj.chosenBatch?.expiry_date || medObj.nearest_expiry,
        quantity: parseFloat(qtyInput?.value) || 1
      });
    };

    // Helper: Recalculate Marg Item Amount (Qty * Per-Tablet MRP * (1 - Dis%/100))
    const recalcMargAmount = () => {
      const q = parseFloat(qtyInput?.value) || 0;
      const r = parseFloat(rateInput?.value) || 0;
      const d = Math.min(100, Math.max(0, parseFloat(itemDisInput?.value) || 0));
      const net = Math.max(0, q * r * (1 - d / 100));
      if (amountInput) amountInput.value = net.toFixed(2);
    };

    // Recompute 1-Tablet MRP dynamically when pack size changes
    const recalcPackMrp = () => {
      const packStr = packInput?.value?.trim() || "1x10";
      const parsedPack = MedHub.parsePackSize ? MedHub.parsePackSize(packStr) : { unitsPerPack: 10 };
      if (!manualRateOverride && currentSelectedMed && baseCatalogMrp > 0) {
        const perTabMrp = parsedPack.unitsPerPack > 0 ? (baseCatalogMrp / parsedPack.unitsPerPack) : baseCatalogMrp;
        if (rateInput) rateInput.value = perTabMrp.toFixed(2);
      }
      if (currentSelectedMed) syncEntryInspector(currentSelectedMed);
      recalcMargAmount();
    };

    packInput?.addEventListener("input", recalcPackMrp);
    batchInput?.addEventListener("input", () => { if (currentSelectedMed) syncEntryInspector(currentSelectedMed); });
    expInput?.addEventListener("input", () => { if (currentSelectedMed) syncEntryInspector(currentSelectedMed); });
    qtyInput?.addEventListener("input", recalcMargAmount);
    freeInput?.addEventListener("input", recalcMargAmount);
    rateInput?.addEventListener("input", () => {
      manualRateOverride = true;
      recalcMargAmount();
      if (currentSelectedMed) syncEntryInspector(currentSelectedMed);
    });
    itemDisInput?.addEventListener("input", recalcMargAmount);

    let inspectorBatchTimer = null;
    const previewMatchedMedicine = (val) => {
      const q = String(val || "").trim().toLowerCase();
      if (!q) {
        currentSelectedMed = null;
        basePackUnits = 0;
        baseCatalogMrp = 0;
        syncEntryInspector(null);
        return;
      }
      const pool = (currentSearchResults && currentSearchResults.length)
        ? currentSearchResults
        : (MedHub.state.medicines || []);
      const exact = pool.find(m => m.name && m.name.toLowerCase() === q);
      const prefix = exact || pool.find(m => m.name && m.name.toLowerCase().startsWith(q)) || pool.find(m => m.name && m.name.toLowerCase().includes(q));
      if (!prefix) return;

      const token = ++inspectorLookupToken;
      self.inspectedItem = prefix;
      if (inspectorEl) inspectorEl.innerHTML = self.renderItemInspector(prefix);
      if (prefix.chosenBatch || !MedHub.api?.getBatches) return;

      clearTimeout(inspectorBatchTimer);
      inspectorBatchTimer = setTimeout(() => {
        Promise.resolve(MedHub.api.getBatches(prefix.id)).then((batches) => {
          if (token !== inspectorLookupToken) return;
          const chosenBatch = (batches && batches.length) ? batches[0] : null;
          prefix.chosenBatch = chosenBatch;
          if (inspectorEl) inspectorEl.innerHTML = self.renderItemInspector(prefix);
        }).catch(() => {});
      }, 90);
    };

    // Live Search for Marg Product
    const searchMargProducts = MedHub.debounce(async (val) => {
      if (!val || val.trim().length === 0) {
        if (prodDropdown) prodDropdown.style.display = "none";
        currentSearchResults = [];
        syncEntryInspector(null);
        return;
      }
      const results = await MedHub.api.searchMedicines(val);
      currentSearchResults = results || [];
      highlightedIndex = 0;

      if (!results || results.length === 0) {
        if (prodDropdown) {
          prodDropdown.innerHTML = `<div class="search-no-res">No medicines found for "${val}"</div>`;
          prodDropdown.style.display = "block";
        }
        return;
      }

      renderMargDropdown();
    }, 80);

    const renderMargDropdown = () => {
      if (!prodDropdown) return;
      prodDropdown.innerHTML = currentSearchResults.map((m, idx) => {
        const pInfo = MedHub.parsePackSize ? MedHub.parsePackSize(m.pack_size || "1x10") : { unitsPerPack: 10 };
        const stripM = Number(m.mrp) > 0 ? Number(m.mrp) : (Number(m.selling_rate) || 0);
        const tabM = pInfo.unitsPerPack > 0 ? (stripM / pInfo.unitsPerPack) : stripM;
        const uLbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(m) : { singular: "tab" };
        const stStatus = MedHub.computeStockStatus ? MedHub.computeStockStatus(m.available_qty) : (m.available_qty <= 0 ? "out" : (m.available_qty <= 1 ? "low" : "in"));
        return `
        <div class="search-item ${idx === highlightedIndex ? 'highlighted' : ''}" data-id="${m.id}" data-idx="${idx}">
          <div class="search-item-left">
            <span class="search-item-name">${m.name}</span>
            <span class="search-item-comp">${m.salt_composition || m.generic_name || m.company || ""}</span>
          </div>
          <div class="search-item-right">
            <span class="badge-schedule ${m.drug_schedule && m.drug_schedule.includes('H') ? 'schedule-h' : 'schedule-gen'}">
              ${m.drug_schedule || 'General'}
            </span>
            <span class="search-item-stock ${stStatus === 'out' ? 'stock-out' : (stStatus === 'low' ? 'stock-low' : 'stock-in')}">
              Stock: ${m.available_qty || 0}
            </span>
            <span class="search-item-mrp">₹${tabM.toFixed(2)}/${uLbl.singular}</span>
          </div>
        </div>
      `;
      }).join("");
      prodDropdown.style.display = "block";

      const highlightedEl = prodDropdown.querySelector(`.search-item[data-idx="${highlightedIndex}"]`);
      if (highlightedEl && highlightedIndex > 0 && prodDropdown.scrollHeight > prodDropdown.clientHeight) {
        const scrollTask = () => highlightedEl.scrollIntoView({ block: "nearest" });
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(scrollTask);
        else scrollTask();
      }
      if (currentSearchResults[highlightedIndex]) {
        previewMatchedMedicine(currentSearchResults[highlightedIndex].name);
      }

      prodDropdown.querySelectorAll(".search-item").forEach(itemEl => {
        itemEl.addEventListener("click", () => {
          const idx = Number(itemEl.dataset.idx);
          selectMargProduct(currentSearchResults[idx]);
        });
      });
    };

    // Populate Marg Item Row from selected medicine (with per-tablet MRP & live inspector)
    const selectMargProduct = async (med) => {
      if (!med) return;
      currentSelectedMed = med;
      self.inspectedItem = med;
      if (prodInput) prodInput.value = med.name;
      if (packInput) packInput.value = med.pack_size || "1x10";

      const initMrp = Number(med.mrp || med.selling_rate || med.chosenBatch?.selling_price || 0);
      const basePackInfo = MedHub.parsePackSize ? MedHub.parsePackSize(med.pack_size || "1x10") : { unitsPerPack: 10 };
      basePackUnits = Math.max(1, basePackInfo.unitsPerPack || 1);
      baseCatalogMrp = initMrp;
      const initPerTabMrp = basePackUnits > 0 ? (initMrp / basePackUnits) : initMrp;
      manualRateOverride = false;
      if (rateInput) rateInput.value = initPerTabMrp.toFixed(2);
      if (qtyInput) qtyInput.value = 1;
      if (freeInput) freeInput.value = 0;
      if (itemDisInput) itemDisInput.value = 0;
      if (batchInput) batchInput.value = med.chosenBatch ? med.chosenBatch.batch_no : ("BT-" + (med.barcode || "01"));
      if (expInput) expInput.value = MedHub.formatExpiry(med.chosenBatch ? med.chosenBatch.expiry_date : (med.nearest_expiry || "2028-11"));

      recalcMargAmount();
      syncEntryInspector(currentSelectedMed);
      if (prodDropdown) prodDropdown.style.display = "none";

      // Shift to QTY immediately for crisp zero-lag keyboard flow
      focusAndSelect(qtyInput);

      // Hydrate latest batch/expiry asynchronously if not already attached
      if (MedHub.api?.getBatches) {
        const batches = await MedHub.api.getBatches(med.id);
        const chosenBatch = (batches && batches.length) ? batches[0] : (med.chosenBatch || null);
        if (currentSelectedMed && currentSelectedMed.id === med.id && chosenBatch) {
          currentSelectedMed.chosenBatch = chosenBatch;
          if (batchInput) batchInput.value = chosenBatch.batch_no;
          if (expInput) expInput.value = MedHub.formatExpiry(chosenBatch.expiry_date);
          syncEntryInspector(currentSelectedMed);
        }
      }
    };

    prodInput?.addEventListener("input", (e) => {
      previewMatchedMedicine(e.target.value);
      searchMargProducts(e.target.value);
    });
    prodInput?.addEventListener("change", async (e) => {
      const val = String(e.target.value || "").trim().toLowerCase();
      if (!val) return;
      if (currentSelectedMed && currentSelectedMed.name?.toLowerCase() === val) return;
      const list = (currentSearchResults && currentSearchResults.length)
        ? currentSearchResults
        : (MedHub.state.medicines && MedHub.state.medicines.length
          ? MedHub.state.medicines
          : (MedHub.api?.searchMedicines ? await MedHub.api.searchMedicines(val) : []));
      const exact = (list || []).find(m => m.name && m.name.toLowerCase() === val);
      if (exact) {
        await selectMargProduct(exact);
      } else {
        previewMatchedMedicine(e.target.value);
      }
    });
    prodInput?.addEventListener("focus", (e) => {
      if (e.target.value && e.target.value.trim().length > 0) {
        previewMatchedMedicine(e.target.value);
        searchMargProducts(e.target.value);
      }
    });

    // Keyboard navigation in Product Search: ArrowUp, ArrowDown, Enter
    prodInput?.addEventListener("keydown", (e) => {
      if (e.shiftKey) return;
      if (prodDropdown && prodDropdown.style.display !== "none" && currentSearchResults.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          highlightedIndex = (highlightedIndex + 1) % currentSearchResults.length;
          renderMargDropdown();
          return;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          highlightedIndex = (highlightedIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
          renderMargDropdown();
          return;
        } else if (e.key === "Enter") {
          e.preventDefault();
          selectMargProduct(currentSearchResults[highlightedIndex]);
          return;
        } else if (e.key === "Escape") {
          prodDropdown.style.display = "none";
          return;
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const typedName = (prodInput.value || "").trim();
        if (!typedName) {
          focusAndSelect(discInput);
          return;
        }
        if (currentSelectedMed && currentSelectedMed.name?.toLowerCase() === typedName.toLowerCase()) {
          syncEntryInspector(currentSelectedMed);
          focusAndSelect(qtyInput);
          return;
        }
        const pool = (currentSearchResults && currentSearchResults.length)
          ? currentSearchResults
          : (MedHub.state.medicines || []);
        const exact = pool.find(m => m.name && m.name.toLowerCase() === typedName.toLowerCase());
        if (exact) {
          selectMargProduct(exact);
        } else {
          focusAndSelect(packInput);
        }
      }
    });

    // Complete Enter Key Chain in Marg Entry Row:
    // Pack -> Batch -> Expiry -> Qty -> Free -> MRP -> Dis % -> Commit Item & Return to Product
    packInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(batchInput); }
    });
    batchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(expInput); }
    });
    expInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(qtyInput); }
    });
    qtyInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(freeInput); }
    });
    freeInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(rateInput); }
    });
    rateInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); focusAndSelect(itemDisInput); }
    });
    itemDisInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitMargItem();
      }
    });

    // Commit Marg Item to Cart
    const commitMargItem = () => {
      const prodName = prodInput?.value?.trim();
      if (!prodName) {
        MedHub.toast("Kripya dawai ka naam select karein", "warning");
        focusAndSelect(prodInput);
        return;
      }

      const q = parseFloat(qtyInput?.value) || 1;
      const freeQty = Math.max(0, parseFloat(freeInput?.value) || 0);
      const r = parseFloat(rateInput?.value) || 0;
      const disPct = Math.min(100, Math.max(0, parseFloat(itemDisInput?.value) || 0));
      const pack = packInput?.value?.trim() || "1x10";
      const packInfo = MedHub.parsePackSize ? MedHub.parsePackSize(pack) : { unitsPerPack: 10 };
      const unitsPerPack = packInfo.unitsPerPack;
      const totalTablets = Math.max(0, Number(((q + freeQty) * unitsPerPack).toFixed(2)));
      const batch = batchInput?.value?.trim() || "BT-DEFAULT";
      const exp = expInput?.value?.trim() || "11/28";
      const net = Math.max(0, Number((q * r * (1 - disPct / 100)).toFixed(2)));

      const medId = currentSelectedMed ? currentSelectedMed.id : ("m-" + Date.now());
      const batchId = currentSelectedMed?.chosenBatch?.id || null;
      const maxStock = currentSelectedMed?.available_qty || 999;
      const sch = currentSelectedMed?.drug_schedule || "General";
      const comp = currentSelectedMed?.salt_composition || "";

      const existing = MedHub.state.cart.find(it => it.medicine_id === medId && it.batch_no === batch);
      if (existing) {
        existing.quantity += q;
        existing.free_qty = (Number(existing.free_qty) || 0) + freeQty;
        existing.mrp = r;
        existing.rate = r;
        existing.discount_percent = disPct;
        existing.line_total = Math.max(0, Number((existing.quantity * existing.rate * (1 - disPct / 100)).toFixed(2)));
        self.inspectedItem = existing;
      } else {
        const added = {
          medicine_id: medId,
          name: prodName,
          company: currentSelectedMed?.company || "",
          salt_composition: comp,
          pack_size: pack,
          units_per_pack: unitsPerPack,
          total_tablets: totalTablets,
          drug_schedule: sch,
          batch_id: batchId,
          batch_no: batch,
          expiry_date: exp,
          strip_mrp: currentSelectedMed && baseCatalogMrp > 0 ? baseCatalogMrp : (r * unitsPerPack),
          per_tab_mrp: r,
          mrp: r,
          rate: r,
          quantity: q,
          free_qty: freeQty,
          discount_percent: disPct,
          line_total: net,
          max_stock: maxStock
        };
        MedHub.state.cart.push(added);
        self.inspectedItem = added;
      }

      if (sch && sch.includes("H")) {
        MedHub.toast(`Notice: ${prodName} is Schedule H. Prescribing doctor recorded.`, "info");
      }

      self.updateCartUI();
      if (inspectorEl) inspectorEl.innerHTML = self.renderItemInspector(self.inspectedItem);

      // Reset Marg Row inputs
      if (prodInput) prodInput.value = "";
      if (packInput) packInput.value = "";
      if (batchInput) batchInput.value = "";
      if (expInput) expInput.value = "";
      if (qtyInput) qtyInput.value = 1;
      if (freeInput) freeInput.value = 0;
      if (rateInput) rateInput.value = "";
      if (itemDisInput) itemDisInput.value = 0;
      if (amountInput) amountInput.value = "";
      currentSelectedMed = null;
      basePackUnits = 0;
      baseCatalogMrp = 0;
      manualRateOverride = false;
      currentSearchResults = [];
      if (prodDropdown) prodDropdown.style.display = "none";

      // Refocus product search input immediately for next item entry!
      focusAndSelect(prodInput);
    };

    addBtn?.addEventListener("click", commitMargItem);

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        if (prodDropdown) prodDropdown.style.display = "none";
      }
    });

    // Cart inline edits (Qty / Free / Dis %)
    container.addEventListener("input", (e) => {
      const target = e.target;
      if (
        target.classList.contains("cart-qty-input") ||
        target.classList.contains("cart-free-input") ||
        target.classList.contains("cart-dis-input")
      ) {
        const idx = Number(target.dataset.index);
        const it = MedHub.state.cart[idx];
        if (!it) return;
        const rowEl = target.closest("tr");
        const q = Math.max(1, parseFloat(rowEl?.querySelector(".cart-qty-input")?.value) || 1);
        const f = Math.max(0, parseFloat(rowEl?.querySelector(".cart-free-input")?.value) || 0);
        const d = Math.min(100, Math.max(0, parseFloat(rowEl?.querySelector(".cart-dis-input")?.value) || 0));
        it.quantity = q;
        it.free_qty = f;
        it.discount_percent = d;
        it.line_total = Math.max(0, Number((q * (Number(it.rate) || 0) * (1 - d / 100)).toFixed(2)));
        const amtCell = rowEl?.querySelector("td:nth-child(10) strong");
        if (amtCell) amtCell.innerText = `₹${it.line_total.toFixed(2)}`;
        self.inspectedItem = it;
        if (inspectorEl) inspectorEl.innerHTML = self.renderItemInspector(it);
        self.updateTotals();
      }
    });

    // Enter shifting inside Cart table inputs -> next cell or back to Product
    container.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const target = e.target;
      if (
        target.classList.contains("cart-qty-input") ||
        target.classList.contains("cart-free-input") ||
        target.classList.contains("cart-dis-input")
      ) {
        e.preventDefault();
        const rowEl = target.closest("tr");
        const cells = Array.from(rowEl?.querySelectorAll(".cart-qty-input, .cart-free-input, .cart-dis-input") || []);
        const pos = cells.indexOf(target);
        if (e.shiftKey) {
          if (pos > 0) focusAndSelect(cells[pos - 1]);
          return;
        }
        if (pos >= 0 && pos + 1 < cells.length) {
          focusAndSelect(cells[pos + 1]);
        } else {
          focusAndSelect(prodInput);
        }
      }
    });

    // Row click updates inspector
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-remove-item");
      if (btn) {
        const idx = Number(btn.dataset.index);
        MedHub.state.cart.splice(idx, 1);
        self.updateCartUI();
        if (inspectorEl) {
          inspectorEl.innerHTML = self.renderItemInspector(MedHub.state.cart[MedHub.state.cart.length - 1] || null);
        }
        return;
      }
      const row = e.target.closest(".marg-cart-row");
      if (row) {
        const idx = Number(row.dataset.index);
        if (MedHub.state.cart[idx] && inspectorEl) {
          self.inspectedItem = MedHub.state.cart[idx];
          inspectorEl.innerHTML = self.renderItemInspector(self.inspectedItem);
        }
      }
    });

    // Clear Cart
    container.querySelector("#btn-clear-cart")?.addEventListener("click", async () => {
      if (await MedHub.confirm("Kya aap poora cart clear karna chahte hain?")) {
        MedHub.state.cart = [];
        self.inspectedItem = null;
        self.updateCartUI();
        if (inspectorEl) inspectorEl.innerHTML = self.renderItemInspector(null);
      }
    });

    // Complete & Print Bill
    container.querySelector("#btn-save-print")?.addEventListener("click", () => self.submitBill());

    // Global Shortcut F9 to Print Bill (deduplicated across re-renders)
    if (this._f9Handler) {
      window.removeEventListener?.("keydown", this._f9Handler);
    }
    this._f9Handler = (e) => {
      if (e.key === "F9" && !e.repeat) {
        const modalOpen = document.querySelector("#invoice-modal-container .modal-overlay");
        const saveBtn = document.getElementById("btn-save-print");
        if (modalOpen || !saveBtn) return;
        e.preventDefault();
        self.submitBill();
      }
    };
    window.addEventListener("keydown", this._f9Handler);

    // Focus Patient/Customer Name on initial render for zero-mouse Marg ERP entry
    setTimeout(() => {
      focusAndSelect(custName);
    }, 40);
  },

  async addMedicineToCart(med) {
    const batches = await MedHub.api.getBatches(med.id);
    const chosenBatch = (batches && batches.length) ? batches[0] : null;

    const rate = Number(med.mrp || med.selling_rate || (chosenBatch ? chosenBatch.selling_price : 0) || 0);
    const batchNo = chosenBatch ? chosenBatch.batch_no : "BT-" + (med.barcode || "001");
    const expiry = chosenBatch ? chosenBatch.expiry_date : (med.nearest_expiry || "2028-11");
    const batchId = chosenBatch ? chosenBatch.id : null;

    const existing = MedHub.state.cart.find(it => it.medicine_id === med.id && it.batch_no === batchNo);
    if (existing) {
      existing.quantity += 1;
      existing.line_total = existing.quantity * existing.rate;
    } else {
      MedHub.state.cart.push({
        medicine_id: med.id,
        name: med.name,
        company: med.company,
        salt_composition: med.salt_composition,
        pack_size: med.pack_size || "1x10",
        drug_schedule: med.drug_schedule || "General",
        batch_id: batchId,
        batch_no: batchNo,
        expiry_date: expiry,
        mrp: rate,
        rate: rate,
        quantity: 1,
        free_qty: 0,
        discount_percent: 0,
        line_total: rate,
        max_stock: (chosenBatch ? chosenBatch.quantity : med.available_qty) || 999
      });
    }

    if (med.drug_schedule && med.drug_schedule.includes("H")) {
      MedHub.toast(`Notice: ${med.name} is a ${med.drug_schedule} medicine. Prescribing doctor recorded.`, "info");
    }

    this.updateCartUI();
  },

  updateCartUI() {
    const tableBody = document.getElementById("cart-items-body");
    const fillerBody = document.getElementById("marg-filler-rows");
    const countEl = document.getElementById("cart-count");
    const printBtn = document.getElementById("btn-save-print");

    if (tableBody) tableBody.innerHTML = this.renderCartRows();
    if (fillerBody) {
      const fillerCount = Math.max(0, 6 - MedHub.state.cart.length);
      fillerBody.innerHTML = Array.from({ length: fillerCount }).map(() => `
        <tr class="marg-filler-tr">
          <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        </tr>
      `).join("");
    }
    if (countEl) countEl.innerText = MedHub.state.cart.length;
    if (printBtn) printBtn.disabled = MedHub.state.cart.length === 0;

    this.updateTotals();
  },

  calculatePaymentBreakdown(grandTotalVal = this.calculateGrandTotal()) {
    const grandTotal = Math.max(0, Number(grandTotalVal) || 0);
    const amtStr = String(MedHub.state.amountReceived ?? "").trim();
    const paidAmount = amtStr !== ""
      ? Math.max(0, Number(amtStr) || 0)
      : (MedHub.state.paymentMode === "CREDIT" ? 0 : grandTotal);
    const dueAmount = Math.max(0, Number((grandTotal - paidAmount).toFixed(2)));
    return {
      grandTotal: Number(grandTotal.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      dueAmount
    };
  },

  updateTotals() {
    const subtotalEl = document.getElementById("summary-subtotal");
    const discRowEl = document.getElementById("summary-discount-preview-row");
    const discLabelEl = document.getElementById("summary-discount-label");
    const discAppliedEl = document.getElementById("summary-discount-applied");
    const grandTotalEl = document.getElementById("summary-grand-total");
    const dueAmountEl = document.getElementById("pos-due-amount");

    const sub = this.calculateSubtotal();
    const discAmt = this.calculateDiscountAmount();
    const grand = this.calculateGrandTotal();
    const payBreak = this.calculatePaymentBreakdown(grand);

    if (subtotalEl) subtotalEl.innerText = MedHub.rupee(sub);
    if (discRowEl) discRowEl.style.display = discAmt > 0 ? "flex" : "none";
    if (discLabelEl) {
      discLabelEl.innerText = MedHub.state.discountType === "PERCENT"
        ? `Discount Applied (${Math.min(100, Number(MedHub.state.discount || 0))}%):`
        : "Discount Applied:";
    }
    if (discAppliedEl) discAppliedEl.innerText = `-${MedHub.rupee(discAmt)}`;
    if (grandTotalEl) grandTotalEl.innerText = MedHub.rupee(grand);
    if (dueAmountEl) {
      dueAmountEl.innerText = MedHub.rupee(payBreak.dueAmount);
      dueAmountEl.style.color = payBreak.dueAmount > 0 ? "#dc2626" : "#16a34a";
    }
  },

  async submitBill() {
    if (this._isSubmittingBill) return;
    if (!MedHub.state.cart.length) {
      MedHub.toast("Cart me koi dawai nahi hai", "warning");
      return;
    }

    const subtotal = this.calculateSubtotal();
    const discountAmt = this.calculateDiscountAmount();
    const discountPctApplied = MedHub.state.discountType === "PERCENT"
      ? Math.min(100, Math.max(0, Number(MedHub.state.discount || 0)))
      : 0;
    const grandTotal = this.calculateGrandTotal();
    const { paidAmount } = this.calculatePaymentBreakdown(grandTotal);

    const itemsSnapshot = MedHub.state.cart.map(it => ({ ...it }));
    const billPayload = {
      customer_name: MedHub.state.customer.name || "Walk-in Customer",
      customer_mobile: MedHub.state.customer.mobile || "",
      patient_address: MedHub.state.customer.address || "",
      doctor_name: MedHub.state.doctor.name || "",
      doctor_hospital: "",
      subtotal: subtotal,
      discount: discountAmt,
      grand_total: grandTotal,
      paid_amount: paidAmount,
      payment_mode: MedHub.state.paymentMode,
      items: itemsSnapshot
    };

    const billSig = JSON.stringify({
      c: billPayload.customer_name,
      m: billPayload.customer_mobile,
      d: billPayload.doctor_name,
      t: Number(billPayload.grand_total).toFixed(2),
      p: Number(billPayload.paid_amount).toFixed(2),
      i: itemsSnapshot.map(it => [it.medicine_id, it.batch_no, it.quantity, it.free_qty || 0, it.line_total])
    });
    const nowMs = Date.now();
    if (this._lastBillSig === billSig && (nowMs - this._lastBillAt) < 2500) {
      return;
    }

    this._isSubmittingBill = true;
    const saveBtn = document.getElementById("btn-save-print");
    if (saveBtn) saveBtn.disabled = true;

    try {
      const savedBill = await MedHub.api.createBill(billPayload);
      if (savedBill) {
        this._lastBillSig = billSig;
        this._lastBillAt = Date.now();
        if (discountPctApplied > 0) {
          savedBill.discount_percent_applied = discountPctApplied;
        }
        MedHub.toast(`Bill #${savedBill.bill_no} successfully generated!`, "success");

        // Show Invoice Preview / Print Modal
        this.showInvoiceModal(savedBill);

        // Reset cart and fields
        MedHub.state.cart = [];
        MedHub.state.customer = { name: "", mobile: "", address: "" };
        MedHub.state.doctor = { name: "", hospital: "" };
        MedHub.state.discount = 0;
        MedHub.state.discountType = "AMOUNT";
        MedHub.state.amountReceived = "";
        this.render(document.getElementById("page-content"));
      } else {
        MedHub.toast("Bill save karne me samasya aayi", "error");
      }
    } finally {
      this._isSubmittingBill = false;
      const btnNow = document.getElementById("btn-save-print");
      if (btnNow) btnNow.disabled = false;
    }
  },

  async showInvoiceModal(bill) {
    const apiStore = await MedHub.api.getStoreSettings();
    const store = MedHub.resolveActiveStore
      ? MedHub.resolveActiveStore(apiStore)
      : { ...MedHub.defaultStore, ...MedHub.state.store, ...apiStore };
    const lic = MedHub.formatStoreLicenses
      ? MedHub.formatStoreLicenses(store)
      : {
          gstin: (store.gstin || "").trim().toUpperCase(),
          dl20: (store.dl_no_20b || store.drug_license_no || "").trim(),
          dl21: (store.dl_no_21b || "").trim(),
          dlDisplay: [store.dl_no_20b || store.drug_license_no, store.dl_no_21b].filter(Boolean).join(", ")
        };

    let modalWrap = document.getElementById("invoice-modal-container");
    if (!modalWrap) {
      modalWrap = document.createElement("div");
      modalWrap.id = "invoice-modal-container";
      document.body.appendChild(modalWrap);
    }

    document.body.classList.add("modal-open");

    const isPaid = Number(bill.paid_amount) >= Number(bill.grand_total);
    const dueAmt = Math.max(0, Number(bill.grand_total || 0) - Number(bill.paid_amount || 0));
    const amountInWords = MedHub.numberToWords(bill.grand_total);
    const invoiceDateStr = new Date(bill.bill_date || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(/\//g, "-");

    const items = (bill.items && bill.items.length) ? bill.items : (bill.bill_items || []);
    const fullAddressLine = [store.address, store.city, store.state].filter(Boolean).join(", ") + (store.pincode ? ` - ${store.pincode}` : "");

    // Store Payment QR Resolution: Use store's custom uploaded QR or dynamic UPI QR
    const upiId = store.upi_id || "sagarstore@upi";
    const payeeName = store.payee_name || store.store_name || "Pharmacy";
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${Number(bill.grand_total).toFixed(2)}&cu=INR&tn=Bill-${bill.bill_no}`;
    const qrImgUrl = (store.custom_qr_image && store.custom_qr_image.trim())
      ? store.custom_qr_image
      : `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiLink)}`;

    // WhatsApp Message Text
    const waText = encodeURIComponent(
      `🧾 *TAX INVOICE - ${store.store_name}*\n` +
      (lic.gstin ? `GSTIN: ${lic.gstin}\n` : "") +
      (lic.dlDisplay ? `D.L. No: ${lic.dlDisplay}\n` : "") +
      `Bill No: #${bill.bill_no} | Date: ${invoiceDateStr}\n` +
      `Patient: ${bill.customer_name || "Walk-in Customer"}\n` +
      `Doctor: ${bill.doctor_name || "Self"}\n\n` +
      `*Items:*\n` +
      items.map(it => `• ${it.medicine_name || it.name || "Item"} (${it.quantity} qty @ MRP ₹${Number(it.mrp ?? it.rate ?? 0).toFixed(2)}) - ₹${Number(it.line_total || (it.quantity * it.rate) || 0).toFixed(2)}`).join("\n") +
      (Number(bill.discount) > 0 ? `\n\nSubtotal: ₹${Number(bill.subtotal || 0).toFixed(2)}\nDiscount${bill.discount_percent_applied ? ` (${bill.discount_percent_applied}%)` : ""}: -₹${Number(bill.discount).toFixed(2)}` : "\n") +
      `\n*Total Amount:* ₹${Number(bill.grand_total).toFixed(2)}\n` +
      `*Status:* ${isPaid ? "PAID" : `DUE (₹${dueAmt.toFixed(2)} Pending)`}\n\n` +
      `Thank you for choosing ${store.store_name}! Get well soon.`
    );

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box invoice-modal-box">
          <!-- TOP MODAL HEADER WITH DUAL FORMAT TOGGLE -->
          <div class="modal-header-print">
            <div class="bill-view-toggle-wrap">
              <button type="button" class="bill-toggle-tab active" id="tab-normal-bill">
                📄 Normal Print Bill (Exact Format)
              </button>
              <button type="button" class="bill-toggle-tab" id="tab-digital-bill">
                📱 Digital E-Bill (WhatsApp / Online)
              </button>
            </div>
            <div class="modal-header-actions">
              <button type="button" class="btn-primary btn-direct-print-enter" id="btn-do-print" autofocus title="1-Click Print (Shortcut: Enter ↵)">
                ${MedHub.icons.print} Direct Print (Enter ↵)
              </button>
              <button type="button" class="btn-enter-print-now" id="btn-enter-print-now" title="Instant Print">
                ↵ Print Now
              </button>
              <button type="button" class="btn-outline" id="btn-do-pdf">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF
              </button>
              <button type="button" class="btn-icon" id="btn-close-modal">
                ${MedHub.icons.close}
              </button>
            </div>
          </div>

          <!-- DIRECT PRINT 1-CLICK BAR (VISIBLE WHEN NORMAL BILL ACTIVE) -->
          <div class="instant-print-banner" id="instant-print-banner">
            <span>⚡ <strong>Direct Print Active:</strong> Press <strong>Enter ↵</strong> on keyboard ya click karein instant 1-click print ke liye.</span>
            <button type="button" class="btn-enter-print-pill" id="btn-banner-print-now">
              ↵ Click to Print
            </button>
          </div>

          <div class="modal-body-scroll">
            <!-- 1. NORMAL BILL VIEW (EXACT REPLICA OF USER PHOTO) -->
            <div id="normal-bill-container" class="printable-bill-view">
              <div id="printable-invoice" class="classic-receipt-paper">
                <!-- STORE HEADER: LEFT = STORE NAME & ADDRESS, RIGHT = QR CODE & UPI ID -->
                <div class="classic-receipt-header classic-receipt-header-with-qr">
                  <div class="classic-header-info">
                    <h2 class="classic-store-title">${store.store_name || "MEDICAL STORE"}</h2>
                    ${fullAddressLine ? `<p class="classic-store-address">${fullAddressLine}</p>` : ""}
                    <div class="classic-store-reg-row">
                      ${store.phone ? `<span class="classic-store-reg">Ph: ${store.phone}</span>` : ""}
                      ${lic.gstin ? `<span class="classic-store-reg">GSTIN: ${lic.gstin}</span>` : ""}
                      ${lic.dlDisplay ? `<span class="classic-store-reg">D.L.: ${lic.dlDisplay}</span>` : ""}
                    </div>
                  </div>
                  <div class="classic-top-qr-card">
                    <div class="classic-qr-box">
                      <img src="${qrImgUrl}" alt="Store Payment QR" crossorigin="anonymous" />
                    </div>
                    <div class="classic-top-qr-meta">
                      <strong>SCAN & PAY</strong>
                      <span class="classic-upi-label">UPI ID:</span>
                      <span class="classic-upi-val">${upiId}</span>
                    </div>
                  </div>
                </div>

                <!-- PATIENT & DOCTOR TWO-COLUMN METADATA (WITH INNER ZERO-SPACE STAMP) -->
                <div class="classic-meta-grid">
                  <div>
                    <p><strong>Patient Name :</strong> ${(bill.customer_name || "Walk-in Customer").toUpperCase()}</p>
                    <p><strong>Doctor Name :</strong> ${(bill.doctor_name || "Self").toUpperCase()}</p>
                  </div>
                  <div class="classic-meta-stamp-inner" aria-hidden="true">
                    ${isPaid ? `<span class="classic-stamp-paid">PAID</span>` : `<span class="classic-stamp-due">DUE</span>`}
                  </div>
                  <div class="classic-meta-right">
                    <p><strong>Invoice No :</strong> A01${String(bill.bill_no).padStart(4, "0")}</p>
                    <p><strong>Date :</strong> ${invoiceDateStr}</p>
                  </div>
                </div>

                <!-- MAXIMIZED MEDICINE ENTRY SECTION (Sn., Product, OLD MRP, Batch, QTY, PACK, EXP, MRP, Amount) -->
                <div class="classic-medicine-area">
                  <table class="classic-receipt-table">
                  <thead>
                    <tr>
                      <th style="width: 28px; text-align: center;">Sn.</th>
                      <th style="text-align: left;">Product</th>
                      <th style="text-align: center;">OLD MRP</th>
                      <th style="text-align: center;">Batch</th>
                      <th style="text-align: center;">QTY</th>
                      <th style="text-align: center;">PACK</th>
                      <th style="text-align: center;">EXP</th>
                      <th style="text-align: right;">MRP</th>
                      <th style="text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map((it, i) => {
                      const expFormatted = MedHub.formatExpiry(it.expiry_date);
                      const oldMrpVal = Number(it.old_mrp || 0).toFixed(2);
                      const rateVal = Number(it.mrp ?? it.rate ?? 0).toFixed(2);
                      const qtyVal = Number(it.quantity || 1).toFixed(2);
                      const totalVal = Number(it.line_total || (it.quantity * it.rate) || 0).toFixed(2);
                      return `
                        <tr>
                          <td style="text-align: center;">${i + 1}.</td>
                          <td style="text-align: left;">
                            <strong>${(it.medicine_name || it.name || "Medicine").toUpperCase()}</strong>
                            ${it.salt_composition ? `<div style="font-size:9.5px;color:#555;">${it.salt_composition}</div>` : ""}
                          </td>
                          <td style="text-align: center;">${oldMrpVal}</td>
                          <td style="text-align: center;">${it.batch_no || "BT-" + String(i + 1).padStart(2, "0")}</td>
                          <td style="text-align: center; font-weight: 700;">${qtyVal}</td>
                          <td style="text-align: center;">${it.pack_size || "1X10"}</td>
                          <td style="text-align: center;">${expFormatted}</td>
                          <td style="text-align: right;">${rateVal}</td>
                          <td style="text-align: right; font-weight: 700;">${totalVal}</td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                  </table>
                </div>

                <!-- TOTAL & AMOUNT IN WORDS -->
                ${(Number(bill.discount) > 0 || Number(bill.gst_amount) > 0 || !isPaid) ? `
                  <div class="classic-summary-breakdown">
                    <div class="classic-summary-line">
                      <span>Items Subtotal</span>
                      <strong>₹${Number(bill.subtotal || 0).toFixed(2)}</strong>
                    </div>
                    ${Number(bill.discount) > 0 ? `
                      <div class="classic-summary-line classic-discount-line">
                        <span>Discount${bill.discount_percent_applied ? ` (${bill.discount_percent_applied}%)` : ""}</span>
                        <strong>- ₹${Number(bill.discount).toFixed(2)}</strong>
                      </div>
                    ` : ""}
                    ${Number(bill.gst_amount) > 0 ? `
                      <div class="classic-summary-line">
                        <span>GST Amount</span>
                        <strong>+ ₹${Number(bill.gst_amount).toFixed(2)}</strong>
                      </div>
                    ` : ""}
                    ${!isPaid ? `
                      <div class="classic-summary-line">
                        <span>Paid / Balance Due</span>
                        <strong>₹${Number(bill.paid_amount || 0).toFixed(2)} / Due: ₹${dueAmt.toFixed(2)}</strong>
                      </div>
                    ` : ""}
                  </div>
                ` : ""}
                <div class="classic-total-row">
                  <span>Total -</span>
                  <span>${Number(bill.grand_total).toFixed(2)}</span>
                </div>
                <div class="classic-words-line">
                  ${amountInWords}
                </div>

                <!-- FOOTER -->
                <div class="classic-footer-brand">
                  ${store.store_name || "MEDICAL STORE"}
                </div>
              </div>
            </div>

            <!-- 2. DIGITAL E-BILL VIEW (MODERN MOBILE & WHATSAPP) -->
            <div id="digital-bill-container" class="printable-bill-view" style="display: none;">
              <div id="printable-digital-invoice" class="digital-bill-card">
                <div class="digital-bill-header">
                  <div>
                    <h3 class="digital-store-name">${store.store_name}</h3>
                    <p style="font-size:12px;color:var(--black-soft);">${store.tagline || "Retail & Wholesale Chemists"}</p>
                    ${fullAddressLine ? `<p style="font-size:11px;color:#475569;margin-top:2px;">${fullAddressLine}</p>` : ""}
                    ${(lic.gstin || lic.dlDisplay) ? `
                      <p style="font-size:11px;font-weight:700;color:#0f172a;margin-top:3px;">
                        ${lic.gstin ? `GSTIN: ${lic.gstin}` : ""}${(lic.gstin && lic.dlDisplay) ? " &nbsp;|&nbsp; " : ""}${lic.dlDisplay ? `D.L. No: ${lic.dlDisplay}` : ""}
                      </p>
                    ` : ""}
                  </div>
                  <span class="digital-verified-pill">✓ Verified E-Receipt</span>
                </div>

                <div class="digital-customer-box">
                  <div style="display:flex;justify-content:space-between;">
                    <span><strong>Bill #:</strong> ${bill.bill_no}</span>
                    <span><strong>Date:</strong> ${invoiceDateStr}</span>
                  </div>
                  <div style="margin-top:4px;">
                    <strong>Patient:</strong> ${bill.customer_name || "Walk-in Customer"} ${bill.customer_mobile ? `(${bill.customer_mobile})` : ""}
                  </div>
                  <div><strong>Doctor:</strong> ${bill.doctor_name || "Self / Registered Practitioner"}</div>
                  <div><strong>Payment Mode:</strong> ${bill.payment_mode || "CASH"} (<span class="badge-status ${isPaid ? 'status-paid' : 'status-low'}">${isPaid ? 'PAID' : 'DUE'}</span>)</div>
                </div>

                <!-- Digital Items Breakdown -->
                <div class="digital-items-list">
                  ${items.map(it => `
                    <div class="digital-item-row">
                      <div>
                        <div class="digital-item-name">${it.medicine_name || it.name || "Medicine"}</div>
                        <div class="digital-item-meta">Qty: ${it.quantity} | MRP: ₹${Number(it.mrp ?? it.rate ?? 0).toFixed(2)} | Batch: ${it.batch_no || "BT-01"} | Exp: ${MedHub.formatExpiry(it.expiry_date)}</div>
                      </div>
                      <div class="digital-item-price">₹${Number(it.line_total || (it.quantity * it.rate) || 0).toFixed(2)}</div>
                    </div>
                  `).join("")}
                </div>

                ${(Number(bill.discount) > 0 || Number(bill.gst_amount) > 0) ? `
                  <div class="digital-summary-box">
                    <div class="digital-summary-row">
                      <span>Items Subtotal:</span>
                      <strong>₹${Number(bill.subtotal || 0).toFixed(2)}</strong>
                    </div>
                    ${Number(bill.discount) > 0 ? `
                      <div class="digital-summary-row digital-discount-row">
                        <span>Discount${bill.discount_percent_applied ? ` (${bill.discount_percent_applied}%)` : ""}:</span>
                        <span>-₹${Number(bill.discount).toFixed(2)}</span>
                      </div>
                    ` : ""}
                    ${Number(bill.gst_amount) > 0 ? `
                      <div class="digital-summary-row">
                        <span>GST Amount:</span>
                        <span>+₹${Number(bill.gst_amount).toFixed(2)}</span>
                      </div>
                    ` : ""}
                  </div>
                ` : ""}

                <div class="digital-total-banner">
                  <div class="total-txt">Grand Total:</div>
                  <div class="total-num">₹${Number(bill.grand_total).toFixed(2)}</div>
                </div>
                ${!isPaid ? `
                  <div class="digital-summary-box" style="margin-top: 8px; border-color: #fecaca; background: #fef2f2;">
                    <div class="digital-summary-row">
                      <span>Amount Received:</span>
                      <strong>₹${Number(bill.paid_amount || 0).toFixed(2)}</strong>
                    </div>
                    <div class="digital-summary-row" style="color: #dc2626; font-weight: 800;">
                      <span>Balance Due (Udhaar):</span>
                      <span>₹${dueAmt.toFixed(2)}</span>
                    </div>
                  </div>
                ` : ""}

                <!-- Digital UPI Payment QR -->
                <div class="digital-qr-banner" style="margin-top: 14px; padding: 12px 14px; background: var(--cream-hover); border: 1.5px dashed var(--cream-border-dark); border-radius: 8px; display: flex; align-items: center; gap: 14px;">
                  <img src="${qrImgUrl}" alt="UPI QR" style="width: 72px; height: 72px; object-fit: contain; background: #ffffff; padding: 2px; border-radius: 6px; border: 1px solid var(--cream-border); flex-shrink: 0;" />
                  <div>
                    <div style="font-size: 12px; font-weight: 800; color: var(--black-deep);">SCAN & PAY DIGITALLY</div>
                    <div style="font-size: 11px; color: var(--black-soft); margin-top: 1px;">UPI ID: <strong>${upiId}</strong></div>
                    <div style="font-size: 11px; color: var(--black-soft);">Payee: ${payeeName}</div>
                    <a href="${upiLink}" class="btn-primary-sm" style="margin-top: 6px; display: inline-flex; text-decoration: none;">
                      ⚡ Pay ₹${Number(bill.grand_total).toFixed(2)} via UPI App
                    </a>
                  </div>
                </div>

                <!-- Digital Actions -->
                <div class="digital-actions-grid">
                  <a href="https://api.whatsapp.com/send?phone=${bill.customer_mobile ? (bill.customer_mobile.startsWith('91') ? bill.customer_mobile : '91' + bill.customer_mobile) : ''}&text=${waText}" 
                    target="_blank" class="btn-whatsapp-share">
                    ${MedHub.icons.whatsapp} Send on WhatsApp
                  </a>
                  <button type="button" class="btn-primary" id="btn-copy-digital-bill">
                    ${MedHub.icons.check} Copy Bill Summary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // View Switching Tab Listeners
    const tabNormal = document.getElementById("tab-normal-bill");
    const tabDigital = document.getElementById("tab-digital-bill");
    const normalView = document.getElementById("normal-bill-container");
    const digitalView = document.getElementById("digital-bill-container");

    const banner = document.getElementById("instant-print-banner");

    tabNormal?.addEventListener("click", () => {
      tabNormal.classList.add("active");
      tabDigital.classList.remove("active");
      normalView.style.display = "block";
      digitalView.style.display = "none";
      if (banner) banner.style.display = "flex";
      document.getElementById("btn-do-print")?.focus();
    });

    tabDigital?.addEventListener("click", () => {
      tabDigital.classList.add("active");
      tabNormal.classList.remove("active");
      digitalView.style.display = "block";
      normalView.style.display = "none";
      if (banner) banner.style.display = "none";
    });

    // 1-Click Direct Print trigger function (Zero further argument)
    const triggerDirectPrint = () => {
      if (normalView && digitalView) {
        tabNormal?.classList.add("active");
        tabDigital?.classList.remove("active");
        normalView.style.display = "block";
        digitalView.style.display = "none";
      }
      window.print();
    };

    document.getElementById("btn-do-print")?.addEventListener("click", triggerDirectPrint);
    document.getElementById("btn-enter-print-now")?.addEventListener("click", triggerDirectPrint);
    document.getElementById("btn-banner-print-now")?.addEventListener("click", triggerDirectPrint);

    // Close Modal helper
    const cleanupModal = () => {
      if (this._printKeyHandler) {
        window.removeEventListener?.("keydown", this._printKeyHandler);
        this._printKeyHandler = null;
      }
      modalWrap.innerHTML = "";
      document.body.classList.remove("modal-open");
    };

    // Keyboard shortcut: Pressing Enter triggers Direct Print immediately
    if (this._printKeyHandler) {
      window.removeEventListener?.("keydown", this._printKeyHandler);
    }
    this._printKeyHandler = (e) => {
      if (e.key === "Enter" && !e.repeat && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        e.stopPropagation();
        triggerDirectPrint();
      } else if (e.key === "Escape") {
        cleanupModal();
      }
    };
    window.addEventListener("keydown", this._printKeyHandler);

    document.getElementById("btn-close-modal")?.addEventListener("click", cleanupModal);
    modalWrap.querySelector(".modal-overlay")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        cleanupModal();
      }
    });

    // Auto-focus direct print button for instant Enter key press
    setTimeout(() => {
      document.getElementById("btn-do-print")?.focus();
    }, 60);

    // PDF Download via html2pdf (ONLY NORMAL BILLING PRINT)
    document.getElementById("btn-do-pdf")?.addEventListener("click", () => {
      MedHub.exportToPdf("printable-invoice", `Bill_${bill.bill_no}`);
    });

    // Copy Summary
    document.getElementById("btn-copy-digital-bill")?.addEventListener("click", () => {
      const summaryText = decodeURIComponent(waText);
      navigator.clipboard.writeText(summaryText).then(() => {
        MedHub.toast("Bill summary copied to clipboard!", "success");
      });
    });
  }
};
