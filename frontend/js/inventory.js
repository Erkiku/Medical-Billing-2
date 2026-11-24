// ============================================================================
// MedEduHub - Medicines & Stock Screen (js/inventory.js)
// Redesigned to exact UI of Screenshot 2 (Add New Medicine Modal)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.inventory = {
  currentTab: "all",
  searchFilter: "",
  categoryFilter: "all",
  medicinesList: [],

  async render(container) {
    this.medicinesList = await MedHub.api.getMedicines();
    await MedHub.api.getCategories();

    const totalSkus = this.medicinesList.length;
    const lowStockCount = this.medicinesList.filter(m => m.status === "low").length;
    const outStockCount = this.medicinesList.filter(m => m.status === "out").length;
    const totalUnits = this.medicinesList.reduce((sum, m) => sum + (Number(m.available_qty) || 0), 0);

    container.innerHTML = `
      <div class="inventory-page-wrap">
        <!-- HEADER WITH ACTIONS -->
        <div class="page-header-flex">
          <div>
            <h2 class="page-title">Medicines & Stock Inventory</h2>
            <p class="page-subtitle">Manage catalog, pricing, FEFO batches, drug schedules & reorder levels</p>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-outline" id="btn-export-excel">
              ${MedHub.icons.download} Download Excel
            </button>
            <button type="button" class="btn-outline" id="btn-export-pdf">
              ${MedHub.icons.print} Download PDF
            </button>
            <button type="button" class="btn-primary" id="btn-open-add-modal">
              ${MedHub.icons.plus} Add New Medicine
            </button>
          </div>
        </div>

        <!-- STATS KPI CARDS -->
        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Total Medicines (SKUs)</span>
            <span class="stat-value">${totalSkus}</span>
            <span class="stat-note">${totalUnits} total units in stock</span>
          </div>
          <div class="stat-card stat-low">
            <span class="stat-label">Low Stock Alert</span>
            <span class="stat-value">${lowStockCount}</span>
            <span class="stat-note">Reorder required soon</span>
          </div>
          <div class="stat-card stat-out">
            <span class="stat-label">Out of Stock</span>
            <span class="stat-value">${outStockCount}</span>
            <span class="stat-note">Zero units available</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Categories Configured</span>
            <span class="stat-value">${MedHub.state.categories.length}</span>
            <span class="stat-note">Tablets, Syrups, etc.</span>
          </div>
        </div>

        <!-- FILTER & SEARCH BAR -->
        <div class="card filter-bar-card" style="margin-top: 20px;">
          <div class="filter-bar-flex">
            <!-- Tabs -->
            <div class="tab-pills">
              <button type="button" class="tab-pill ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">All (${totalSkus})</button>
              <button type="button" class="tab-pill ${this.currentTab === 'low' ? 'active' : ''}" data-tab="low">Low Stock (${lowStockCount})</button>
              <button type="button" class="tab-pill ${this.currentTab === 'out' ? 'active' : ''}" data-tab="out">Out of Stock (${outStockCount})</button>
            </div>

            <!-- Search and category dropdown -->
            <div class="filter-inputs">
              <div class="search-input-wrap-sm">
                <span class="search-icon">${MedHub.icons.search}</span>
                <input type="text" id="inv-search-input" placeholder="Search by name, salt, company..." value="${this.searchFilter}" />
              </div>
              <select id="inv-category-select" class="select-field-sm">
                <option value="all">All Categories</option>
                ${MedHub.state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>

        <!-- MEDICINES TABLE -->
        <div class="card table-card" style="margin-top: 16px;">
          <div class="table-wrap" id="printable-inventory-table">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine Name & Salt</th>
                  <th>Manufacturer</th>
                  <th>Category</th>
                  <th>Schedule</th>
                  <th>Pack</th>
                  <th>MRP</th>
                  <th>Selling Rate</th>
                  <th>Available Qty</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="inventory-tbody">
                ${this.renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ADD NEW MEDICINE MODAL (EXACT DESIGN MATCHING IMAGE 2) -->
      <div id="add-medicine-modal-wrap"></div>
    `;

    this.bindEvents(container);
  },

  getFilteredMedicines() {
    let list = this.medicinesList;

    if (this.currentTab === "low") {
      list = list.filter(m => m.status === "low");
    } else if (this.currentTab === "out") {
      list = list.filter(m => m.status === "out");
    }

    if (this.categoryFilter !== "all") {
      list = list.filter(m => m.category === this.categoryFilter);
    }

    if (this.searchFilter.trim().length > 0) {
      const q = this.searchFilter.trim().toLowerCase();
      list = list.filter(m => 
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.salt_composition && m.salt_composition.toLowerCase().includes(q)) ||
        (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
        (m.company && m.company.toLowerCase().includes(q)) ||
        (m.barcode && m.barcode.toLowerCase().includes(q))
      );
    }

    return list;
  },

  renderTableRows() {
    const list = this.getFilteredMedicines();
    if (!list.length) {
      return `<tr><td colspan="11" class="table-empty">Koi medicine nahi mili. Nayi medicine add karein.</td></tr>`;
    }

    return list.map((m, idx) => {
      const isScheduleH = m.drug_schedule && m.drug_schedule.includes("H");
      const statusBadge = m.status === "out" ? 
        `<span class="badge-status status-out">Out of Stock</span>` : 
        (m.status === "low" ? `<span class="badge-status status-low">Low Stock</span>` : `<span class="badge-status status-in">In Stock</span>`);

      return `
        <tr>
          <td class="cell-nowrap">${idx + 1}</td>
          <td class="cell-med-title">
            <strong>${m.name}</strong>
            ${m.salt_composition ? `<div class="sub-text">${m.salt_composition}</div>` : (m.generic_name ? `<div class="sub-text">${m.generic_name}</div>` : "")}
          </td>
          <td class="cell-nowrap">${m.company || "—"}</td>
          <td class="cell-nowrap"><span class="badge-cat">${m.category || "Tablet"}</span></td>
          <td class="cell-nowrap">
            <span class="badge-schedule ${isScheduleH ? 'schedule-h' : 'schedule-gen'}">
              ${m.drug_schedule || "General"}
            </span>
          </td>
          <td class="cell-nowrap">${m.pack_size || "1 × 10"}</td>
          <td class="cell-nowrap">₹${Number(m.mrp).toFixed(2)}</td>
          <td class="cell-nowrap"><strong>₹${Number(m.selling_rate || m.mrp).toFixed(2)}</strong></td>
          <td class="cell-nowrap"><strong style="font-size:14px;">${m.available_qty || 0}</strong></td>
          <td class="cell-nowrap">${MedHub.formatExpiry ? MedHub.formatExpiry(m.nearest_expiry) : MedHub.formatDate(m.nearest_expiry)}</td>
          <td class="cell-nowrap">${statusBadge}</td>
        </tr>
      `;
    }).join("");
  },

  bindEvents(container) {
    const self = this;

    // Tabs
    container.querySelectorAll(".tab-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        container.querySelectorAll(".tab-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        self.currentTab = pill.dataset.tab;
        self.updateTableOnly();
      });
    });

    // Search input
    const searchInput = container.querySelector("#inv-search-input");
    searchInput?.addEventListener("input", MedHub.debounce((e) => {
      self.searchFilter = e.target.value;
      self.updateTableOnly();
    }, 200));

    // Category dropdown
    const catSelect = container.querySelector("#inv-category-select");
    catSelect?.addEventListener("change", (e) => {
      self.categoryFilter = e.target.value;
      self.updateTableOnly();
    });

    // Export Excel
    container.querySelector("#btn-export-excel")?.addEventListener("click", () => {
      const list = self.getFilteredMedicines().map(m => ({
        "Medicine Name": m.name,
        "Salt Composition": m.salt_composition || "",
        "Generic Name": m.generic_name || "",
        "Company": m.company || "",
        "Category": m.category || "",
        "Schedule": m.drug_schedule || "General",
        "Pack Size": m.pack_size || "",
        "MRP (₹)": m.mrp,
        "Selling Rate (₹)": m.selling_rate || m.mrp,
        "Purchase Price (₹)": m.purchase_price || 0,
        "Stock Quantity": m.available_qty || 0,
        "Nearest Expiry": m.nearest_expiry || "",
        "Status": m.status
      }));
      MedHub.exportToExcel(list, "Medicine_Inventory", "Medicines");
    });

    // Export Formal PDF with Full Medical Store Header
    container.querySelector("#btn-export-pdf")?.addEventListener("click", () => {
      self.exportFormalStockPdf();
    });

    // Open Add Medicine Modal
    container.querySelector("#btn-open-add-modal")?.addEventListener("click", () => {
      self.openAddMedicineModal();
    });
  },

  updateTableOnly() {
    const tbody = document.getElementById("inventory-tbody");
    if (tbody) tbody.innerHTML = this.renderTableRows();
  },

  async exportFormalStockPdf() {
    const apiStore = await MedHub.api.getStoreSettings();
    const store = { ...MedHub.defaultStore, ...MedHub.state.store, ...apiStore };
    const list = this.getFilteredMedicines();

    const totalUnits = list.reduce((sum, m) => sum + (Number(m.available_qty) || 0), 0);
    const totalValuation = list.reduce((sum, m) => sum + ((Number(m.available_qty) || 0) * (Number(m.selling_rate) || Number(m.mrp) || 0)), 0);

    let reportWrap = document.getElementById("temp-inventory-pdf-wrap");
    if (!reportWrap) {
      reportWrap = document.createElement("div");
      reportWrap.id = "temp-inventory-pdf-wrap";
      document.body.appendChild(reportWrap);
    }

    reportWrap.innerHTML = `
      <div id="formal-inventory-report-sheet" class="invoice-sheet" style="padding: 24px; background: #ffffff;">
        <!-- FORMAL MEDICAL STORE HEADER (PROPER DETAILS IN HEADER) -->
        <div class="invoice-formal-header">
          <div class="formal-header-top">
            <div class="formal-store-info">
              <h1 class="formal-store-name">${store.store_name || "SAGAR MEDICAL STORE"}</h1>
              <p class="formal-store-tagline">${store.tagline || "Retail & Wholesale Chemists"}</p>
              <p class="formal-store-address">
                ${store.address || "Shop 4, Medical Plaza, Main Road"}${store.city ? `, ${store.city}` : ""}${store.state ? `, ${store.state}` : ""}${store.pincode ? ` - ${store.pincode}` : ""}
              </p>
              <p class="formal-store-contact">
                <span><strong>Phone:</strong> ${store.phone || "9876543210"}</span>
                ${store.upi_id ? `<span> | <strong>UPI:</strong> ${store.upi_id}</span>` : ""}
              </p>
            </div>
            <div class="formal-header-badge-box">
              <span class="formal-tax-badge">STOCK INVENTORY REPORT</span>
              <span class="formal-sub-badge">FORMAL AUDIT STATEMENT</span>
            </div>
          </div>

          <div class="formal-regulatory-bar">
            <div class="reg-item"><strong>GSTIN:</strong> ${store.gstin || "07AAAAA0000A1Z5"}</div>
            <div class="reg-item"><strong>D.L. No. (20B):</strong> ${store.dl_no_20b || store.drug_license_no || "DL-20B-123456"}</div>
            <div class="reg-item"><strong>D.L. No. (21B):</strong> ${store.dl_no_21b || "DL-21B-654321"}</div>
            ${store.fssai_no ? `<div class="reg-item"><strong>FSSAI:</strong> ${store.fssai_no}</div>` : ""}
          </div>
        </div>

        <div class="formal-info-boxes-grid" style="margin-top: 14px;">
          <div class="formal-info-box">
            <p><strong>Report Date & Time:</strong> ${new Date().toLocaleString("en-IN")}</p>
            <p><strong>Stock Category Filter:</strong> ${this.currentTab.toUpperCase()} (${list.length} Items Listed)</p>
          </div>
          <div class="formal-info-box" style="text-align: right;">
            <p><strong>Total In-Stock Units:</strong> ${totalUnits} units</p>
            <p><strong>Estimated Inventory Value:</strong> ${MedHub.rupee(totalValuation)}</p>
          </div>
        </div>

        <table class="invoice-table" style="margin-top: 14px;">
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Medicine Name & Salt Composition</th>
              <th>Manufacturer</th>
              <th>Category</th>
              <th>Schedule</th>
              <th>Pack</th>
              <th>MRP</th>
              <th>Rate</th>
              <th>Qty</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${list.map((m, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>
                  <strong>${m.name}</strong>
                  ${m.salt_composition ? `<div style="font-size:10px;color:#64748b;">${m.salt_composition}</div>` : ""}
                </td>
                <td>${m.company || "—"}</td>
                <td>${m.category || "Tablet"}</td>
                <td><span class="badge-schedule ${m.drug_schedule && m.drug_schedule.includes('H') ? 'schedule-h' : 'schedule-gen'}">${m.drug_schedule || "General"}</span></td>
                <td>${m.pack_size || "1 × 10"}</td>
                <td>₹${Number(m.mrp).toFixed(2)}</td>
                <td>₹${Number(m.selling_rate || m.mrp).toFixed(2)}</td>
                <td><strong>${m.available_qty || 0}</strong></td>
                <td>${MedHub.formatExpiry ? MedHub.formatExpiry(m.nearest_expiry) : MedHub.formatDate(m.nearest_expiry)}</td>
                <td>${m.status === 'out' ? 'Out of Stock' : (m.status === 'low' ? 'Low Stock' : 'In Stock')}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="invoice-summary" style="margin-top: 16px;">
          <div class="invoice-summary-left">
            <p style="font-size:11px;color:#64748b;">
              Official Stock Inventory & Valuation Register of ${store.store_name}. Generated by MedEduHub Pharma OS.
            </p>
            <div class="pharmacy-stamp-box">
              <p>Registered Pharmacist Stamp & Signature</p>
            </div>
          </div>
          <div class="invoice-summary-right">
            <p>Total Listed Medicines: <span>${list.length} SKUs</span></p>
            <p class="invoice-grand-total">Total Stock Value: <span>${MedHub.rupee(totalValuation)}</span></p>
          </div>
        </div>
      </div>
    `;

    MedHub.exportToPdf("formal-inventory-report-sheet", `${(store.store_name || "Pharmacy").replace(/[^a-zA-Z0-9]/g, '_')}_Stock_Report`);
  },

  // ==========================================================================
  // EXACT MODAL DIALOG MATCHING IMAGE 2: "Add New Medicine to Catalog"
  // ==========================================================================
  openAddMedicineModal() {
    const modalWrap = document.getElementById("add-medicine-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box medicine-modal-dialog">
          <!-- MODAL HEADER -->
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Add New Medicine to Catalog</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-med-modal">${MedHub.icons.close}</button>
          </div>

          <!-- MODAL BODY FORM -->
          <form id="add-medicine-form" class="modal-dialog-body">
            <!-- ROW 1: Medicine Name & Company -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Medicine Name <span class="req">*</span></label>
                <input type="text" id="m-name" class="input-field" placeholder="e.g. Dolo 650 Tablet" required />
              </div>
              <div class="form-group">
                <label class="form-label">Company / Manufacturer <span class="req">*</span></label>
                <input type="text" id="m-company" class="input-field" placeholder="e.g. Micro Labs Ltd" required />
              </div>
            </div>

            <!-- ROW 2: Generic Name & Salt Composition -->
            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Generic Name</label>
                <input type="text" id="m-generic" class="input-field" placeholder="e.g. Paracetamol" />
              </div>
              <div class="form-group">
                <label class="form-label">Salt Composition</label>
                <input type="text" id="m-salt" class="input-field" placeholder="e.g. Paracetamol 650mg" />
              </div>
            </div>

            <!-- ROW 3: Category, Drug Schedule, Pack Size, Barcode -->
            <div class="form-row-medicine-specs" style="margin-top: 14px;">
              <!-- Category -->
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Category</label>
                  <button type="button" class="btn-cat-mini" id="btn-add-cat" title="Add new category">+ Add</button>
                </div>
                <select id="m-category" class="input-field select-field">
                  <option value="">Select Category</option>
                  ${MedHub.state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
                </select>
              </div>

              <!-- Drug Schedule -->
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Drug Schedule</label>
                  <span class="label-badge-hint">(H, H1, C, X)</span>
                </div>
                <select id="m-schedule" class="input-field select-field">
                  <option value="General (OTC / Non-Rx)">General (OTC / Non-Rx)</option>
                  <option value="Schedule H">Schedule H</option>
                  <option value="Schedule H1">Schedule H1</option>
                  <option value="Schedule C">Schedule C</option>
                  <option value="Schedule X">Schedule X</option>
                </select>
              </div>

              <!-- Pack Size ("X" is always between for pack) -->
              <div class="form-group">
                <label class="form-label">Pack Size</label>
                <div class="pack-size-duo-wrap">
                  <input type="number" id="m-pack-strip" min="1" placeholder="1" value="1" title="Pack / Strips count" />
                  <span class="pack-size-x-badge">×</span>
                  <input type="text" id="m-pack-unit" placeholder="10" value="10" title="Units / Tablets per pack" />
                </div>
              </div>

              <!-- Barcode -->
              <div class="form-group">
                <label class="form-label">Barcode</label>
                <input type="text" id="m-barcode" class="input-field" placeholder="Scan or enter code" />
              </div>
            </div>

            <!-- ROW 4: Pricing & GST (Adjusted: MRP & Selling Rate removed) -->
            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Purchase Price (₹)</label>
                <input type="number" step="0.01" id="m-purchase-price" class="input-field" placeholder="25.00" />
              </div>
              <div class="form-group">
                <label class="form-label">GST Rate (%)</label>
                <select id="m-gst" class="input-field select-field">
                  <option value="12">12%</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>

            <!-- SUB-CARD: OPTIONAL INITIAL BATCH STOCK -->
            <div class="modal-subcard-batch" style="margin-top: 18px;">
              <h4 class="subcard-title">Optional: Add Initial Batch Stock</h4>
              <div class="form-row-3" style="margin-top: 10px;">
                <div class="form-group">
                  <label class="form-label">Batch Number</label>
                  <input type="text" id="m-batch-no" class="input-field" placeholder="e.g. B-998" />
                </div>
                <div class="form-group">
                  <label class="form-label">Expiry (Month & Year)</label>
                  <input type="month" id="m-expiry-date" class="input-field" title="Expiry Month & Year" />
                </div>
                <div class="form-group">
                  <label class="form-label">Quantity</label>
                  <input type="number" id="m-quantity" class="input-field" placeholder="e.g. 100" />
                </div>
              </div>
            </div>

            <!-- MODAL ACTIONS (FOOTER) -->
            <div class="modal-dialog-footer" style="margin-top: 24px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" id="btn-save-medicine">Save Medicine</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Modal Close events
    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-med-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-modal")?.addEventListener("click", closeModal);

    // Category Quick Add / Add & select handlers
    const catSelect = document.getElementById("m-category");
    const handleAddCategory = async (autoSelect = false) => {
      const newCatName = prompt("Nayi category ka naam darj karein (e.g. Inhaler, Syrup):");
      if (!newCatName || !newCatName.trim()) return;
      const created = await MedHub.api.createCategory(newCatName.trim());
      if (created) {
        const opt = document.createElement("option");
        opt.value = created.name;
        opt.innerText = created.name;
        catSelect.appendChild(opt);
        if (autoSelect) {
          catSelect.value = created.name;
        }
        MedHub.toast(`Category "${created.name}" add ho gayi!`, "success");
      }
    };

    document.getElementById("btn-add-cat")?.addEventListener("click", () => handleAddCategory(true));

    // Form Submit: Save Medicine
    const form = document.getElementById("add-medicine-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("m-name").value.trim();
      const company = document.getElementById("m-company").value.trim();
      const generic_name = document.getElementById("m-generic").value.trim();
      const salt_composition = document.getElementById("m-salt").value.trim();
      const category = document.getElementById("m-category").value;
      const drug_schedule = document.getElementById("m-schedule").value;
      const stripVal = document.getElementById("m-pack-strip")?.value.trim() || "1";
      const unitVal = document.getElementById("m-pack-unit")?.value.trim() || "10";
      const pack_size = `${stripVal} × ${unitVal}`;
      const barcode = document.getElementById("m-barcode").value.trim();
      const purchase_price = document.getElementById("m-purchase-price")?.value;
      const mrpInput = document.getElementById("m-mrp");
      const sellingRateInput = document.getElementById("m-selling-rate");
      const purPriceNum = purchase_price ? Number(purchase_price) : 0;
      const mrp = mrpInput ? (Number(mrpInput.value) || purPriceNum) : purPriceNum;
      const selling_rate = sellingRateInput ? (Number(sellingRateInput.value) || mrp) : mrp;
      const gst_percent = document.getElementById("m-gst")?.value;

      // Initial batch fields
      const batch_no = document.getElementById("m-batch-no").value.trim();
      const expiry_date = document.getElementById("m-expiry-date").value;
      const quantity = document.getElementById("m-quantity").value;

      let initialBatch = null;
      if (batch_no && Number(quantity) > 0) {
        initialBatch = {
          batch_no: batch_no,
          expiry_date: expiry_date || new Date(Date.now() + 365*86400000).toISOString().slice(0, 10),
          quantity: Number(quantity)
        };
      }

      const medData = {
        name,
        company,
        generic_name,
        salt_composition,
        category: category || "Tablet",
        drug_schedule,
        pack_size: pack_size || "1x10",
        barcode,
        purchase_price: purPriceNum,
        mrp: mrp,
        selling_rate: selling_rate,
        gst_percent: Number(gst_percent) || 12
      };

      const saveBtn = document.getElementById("btn-save-medicine");
      saveBtn.disabled = true;
      saveBtn.innerText = "Saving...";

      const saved = await MedHub.api.createMedicine(medData, initialBatch);
      if (saved) {
        MedHub.toast(`Medicine "${name}" successfully catalog me add ho gayi!`, "success");
        closeModal();
        // Refresh inventory table
        this.render(document.getElementById("page-content"));
      } else {
        MedHub.toast("Medicine save karne me dikkat aayi", "error");
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Medicine";
      }
    });
  }
};
