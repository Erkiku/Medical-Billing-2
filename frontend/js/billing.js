// ============================================================================
// MedEduHub - POS Billing Screen (js/billing.js)
// Redesigned to exact UI of Screenshot 1 (Customer & Doctor 2-card layout)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.billing = {
  render(container) {
    const store = { ...MedHub.defaultStore, ...MedHub.state.store };
    container.innerHTML = `
      <div class="billing-page-wrap">
        <!-- TOP SECTION: TWO CARDS (CUSTOMER DETAILS & PRESCRIBING DOCTOR) -->
        <div class="billing-top-grid">
          <!-- CARD 1: CUSTOMER / PATIENT DETAILS -->
          <div class="card customer-card">
            <div class="card-header-flex">
              <div class="card-title-group">
                <span class="card-icon blue-icon">${MedHub.icons.user}</span>
                <h3 class="card-title">CUSTOMER / PATIENT DETAILS</h3>
              </div>
            </div>
            <div class="card-body">
              <div class="form-row-2">
                <div class="form-group">
                  <label class="form-label">Patient / Customer Name <span class="req">*</span></label>
                  <input type="text" id="cust-name" class="input-field" 
                    placeholder="e.g. Ramesh Kumar or Cash Customer" 
                    value="${MedHub.state.customer.name || ""}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Mobile Number (for SMS & WhatsApp)</label>
                  <input type="tel" id="cust-mobile" class="input-field" 
                    placeholder="10-digit mobile number" maxlength="10" 
                    value="${MedHub.state.customer.mobile || ""}" />
                </div>
              </div>
              <div class="form-row-1" style="margin-top: 12px;">
                <div class="form-group">
                  <label class="form-label">Address / Town</label>
                  <input type="text" id="cust-address" class="input-field" 
                    placeholder="e.g. House 42, Civil Lines, Delhi" 
                    value="${MedHub.state.customer.address || ""}" />
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 2: PRESCRIBING DOCTOR -->
          <div class="card doctor-card">
            <div class="card-header-flex">
              <div class="card-title-group">
                <span class="card-icon blue-icon">${MedHub.icons.stethoscope}</span>
                <h3 class="card-title">PRESCRIBING DOCTOR</h3>
              </div>
            </div>
            <div class="card-body">
              <div class="form-row-1">
                <div class="form-group">
                  <label class="form-label">Doctor Name & Hospital</label>
                  <input type="text" id="doc-name" class="input-field" 
                    placeholder="e.g. Dr. Rajesh Sharma" 
                    value="${MedHub.state.doctor.name || ""}" />
                </div>
              </div>
              <p class="doctor-helper-text">
                Helps maintain Schedule H prescription records for drug control audit.
              </p>
            </div>
          </div>
        </div>

        <!-- MARG ERP 9+ FAST SALE ENTRY CARD (BLUEPRINT REPLICA) -->
        <div class="marg-blueprint-card" id="marg-sale-entry-container">
          <div class="marg-blue-header">
            <div class="marg-header-left">
              <span class="marg-logo-text">⚡ MARG ERP 9+ SALE ENTRY</span>
              <span class="marg-mode-badge">SALE TYPE: LOCAL / RETAIL</span>
            </div>
            <div class="marg-header-right">
              <span class="marg-shortcut-hint">⌨️ <strong>ENTER ↵</strong> shifts to next box • Empty Product + Enter ➔ Bill Summary</span>
            </div>
          </div>
          <div class="marg-entry-row-grid">
            <div class="marg-cell marg-cell-product">
              <label class="marg-lbl" for="marg-prod-name">PRODUCT *</label>
              <input type="text" id="marg-prod-name" class="marg-input" placeholder="Type medicine / brand name..." autocomplete="off" />
              <div id="marg-prod-dropdown" class="medicine-dropdown-results" style="display: none;"></div>
            </div>
            <div class="marg-cell marg-cell-pack">
              <label class="marg-lbl" for="marg-prod-pack">PACK</label>
              <input type="text" id="marg-prod-pack" class="marg-input" placeholder="1x10" />
            </div>
            <div class="marg-cell marg-cell-batch">
              <label class="marg-lbl" for="marg-prod-batch">BATCH</label>
              <input type="text" id="marg-prod-batch" class="marg-input" placeholder="Batch No" />
            </div>
            <div class="marg-cell marg-cell-exp">
              <label class="marg-lbl" for="marg-prod-exp">EXPIRY</label>
              <input type="text" id="marg-prod-exp" class="marg-input" placeholder="MM/YY" maxlength="7" />
            </div>
            <div class="marg-cell marg-cell-qty">
              <label class="marg-lbl" for="marg-prod-qty">QTY *</label>
              <input type="number" id="marg-prod-qty" class="marg-input" value="1" min="1" />
            </div>
            <div class="marg-cell marg-cell-rate">
              <label class="marg-lbl" for="marg-prod-rate">RATE (₹) *</label>
              <input type="number" step="0.01" id="marg-prod-rate" class="marg-input" placeholder="0.00" />
            </div>
            <div class="marg-cell marg-cell-dis">
              <label class="marg-lbl" for="marg-prod-dis">DIS %</label>
              <input type="number" step="0.1" id="marg-prod-dis" class="marg-input" value="0" min="0" max="100" />
            </div>
            <div class="marg-cell marg-cell-amount">
              <label class="marg-lbl" for="marg-prod-amount">AMOUNT (₹)</label>
              <input type="text" id="marg-prod-amount" class="marg-input marg-readonly" readonly placeholder="0.00" />
            </div>
            <div class="marg-cell marg-cell-action">
              <button type="button" id="btn-marg-add" class="btn-primary" style="height: 36px; padding: 0 14px; white-space: nowrap; font-weight: 700;">
                ↵ Add Item
              </button>
            </div>
          </div>
        </div>

        <!-- CART ITEMS & SUMMARY SECTION -->
        <div class="billing-main-grid" style="margin-top: 18px;">
          <!-- CART TABLE -->
          <div class="card cart-card">
            <div class="cart-header">
              <h3 class="cart-title">Bill Items (<span id="cart-count">${MedHub.state.cart.length}</span>)</h3>
              ${MedHub.state.cart.length > 0 ? `
                <button type="button" class="btn-text-danger" id="btn-clear-cart">
                  ${MedHub.icons.trash} Clear Cart
                </button>
              ` : ""}
            </div>
            <div class="cart-table-wrap">
              <table class="data-table" id="cart-table">
                <thead>
                  <tr>
                    <th style="width: 36px;">#</th>
                    <th>PRODUCT & COMPOSITION</th>
                    <th>PACK</th>
                    <th>BATCH</th>
                    <th>EXPIRY</th>
                    <th>QTY</th>
                    <th>RATE (₹)</th>
                    <th>DIS %</th>
                    <th>AMOUNT (₹)</th>
                    <th style="width: 44px;"></th>
                  </tr>
                </thead>
                <tbody id="cart-items-body">
                  ${this.renderCartRows()}
                </tbody>
              </table>
              <div id="cart-empty-state" class="cart-empty" style="${MedHub.state.cart.length ? "display:none;" : ""}">
                <p>No medicine added to cart</p>
                <span class="cart-empty-sub">Type medicine name in Marg entry row above and press Enter ↵</span>
              </div>
            </div>
          </div>

          <!-- SUMMARY & CHECKOUT CARD -->
          <div class="card checkout-card">
            <h3 class="checkout-title">Payment Summary</h3>
            <div class="summary-rows">
              <div class="summary-row">
                <span>Items Subtotal:</span>
                <span id="summary-subtotal" class="summary-val">${MedHub.rupee(this.calculateSubtotal())}</span>
              </div>
              <div class="summary-row">
                <span>Discount (₹):</span>
                <input type="number" id="bill-discount" class="input-inline" min="0" 
                  value="${MedHub.state.discount || 0}" style="width: 80px; text-align: right;" />
              </div>
              <div class="summary-row divider-row">
                <span class="total-label">Grand Total:</span>
                <span id="summary-grand-total" class="grand-total-val">${MedHub.rupee(this.calculateGrandTotal())}</span>
              </div>
            </div>

            <!-- PAYMENT MODE SELECTOR -->
            <div class="payment-mode-section" style="margin-top: 16px;">
              <label class="form-label">Payment Mode</label>
              <div class="pay-mode-chips">
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'CASH' ? 'active' : ''}" data-mode="CASH">Cash</button>
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'UPI' ? 'active' : ''}" data-mode="UPI">UPI / QR</button>
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'CARD' ? 'active' : ''}" data-mode="CARD">Card</button>
                <button type="button" class="pay-chip ${MedHub.state.paymentMode === 'CREDIT' ? 'active' : ''}" data-mode="CREDIT">Udhaar</button>
              </div>

              <!-- LIVE SHOP COUNTER QR DISPLAY -->
              <div id="pos-counter-qr" style="margin-top: 10px; padding: 10px 14px; background: var(--cream-hover); border-radius: 8px; border: 1.5px dashed var(--cream-border-dark); display: ${MedHub.state.paymentMode === 'UPI' ? 'flex' : 'none'}; align-items: center; gap: 12px;">
                <img src="${(store.custom_qr_image && store.custom_qr_image.trim()) ? store.custom_qr_image : `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(store.upi_id || "sagarstore@upi")}&pn=${encodeURIComponent(store.payee_name || store.store_name || "Pharmacy")}&am=${this.calculateGrandTotal()}&cu=INR`)}`}" alt="Shop QR" style="width: 58px; height: 58px; object-fit: contain; background: #ffffff; padding: 2px; border-radius: 4px; border: 1px solid var(--cream-border); flex-shrink: 0;" />
                <div>
                  <div style="font-size: 11px; font-weight: 800; color: var(--black-deep);">STORE COUNTER QR</div>
                  <div style="font-size: 10.5px; color: var(--black-soft);">${store.upi_id || "sagarstore@upi"}</div>
                  <div style="font-size: 11px; font-weight: 700; color: var(--pink-primary); margin-top: 2px;">Scan to Pay: ${MedHub.rupee(this.calculateGrandTotal())}</div>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin-top: 12px;">
              <label class="form-label">Amount Received (₹)</label>
              <input type="number" id="amt-received" class="input-field" 
                placeholder="₹${this.calculateGrandTotal()}" 
                value="${MedHub.state.amountReceived !== '' ? MedHub.state.amountReceived : this.calculateGrandTotal()}" />
            </div>

            <!-- ACTION BUTTONS -->
            <div class="checkout-actions" style="margin-top: 20px;">
              <button type="button" id="btn-save-print" class="btn-primary-large" ${MedHub.state.cart.length === 0 ? 'disabled' : ''}>
                ${MedHub.icons.print} Complete & Print Bill (F9)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  calculateSubtotal() {
    return MedHub.state.cart.reduce((sum, item) => sum + (item.line_total || 0), 0);
  },

  calculateGrandTotal() {
    const sub = this.calculateSubtotal();
    const disc = Number(MedHub.state.discount || 0);
    return Math.max(0, sub - disc);
  },

  renderCartRows() {
    if (!MedHub.state.cart.length) return "";
    return MedHub.state.cart.map((it, idx) => {
      const isScheduleH = it.drug_schedule && it.drug_schedule.includes("H");
      return `
        <tr data-index="${idx}">
          <td>${idx + 1}</td>
          <td>
            <strong>${it.name}</strong>
            ${it.salt_composition ? `<div class="sub-text">${it.salt_composition}</div>` : ""}
            ${isScheduleH ? `<span class="badge-schedule schedule-h" style="margin-left: 6px;">Sch-H</span>` : ""}
          </td>
          <td>${it.pack_size || "1x10"}</td>
          <td><span class="badge-code">${it.batch_no || "BT-DEFAULT"}</span></td>
          <td><span class="badge-exp-month">${MedHub.formatExpiry(it.expiry_date)}</span></td>
          <td>
            <input type="number" class="cart-qty-input" min="1" max="${it.max_stock || 999}" 
              value="${it.quantity}" data-index="${idx}" style="width: 60px;" />
          </td>
          <td>₹${Number(it.rate).toFixed(2)}</td>
          <td>${Number(it.discount_percent || 0)}%</td>
          <td><strong>₹${Number(it.line_total).toFixed(2)}</strong></td>
          <td>
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

    // Enter Key Navigation Chain: Customer Details -> Marg Item Row
    custName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        custMobile?.focus();
      }
    });
    custMobile?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        custAddress?.focus();
      }
    });
    custAddress?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        docName?.focus();
      }
    });
    docName?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        container.querySelector("#marg-prod-name")?.focus();
      }
    });

    // Discount & Received bindings
    const discInput = container.querySelector("#bill-discount");
    discInput?.addEventListener("input", (e) => {
      MedHub.state.discount = Number(e.target.value) || 0;
      self.updateTotals();
    });

    const amtReceivedInput = container.querySelector("#amt-received");
    amtReceivedInput?.addEventListener("input", (e) => {
      MedHub.state.amountReceived = e.target.value;
    });

    // Enter Key Navigation: Discount -> Received -> Complete & Print
    discInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        amtReceivedInput?.focus();
      }
    });
    amtReceivedInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
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
      });
    });

    // MARG ERP 9+ SALE ENTRY ROW LOGIC & ENTER SHIFTING
    const prodInput = container.querySelector("#marg-prod-name");
    const packInput = container.querySelector("#marg-prod-pack");
    const batchInput = container.querySelector("#marg-prod-batch");
    const expInput = container.querySelector("#marg-prod-exp");
    const qtyInput = container.querySelector("#marg-prod-qty");
    const rateInput = container.querySelector("#marg-prod-rate");
    const disInput = container.querySelector("#marg-prod-dis");
    const amountInput = container.querySelector("#marg-prod-amount");
    const addBtn = container.querySelector("#btn-marg-add");
    const prodDropdown = container.querySelector("#marg-prod-dropdown");

    let currentSelectedMed = null;
    let currentSearchResults = [];
    let highlightedIndex = 0;

    // Helper: Recalculate Marg Item Amount
    const recalcMargAmount = () => {
      const q = parseFloat(qtyInput?.value) || 0;
      const r = parseFloat(rateInput?.value) || 0;
      const d = parseFloat(disInput?.value) || 0;
      const gross = q * r;
      const net = Math.max(0, gross - (gross * (d / 100)));
      if (amountInput) amountInput.value = net.toFixed(2);
    };

    qtyInput?.addEventListener("input", recalcMargAmount);
    rateInput?.addEventListener("input", recalcMargAmount);
    disInput?.addEventListener("input", recalcMargAmount);

    // Live Search for Marg Product
    const searchMargProducts = MedHub.debounce(async (val) => {
      if (!val || val.trim().length === 0) {
        if (prodDropdown) prodDropdown.style.display = "none";
        currentSearchResults = [];
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
    }, 100);

    const renderMargDropdown = () => {
      if (!prodDropdown) return;
      prodDropdown.innerHTML = currentSearchResults.map((m, idx) => `
        <div class="search-item ${idx === highlightedIndex ? 'highlighted' : ''}" data-id="${m.id}" data-idx="${idx}">
          <div class="search-item-left">
            <span class="search-item-name">${m.name}</span>
            <span class="search-item-comp">${m.salt_composition || m.generic_name || m.company || ""}</span>
          </div>
          <div class="search-item-right">
            <span class="badge-schedule ${m.drug_schedule && m.drug_schedule.includes('H') ? 'schedule-h' : 'schedule-gen'}">
              ${m.drug_schedule || 'General'}
            </span>
            <span class="search-item-stock ${m.available_qty <= 0 ? 'stock-out' : (m.available_qty <= (m.reorder_level || 10) ? 'stock-low' : 'stock-in')}">
              Stock: ${m.available_qty || 0}
            </span>
            <span class="search-item-mrp">₹${Number(m.selling_rate || m.mrp).toFixed(2)}</span>
          </div>
        </div>
      `).join("");
      prodDropdown.style.display = "block";

      const highlightedEl = prodDropdown.querySelector(`.search-item[data-idx="${highlightedIndex}"]`);
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: "nearest" });
      }

      prodDropdown.querySelectorAll(".search-item").forEach(itemEl => {
        itemEl.addEventListener("click", () => {
          const idx = Number(itemEl.dataset.idx);
          selectMargProduct(currentSearchResults[idx]);
        });
      });
    };

    // Populate Marg Item Row from selected medicine
    const selectMargProduct = async (med) => {
      if (!med) return;
      currentSelectedMed = med;
      if (prodInput) prodInput.value = med.name;

      // Pack
      if (packInput) packInput.value = med.pack_size || "1x10";

      // FEFO Batch lookup
      const batches = await MedHub.api.getBatches(med.id);
      const chosenBatch = (batches && batches.length) ? batches[0] : null;
      currentSelectedMed.chosenBatch = chosenBatch;

      if (batchInput) {
        batchInput.value = chosenBatch ? chosenBatch.batch_no : ("BT-" + (med.barcode || "01"));
      }

      // Expiry formatted strictly as MM/YY
      const rawExp = chosenBatch ? chosenBatch.expiry_date : (med.nearest_expiry || "2028-11");
      if (expInput) {
        expInput.value = MedHub.formatExpiry(rawExp);
      }

      // Rate
      const selRate = Number(med.selling_rate || (chosenBatch ? chosenBatch.selling_price : med.mrp) || 0);
      if (rateInput) rateInput.value = selRate.toFixed(2);

      // Qty & Discount
      if (qtyInput) qtyInput.value = 1;
      if (disInput) disInput.value = 0;

      recalcMargAmount();

      if (prodDropdown) prodDropdown.style.display = "none";

      // Instantly shift focus to QTY box for fast Marg workflow
      qtyInput?.focus();
      qtyInput?.select();
    };

    prodInput?.addEventListener("input", (e) => searchMargProducts(e.target.value));
    prodInput?.addEventListener("focus", (e) => {
      if (e.target.value && e.target.value.trim().length > 0) {
        searchMargProducts(e.target.value);
      }
    });

    // Keyboard navigation in Product Search: ArrowUp, ArrowDown, Enter
    prodInput?.addEventListener("keydown", (e) => {
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

      // If Enter pressed when input is empty -> Shift focus to Bill Summary (Discount)
      if (e.key === "Enter") {
        e.preventDefault();
        if (!prodInput.value || !prodInput.value.trim()) {
          discInput?.focus();
        } else if (currentSelectedMed) {
          qtyInput?.focus();
        }
      }
    });

    // Enter Key Chain within Marg Entry Row: Pack -> Batch -> Exp -> Qty -> Free -> Rate -> Dis% -> Add
    packInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        batchInput?.focus();
      }
    });
    batchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        expInput?.focus();
      }
    });
    expInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        qtyInput?.focus();
      }
    });
    qtyInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        rateInput?.focus();
        rateInput?.select();
      }
    });
    rateInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        disInput?.focus();
      }
    });
    disInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitMargItem();
      }
    });

    // Commit Marg Item to Cart
    const commitMargItem = () => {
      const prodName = prodInput?.value?.trim();
      if (!prodName) {
        MedHub.toast("Kripya dawai ka naam select karein", "warning");
        prodInput?.focus();
        return;
      }

      const q = parseFloat(qtyInput?.value) || 1;
      const r = parseFloat(rateInput?.value) || 0;
      const d = parseFloat(disInput?.value) || 0;
      const pack = packInput?.value?.trim() || "1x10";
      const batch = batchInput?.value?.trim() || "BT-DEFAULT";
      const exp = expInput?.value?.trim() || "11/28";
      const gross = q * r;
      const net = Math.max(0, gross - (gross * (d / 100)));

      const medId = currentSelectedMed ? currentSelectedMed.id : ("m-" + Date.now());
      const batchId = currentSelectedMed?.chosenBatch?.id || null;
      const maxStock = currentSelectedMed?.available_qty || 999;
      const sch = currentSelectedMed?.drug_schedule || "General";
      const comp = currentSelectedMed?.salt_composition || "";

      // Check if existing item in cart
      const existing = MedHub.state.cart.find(it => it.medicine_id === medId && it.batch_no === batch);
      if (existing) {
        existing.quantity += q;
        existing.rate = r;
        existing.discount_percent = d;
        const exGross = existing.quantity * existing.rate;
        existing.line_total = Math.max(0, exGross - (exGross * (existing.discount_percent / 100)));
      } else {
        MedHub.state.cart.push({
          medicine_id: medId,
          name: prodName,
          company: currentSelectedMed?.company || "",
          salt_composition: comp,
          pack_size: pack,
          drug_schedule: sch,
          batch_id: batchId,
          batch_no: batch,
          expiry_date: exp,
          rate: r,
          quantity: q,
          discount_percent: d,
          line_total: net,
          max_stock: maxStock
        });
      }

      if (sch && sch.includes("H")) {
        MedHub.toast(`Notice: ${prodName} is Schedule H. Prescribing doctor recorded.`, "info");
      }

      self.updateCartUI();

      // Reset Marg Row inputs
      if (prodInput) prodInput.value = "";
      if (packInput) packInput.value = "";
      if (batchInput) batchInput.value = "";
      if (expInput) expInput.value = "";
      if (qtyInput) qtyInput.value = 1;
      if (rateInput) rateInput.value = "";
      if (disInput) disInput.value = 0;
      if (amountInput) amountInput.value = "";
      currentSelectedMed = null;
      currentSearchResults = [];
      if (prodDropdown) prodDropdown.style.display = "none";

      // Refocus product search input immediately for next item entry!
      prodInput?.focus();
    };

    addBtn?.addEventListener("click", commitMargItem);

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        if (prodDropdown) prodDropdown.style.display = "none";
      }
    });

    // Cart Quantity change in table
    container.addEventListener("input", (e) => {
      if (e.target.classList.contains("cart-qty-input")) {
        const idx = Number(e.target.dataset.index);
        let newQty = parseInt(e.target.value, 10);
        if (isNaN(newQty) || newQty <= 0) newQty = 1;
        const it = MedHub.state.cart[idx];
        it.quantity = newQty;
        const gross = newQty * it.rate;
        it.line_total = Math.max(0, gross - (gross * ((it.discount_percent || 0) / 100)));
        self.updateCartUI();
      }
    });

    // Remove Item
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-remove-item");
      if (btn) {
        const idx = Number(btn.dataset.index);
        MedHub.state.cart.splice(idx, 1);
        self.updateCartUI();
      }
    });

    // Clear Cart
    container.querySelector("#btn-clear-cart")?.addEventListener("click", () => {
      if (confirm("Kya aap poora cart clear karna chahte hain?")) {
        MedHub.state.cart = [];
        self.updateCartUI();
      }
    });

    // Complete & Print Bill
    container.querySelector("#btn-save-print")?.addEventListener("click", () => self.submitBill());

    // Global Shortcut F9 to Print Bill
    const f9Handler = (e) => {
      if (e.key === "F9") {
        e.preventDefault();
        self.submitBill();
      }
    };
    window.addEventListener("keydown", f9Handler);
  },

  async addMedicineToCart(med) {
    const batches = await MedHub.api.getBatches(med.id);
    const chosenBatch = (batches && batches.length) ? batches[0] : null;

    const rate = Number(med.selling_rate || (chosenBatch ? chosenBatch.selling_price : med.mrp));
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
    const countEl = document.getElementById("cart-count");
    const emptyState = document.getElementById("cart-empty-state");
    const printBtn = document.getElementById("btn-save-print");

    if (tableBody) tableBody.innerHTML = this.renderCartRows();
    if (countEl) countEl.innerText = MedHub.state.cart.length;
    if (emptyState) emptyState.style.display = MedHub.state.cart.length ? "none" : "block";
    if (printBtn) printBtn.disabled = MedHub.state.cart.length === 0;

    this.updateTotals();
  },

  updateTotals() {
    const subtotalEl = document.getElementById("summary-subtotal");
    const grandTotalEl = document.getElementById("summary-grand-total");
    const amtReceivedInput = document.getElementById("amt-received");

    const sub = this.calculateSubtotal();
    const grand = this.calculateGrandTotal();

    if (subtotalEl) subtotalEl.innerText = MedHub.rupee(sub);
    if (grandTotalEl) grandTotalEl.innerText = MedHub.rupee(grand);
    if (amtReceivedInput && MedHub.state.amountReceived === "") {
      amtReceivedInput.placeholder = `₹${grand.toFixed(2)}`;
    }
  },

  async submitBill() {
    if (!MedHub.state.cart.length) {
      MedHub.toast("Cart me koi dawai nahi hai", "warning");
      return;
    }

    const subtotal = this.calculateSubtotal();
    const grandTotal = this.calculateGrandTotal();
    const paidAmount = MedHub.state.paymentMode === "CREDIT" ? 0 : (Number(MedHub.state.amountReceived) || grandTotal);

    const billPayload = {
      customer_name: MedHub.state.customer.name || "Walk-in Customer",
      customer_mobile: MedHub.state.customer.mobile || "",
      patient_address: MedHub.state.customer.address || "",
      doctor_name: MedHub.state.doctor.name || "",
      doctor_hospital: "",
      subtotal: subtotal,
      discount: Number(MedHub.state.discount || 0),
      grand_total: grandTotal,
      paid_amount: paidAmount,
      payment_mode: MedHub.state.paymentMode,
      items: MedHub.state.cart
    };

    const savedBill = await MedHub.api.createBill(billPayload);
    if (savedBill) {
      MedHub.toast(`Bill #${savedBill.bill_no} successfully generated!`, "success");
      
      // Show Invoice Preview / Print Modal
      this.showInvoiceModal(savedBill);

      // Reset cart and fields
      MedHub.state.cart = [];
      MedHub.state.customer = { name: "", mobile: "", address: "" };
      MedHub.state.doctor = { name: "", hospital: "" };
      MedHub.state.discount = 0;
      MedHub.state.amountReceived = "";
      this.render(document.getElementById("page-content"));
    } else {
      MedHub.toast("Bill save karne me samasya aayi", "error");
    }
  },

  async showInvoiceModal(bill) {
    const apiStore = await MedHub.api.getStoreSettings();
    const store = { ...MedHub.defaultStore, ...MedHub.state.store, ...apiStore };
    let modalWrap = document.getElementById("invoice-modal-container");
    if (!modalWrap) {
      modalWrap = document.createElement("div");
      modalWrap.id = "invoice-modal-container";
      document.body.appendChild(modalWrap);
    }

    document.body.classList.add("modal-open");

    const isPaid = bill.paid_amount >= bill.grand_total;
    const amountInWords = MedHub.numberToWords(bill.grand_total);
    const invoiceDateStr = new Date(bill.bill_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(/\//g, "-");

    const items = (bill.items && bill.items.length) ? bill.items : (bill.bill_items || []);

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
      `Bill No: #${bill.bill_no} | Date: ${invoiceDateStr}\n` +
      `Patient: ${bill.customer_name || "Customer"}\n` +
      `Doctor: ${bill.doctor_name || "Self"}\n\n` +
      `*Items:*\n` +
      items.map(it => `• ${it.medicine_name || it.name || "Item"} (${it.quantity} qty) - ₹${Number(it.line_total || (it.quantity * it.rate) || 0).toFixed(2)}`).join("\n") +
      `\n\n*Total Amount:* ₹${Number(bill.grand_total).toFixed(2)}\n` +
      `*Status:* ${isPaid ? "PAID" : "DUE (Balance Pending)"}\n\n` +
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
                <!-- PURPLE SLANTED PAID / DUE STAMP (PHOTO REPLICA) -->
                ${isPaid ? `<div class="classic-stamp-paid">PAID</div>` : `<div class="classic-stamp-due">DUE</div>`}

                <!-- STORE HEADER -->
                <div class="classic-receipt-header">
                  <h2 class="classic-store-title">${store.store_name || "R & A MEDICAL STORE"}</h2>
                  <p class="classic-store-address">${store.address || "TUBEWELL COLONY, DEORIA UTTAR PRADESH"}${store.city ? `, ${store.city}` : ""}</p>
                  <p class="classic-store-reg">GSTIN : ${store.gstin || "09ABJFR1588A1Z3"}</p>
                  <p class="classic-store-reg">D.L. No : ${store.dl_no_20b || store.drug_license_no || "UP52210001216"}, ${store.dl_no_21b || "UP52200001216"}</p>
                </div>

                <!-- PATIENT & DOCTOR TWO-COLUMN METADATA -->
                <div class="classic-meta-grid">
                  <div>
                    <p><strong>Patient Name :</strong> ${(bill.customer_name || "VIKASH").toUpperCase()}</p>
                    <p><strong>Patient Address :</strong> ${bill.patient_address || ""}</p>
                    <p><strong>Doctor Name :</strong> ${(bill.doctor_name || "DR. DAWOOD ANSARI").toUpperCase()}</p>
                    <p><strong>Doctor Address :</strong> ${bill.doctor_hospital || ""}</p>
                  </div>
                  <div style="text-align: right;">
                    <p><strong>Invoice No :</strong> A01${String(bill.bill_no).padStart(4, "0")}</p>
                    <p><strong>Date :</strong> ${invoiceDateStr}</p>
                  </div>
                </div>

                <!-- EXACT TABLE STRUCTURE (Sn., Product, OLD MRP, Batch, QTY, PACK, EXP, MRP, Amount) -->
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
                      const rateVal = Number(it.rate || it.mrp || 0).toFixed(2);
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

                <!-- QR CODE BOX (PHOTO REPLICA - CUSTOM STORE PAYMENT QR) -->
                <div class="classic-qr-container">
                  <div class="classic-qr-box">
                    <img src="${qrImgUrl}" alt="Store Payment QR" crossorigin="anonymous" />
                  </div>
                  <div class="classic-qr-meta">
                    <strong>Scan & Pay via UPI (GPay, PhonePe, Paytm, BHIM)</strong><br />
                    <span>UPI ID: <strong>${upiId}</strong> • Payee: ${payeeName}</span><br />
                    <span style="font-size: 9px; color: #555;">Body Checkup | Health Offers • Authentic Dispensed Medicines</span>
                  </div>
                </div>

                <!-- TOTAL & AMOUNT IN WORDS -->
                <div class="classic-total-row">
                  <span>Total -</span>
                  <span>${Number(bill.grand_total).toFixed(2)}</span>
                </div>
                <div class="classic-words-line">
                  ${amountInWords}
                </div>

                <!-- FOOTER -->
                <div class="classic-footer-brand">
                  ${store.store_name || "R & A MEDICAL STORE"}
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
                        <div class="digital-item-meta">Qty: ${it.quantity} | Batch: ${it.batch_no || "BT-01"} | Exp: ${MedHub.formatExpiry(it.expiry_date)}</div>
                      </div>
                      <div class="digital-item-price">₹${Number(it.line_total || (it.quantity * it.rate) || 0).toFixed(2)}</div>
                    </div>
                  `).join("")}
                </div>

                <div class="digital-total-banner">
                  <div class="total-txt">Grand Total:</div>
                  <div class="total-num">₹${Number(bill.grand_total).toFixed(2)}</div>
                </div>

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

    // Keyboard shortcut: Pressing Enter triggers Direct Print immediately
    const printKeyHandler = (e) => {
      if (e.key === "Enter" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        e.stopPropagation();
        triggerDirectPrint();
      } else if (e.key === "Escape") {
        cleanupModal();
      }
    };
    window.addEventListener("keydown", printKeyHandler);

    // Close Modal helper
    const cleanupModal = () => {
      window.removeEventListener("keydown", printKeyHandler);
      modalWrap.innerHTML = "";
      document.body.classList.remove("modal-open");
    };

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
