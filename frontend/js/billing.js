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

        <!-- SEARCH MEDICINE SECTION -->
        <div class="card medicine-search-card" style="margin-top: 18px; position: relative;">
          <div class="search-box-header">
            <label class="search-title">Medicine Search</label>
            <span class="search-shortcut">Type medicine or generic name (↑ ↓ Enter to select)</span>
          </div>
          <div class="search-input-wrap">
            <span class="search-icon">${MedHub.icons.search}</span>
            <input type="text" id="med-search-input" class="search-input" 
              placeholder="Search by brand name, salt composition, company or barcode..." autocomplete="off" />
            <button type="button" id="clear-search-btn" class="clear-search-btn" style="display: none;">${MedHub.icons.close}</button>
          </div>
          
          <!-- Dropdown search results list -->
          <div id="medicine-search-dropdown" class="medicine-dropdown-results" style="display: none;"></div>
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
                    <th style="width: 40px;">#</th>
                    <th>Medicine & Composition</th>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th>Schedule</th>
                    <th>Rate (₹)</th>
                    <th style="width: 90px;">Qty</th>
                    <th>Line Total</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody id="cart-items-body">
                  ${this.renderCartRows()}
                </tbody>
              </table>
              <div id="cart-empty-state" class="cart-empty" style="${MedHub.state.cart.length ? "display:none;" : ""}">
                <p>No medicine added to cart</p>
                <span class="cart-empty-sub">Search medicine above or scan barcode to add</span>
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
          </td>
          <td><span class="badge-code">${it.batch_no || "BT-DEFAULT"}</span></td>
          <td>${MedHub.formatDate(it.expiry_date)}</td>
          <td>
            <span class="badge-schedule ${isScheduleH ? 'schedule-h' : 'schedule-gen'}">
              ${it.drug_schedule || 'General'}
            </span>
          </td>
          <td>₹${Number(it.rate).toFixed(2)}</td>
          <td>
            <input type="number" class="cart-qty-input" min="1" max="${it.max_stock || 999}" 
              value="${it.quantity}" data-index="${idx}" style="width: 65px;" />
          </td>
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

    // Medicine Live Search
    const searchInput = container.querySelector("#med-search-input");
    const searchDropdown = container.querySelector("#medicine-search-dropdown");
    const clearBtn = container.querySelector("#clear-search-btn");

    const doSearch = MedHub.debounce(async (val) => {
      if (!val || val.trim().length === 0) {
        searchDropdown.style.display = "none";
        clearBtn.style.display = "none";
        return;
      }
      clearBtn.style.display = "block";
      const results = await MedHub.api.searchMedicines(val);
      if (!results || results.length === 0) {
        searchDropdown.innerHTML = `<div class="search-no-res">No medicines found for "${val}"</div>`;
        searchDropdown.style.display = "block";
        return;
      }

      searchDropdown.innerHTML = results.map((m, idx) => `
        <div class="search-item" data-id="${m.id}" data-idx="${idx}">
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
      searchDropdown.style.display = "block";

      // Click to select medicine
      searchDropdown.querySelectorAll(".search-item").forEach(itemEl => {
        itemEl.addEventListener("click", async () => {
          const medId = itemEl.dataset.id;
          const chosenMed = results.find(r => String(r.id) === String(medId));
          if (chosenMed) {
            await self.addMedicineToCart(chosenMed);
            searchInput.value = "";
            searchDropdown.style.display = "none";
            clearBtn.style.display = "none";
            searchInput.focus();
          }
        });
      });
    }, 200);

    searchInput?.addEventListener("input", (e) => doSearch(e.target.value));

    // Clear search button
    clearBtn?.addEventListener("click", () => {
      searchInput.value = "";
      searchDropdown.style.display = "none";
      clearBtn.style.display = "none";
      searchInput.focus();
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        if (searchDropdown) searchDropdown.style.display = "none";
      }
    });

    // Cart Quantity change
    container.addEventListener("input", (e) => {
      if (e.target.classList.contains("cart-qty-input")) {
        const idx = Number(e.target.dataset.index);
        let newQty = parseInt(e.target.value, 10);
        if (isNaN(newQty) || newQty <= 0) newQty = 1;
        MedHub.state.cart[idx].quantity = newQty;
        MedHub.state.cart[idx].line_total = newQty * MedHub.state.cart[idx].rate;
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
  },

  async addMedicineToCart(med) {
    // Check batches via FEFO
    const batches = await MedHub.api.getBatches(med.id);
    const chosenBatch = (batches && batches.length) ? batches[0] : null;

    const rate = Number(med.selling_rate || (chosenBatch ? chosenBatch.selling_price : med.mrp));
    const batchNo = chosenBatch ? chosenBatch.batch_no : "BT-" + (med.barcode || "001");
    const expiry = chosenBatch ? chosenBatch.expiry_date : (med.nearest_expiry || "2027-12-31");
    const batchId = chosenBatch ? chosenBatch.id : null;

    // Check if item already in cart with same batch
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
        drug_schedule: med.drug_schedule || "General",
        batch_id: batchId,
        batch_no: batchNo,
        expiry_date: expiry,
        rate: rate,
        quantity: 1,
        line_total: rate,
        max_stock: (chosenBatch ? chosenBatch.quantity : med.available_qty) || 999
      });
    }

    // Schedule H notification if needed
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
              <button type="button" class="btn-primary" id="btn-do-print">
                ${MedHub.icons.print} Direct Print
              </button>
              <button type="button" class="btn-outline" id="btn-do-pdf">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF
              </button>
              <button type="button" class="btn-icon" id="btn-close-modal">
                ${MedHub.icons.close}
              </button>
            </div>
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
                      const expMatch = it.expiry_date ? new Date(it.expiry_date) : null;
                      const expFormatted = expMatch && !isNaN(expMatch.getTime()) ? `${expMatch.getMonth() + 1}/${String(expMatch.getFullYear()).slice(-2)}` : "3/28";
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
                        <div class="digital-item-meta">Qty: ${it.quantity} | Batch: ${it.batch_no || "BT-01"} | Exp: ${MedHub.formatDate(it.expiry_date)}</div>
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

    tabNormal?.addEventListener("click", () => {
      tabNormal.classList.add("active");
      tabDigital.classList.remove("active");
      normalView.style.display = "block";
      digitalView.style.display = "none";
    });

    tabDigital?.addEventListener("click", () => {
      tabDigital.classList.add("active");
      tabNormal.classList.remove("active");
      digitalView.style.display = "block";
      normalView.style.display = "none";
    });

    // Close Modal helper
    const closeModal = () => {
      modalWrap.innerHTML = "";
      document.body.classList.remove("modal-open");
    };

    document.getElementById("btn-close-modal")?.addEventListener("click", closeModal);
    modalWrap.querySelector(".modal-overlay")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        closeModal();
      }
    });

    // Direct Instant Browser Print (Native Print Preview Dialog - ONLY NORMAL BILL)
    document.getElementById("btn-do-print")?.addEventListener("click", () => {
      // Ensure normal billing is active before printing
      if (normalView && digitalView) {
        tabNormal?.classList.add("active");
        tabDigital?.classList.remove("active");
        normalView.style.display = "block";
        digitalView.style.display = "none";
      }
      window.print();
    });

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
