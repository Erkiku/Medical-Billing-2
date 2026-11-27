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

  computeStockPacksAndUnits(packVal, tabVal, packSizeStr = "1x10") {
    const pInfo = MedHub.parsePackSize ? MedHub.parsePackSize(packSizeStr) : { unitsPerPack: 10 };
    const unitsPerPack = Math.max(1, Number(pInfo.unitsPerPack) || 1);
    const packsIn = Math.max(0, Number(packVal) || 0);
    const tabsIn = Math.max(0, Number(tabVal) || 0);
    const totalPacks = Number((packsIn + (tabsIn / unitsPerPack)).toFixed(4));
    const totalTablets = Number(((packsIn * unitsPerPack) + tabsIn).toFixed(2));
    return { unitsPerPack, packsIn, tabsIn, totalPacks, totalTablets };
  },

  splitPacksToPackAndUnits(totalPacksRaw, packSizeStr = "1x10") {
    if (totalPacksRaw === "" || totalPacksRaw === null || totalPacksRaw === undefined) {
      return { packs: "", tablets: "" };
    }
    const total = Math.max(0, Number(totalPacksRaw) || 0);
    const pInfo = MedHub.parsePackSize ? MedHub.parsePackSize(packSizeStr) : { unitsPerPack: 10 };
    const unitsPerPack = Math.max(1, Number(pInfo.unitsPerPack) || 1);
    let packs = Math.floor(total + 1e-9);
    let tablets = Math.round((total - packs) * unitsPerPack);
    if (tablets >= unitsPerPack) {
      packs += Math.floor(tablets / unitsPerPack);
      tablets = tablets % unitsPerPack;
    }
    return { packs, tablets };
  },

  async render(container) {
    this.medicinesList = await MedHub.api.getMedicines();
    await Promise.all([
      MedHub.api.getCategories(),
      MedHub.api.getCompanies ? MedHub.api.getCompanies() : Promise.resolve(),
      MedHub.api.getDrugSchedules ? MedHub.api.getDrugSchedules() : Promise.resolve()
    ]);

    const totalSkus = this.medicinesList.length;
    const lowStockCount = this.medicinesList.filter(m => m.status === "low").length;
    const outStockCount = this.medicinesList.filter(m => m.status === "out").length;
    const totalUnits = Number(this.medicinesList.reduce((sum, m) => sum + (Number(m.available_qty) || 0), 0).toFixed(2));
    const lockActive = MedHub.api.isEditSecurityEnabled();
    const canEdit = MedHub.api.canShowEditControls();

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
            ${lockActive && !canEdit ? `
              <button type="button" class="btn-unlock-edit" id="btn-unlock-edit-mode">
                🔒 Unlock Edit Options
              </button>
            ` : (lockActive ? `
              <button type="button" class="btn-lock-edit" id="btn-lock-edit-mode" title="Hide and lock edit options">
                🔓 Lock Edit
              </button>
            ` : "")}
            <button type="button" class="btn-primary" id="btn-open-add-modal">
              ${MedHub.icons.plus} Add New Medicine
            </button>
          </div>
        </div>

        <!-- STATS KPI CARDS -->
        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <span class="stat-label">Total Medicines (SKUs)</span>
            <span class="stat-value" id="inv-kpi-skus">${totalSkus}</span>
            <span class="stat-note" id="inv-kpi-units">${totalUnits} total units in stock</span>
          </div>
          <div class="stat-card stat-low">
            <span class="stat-label">Low Stock Alert</span>
            <span class="stat-value" id="inv-kpi-low">${lowStockCount}</span>
            <span class="stat-note">Reorder required soon</span>
          </div>
          <div class="stat-card stat-out">
            <span class="stat-label">Out of Stock</span>
            <span class="stat-value" id="inv-kpi-out">${outStockCount}</span>
            <span class="stat-note">Zero units available</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Categories Configured</span>
            <span class="stat-value" id="inv-kpi-cats">${MedHub.state.categories.length}</span>
            <span class="stat-note">Tablets, Syrups, etc.</span>
          </div>
        </div>

        <!-- FILTER & SEARCH BAR -->
        <div class="card filter-bar-card" style="margin-top: 20px;">
          <div class="filter-bar-flex">
            <!-- Tabs -->
            <div class="tab-pills">
              <button type="button" class="tab-pill ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all" id="inv-tab-all">All (${totalSkus})</button>
              <button type="button" class="tab-pill ${this.currentTab === 'low' ? 'active' : ''}" data-tab="low" id="inv-tab-low">Low Stock (${lowStockCount})</button>
              <button type="button" class="tab-pill ${this.currentTab === 'out' ? 'active' : ''}" data-tab="out" id="inv-tab-out">Out of Stock (${outStockCount})</button>
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
                  ${canEdit ? `<th style="width: 175px; text-align: center;">Actions</th>` : ""}
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
    const canEdit = MedHub.api.canShowEditControls();
    const list = this.getFilteredMedicines();
    if (!list.length) {
      return `<tr><td colspan="${canEdit ? 12 : 11}" class="table-empty">Koi medicine nahi mili. ${canEdit ? "Nayi medicine add karein." : ""}</td></tr>`;
    }

    return list.map((m, idx) => {
      const isScheduleH = m.drug_schedule && m.drug_schedule.includes("H");
      const qtyNum = Number(m.available_qty) || 0;
      const computedStatus = MedHub.computeStockStatus ? MedHub.computeStockStatus(qtyNum) : (qtyNum <= 0 ? "out" : (qtyNum <= 1 ? "low" : "in"));
      const inferredCat = MedHub.inferMedicineCategory ? MedHub.inferMedicineCategory(m.name) : "";
      const displayCat = (!m.category || (m.category === "Tablet" && inferredCat && inferredCat !== "Tablet"))
        ? (inferredCat || "Tablet")
        : m.category;
      const unitLbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(displayCat, m.name) : { singular: "tab", plural: "tabs", packUnit: "tabs/pk" };
      const packCountUnits = MedHub.parsePackSize ? MedHub.parsePackSize(m.pack_size || "1 × 10").unitsPerPack : 10;
      const totalInnerUnits = Number((qtyNum * packCountUnits).toFixed(2));
      const mrpNum = Number(m.mrp) > 0 ? Number(m.mrp) : (Number(m.selling_rate) || 0);
      const sellNum = Number(m.selling_rate) > 0 ? Number(m.selling_rate) : mrpNum;
      const statusBadge = computedStatus === "out" ? 
        `<span class="badge-status status-out">Out of Stock</span>` : 
        (computedStatus === "low" ? `<span class="badge-status status-low">Low Stock</span>` : `<span class="badge-status status-in">In Stock</span>`);

      return `
        <tr>
          <td class="cell-nowrap">${idx + 1}</td>
          <td class="cell-med-title">
            <strong>${m.name}</strong>
            ${m.salt_composition ? `<div class="sub-text">${m.salt_composition}</div>` : (m.generic_name ? `<div class="sub-text">${m.generic_name}</div>` : "")}
          </td>
          <td class="cell-nowrap">${m.company || "—"}</td>
          <td class="cell-nowrap"><span class="badge-cat">${displayCat}</span></td>
          <td class="cell-nowrap">
            <span class="badge-schedule ${isScheduleH ? 'schedule-h' : 'schedule-gen'}">
              ${m.drug_schedule || "General"}
            </span>
          </td>
          <td class="cell-nowrap">
            ${m.pack_size || "1 × 10"}
            <div style="font-size:10px;color:#64748b;">${packCountUnits} ${unitLbl.packUnit}</div>
          </td>
          <td class="cell-nowrap">₹${mrpNum.toFixed(2)}</td>
          <td class="cell-nowrap"><strong>₹${sellNum.toFixed(2)}</strong></td>
          <td class="cell-nowrap">
            <strong style="font-size:14px;">${Number(qtyNum.toFixed(2))}</strong>
            <div style="font-size:10px;color:#64748b;">${totalInnerUnits} ${totalInnerUnits === 1 ? unitLbl.singular : unitLbl.plural}</div>
          </td>
          <td class="cell-nowrap">${MedHub.formatExpiry ? MedHub.formatExpiry(m.nearest_expiry) : MedHub.formatDate(m.nearest_expiry)}</td>
          <td class="cell-nowrap">${statusBadge}</td>
          ${canEdit ? `
            <td class="cell-nowrap table-actions-cell">
              <button type="button" class="btn-action-stock btn-stock-action" data-id="${m.id}" title="Add New Stock Batch">
                + Stock
              </button>
              <button type="button" class="btn-action-edit btn-edit-action" data-id="${m.id}" title="Edit Medicine">
                Edit
              </button>
              <button type="button" class="btn-action-delete btn-delete-action" data-id="${m.id}" title="Delete Medicine">
                Delete
              </button>
            </td>
          ` : ""}
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

    // Table Row Actions: + Stock, Edit, Delete
    container.addEventListener("click", async (e) => {
      const stockBtn = e.target.closest(".btn-stock-action");
      if (stockBtn) {
        const id = stockBtn.dataset.id;
        const med = self.medicinesList.find(m => String(m.id) === String(id));
        if (med) {
          if (!(await MedHub.api.requireEditSecurityAuth(`Add stock for ${med.name}`))) return;
          self.openAddStockModal(med);
        }
        return;
      }

      const editBtn = e.target.closest(".btn-edit-action");
      if (editBtn) {
        const id = editBtn.dataset.id;
        const med = self.medicinesList.find(m => String(m.id) === String(id));
        if (med) {
          if (!(await MedHub.api.requireEditSecurityAuth(`Edit ${med.name}`))) return;
          self.openEditMedicineModal(med);
        }
        return;
      }

      const deleteBtn = e.target.closest(".btn-delete-action");
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const med = self.medicinesList.find(m => String(m.id) === String(id));
        if (med) {
          if (!(await MedHub.api.requireEditSecurityAuth(`Delete ${med.name}`))) return;
          if (await MedHub.confirm(`Kya aap '${med.name}' ko catalog se delete karna chahte hain?`)) {
            const ok = await MedHub.api.deleteMedicine(id);
            if (ok) {
              MedHub.toast(`'${med.name}' delete ho gaya`, "success");
              self.medicinesList = await MedHub.api.getMedicines();
              self.updateStatsAndTable();
            } else {
              MedHub.toast("Delete karne me samasya aayi", "error");
            }
          }
        }
        return;
      }
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

    // Open Add Medicine Modal (allowed directly even when Edit Lock is active)
    container.querySelector("#btn-open-add-modal")?.addEventListener("click", () => {
      self.openAddMedicineModal();
    });

    // Unlock / Lock Edit Options Toggle
    container.querySelector("#btn-unlock-edit-mode")?.addEventListener("click", async () => {
      const ok = await MedHub.api.promptUnlockEditMode("Medicines & Stock Edit Options");
      if (ok) self.render(container);
    });

    container.querySelector("#btn-lock-edit-mode")?.addEventListener("click", () => {
      MedHub.api.lockEditSession();
      MedHub.toast("Edit options are now hidden and locked.", "info");
      self.render(container);
    });
  },

  updateTableOnly() {
    const tbody = document.getElementById("inventory-tbody");
    if (tbody) tbody.innerHTML = this.renderTableRows();
  },

  updateStatsAndTable() {
    // 1. Dynamic recalculation of status for all items (Low Stock when <= 1 pack)
    this.medicinesList.forEach(m => {
      const qty = Number(m.available_qty) || 0;
      m.status = MedHub.computeStockStatus ? MedHub.computeStockStatus(qty) : (qty <= 0 ? "out" : (qty <= 1 ? "low" : "in"));
    });

    const totalSkus = this.medicinesList.length;
    const lowStockCount = this.medicinesList.filter(m => m.status === "low").length;
    const outStockCount = this.medicinesList.filter(m => m.status === "out").length;
    const totalUnits = Number(this.medicinesList.reduce((sum, m) => sum + (Number(m.available_qty) || 0), 0).toFixed(2));
    const catCount = (MedHub.state.categories && MedHub.state.categories.length) || 16;

    // 2. Real-Time Update of Top KPI Cards
    const elSkus = document.getElementById("inv-kpi-skus");
    if (elSkus) elSkus.innerText = totalSkus;

    const elUnits = document.getElementById("inv-kpi-units");
    if (elUnits) elUnits.innerText = `${totalUnits} total units in stock`;

    const elLow = document.getElementById("inv-kpi-low");
    if (elLow) elLow.innerText = lowStockCount;

    const elOut = document.getElementById("inv-kpi-out");
    if (elOut) elOut.innerText = outStockCount;

    const elCats = document.getElementById("inv-kpi-cats");
    if (elCats) elCats.innerText = catCount;

    // Fallback query selector for stats cards
    const statCards = document.querySelectorAll(".inventory-page-wrap .stat-card");
    if (statCards.length >= 4) {
      const v0 = statCards[0].querySelector(".stat-value");
      const n0 = statCards[0].querySelector(".stat-note");
      if (v0) v0.innerText = totalSkus;
      if (n0) n0.innerText = `${totalUnits} total units in stock`;

      const v1 = statCards[1].querySelector(".stat-value");
      if (v1) v1.innerText = lowStockCount;

      const v2 = statCards[2].querySelector(".stat-value");
      if (v2) v2.innerText = outStockCount;

      const v3 = statCards[3].querySelector(".stat-value");
      if (v3) v3.innerText = catCount;
    }

    // 3. Real-Time Update of Tab Pills (All, Low Stock, Out of Stock)
    const tabAll = document.getElementById("inv-tab-all") || document.querySelector('.tab-pill[data-tab="all"]');
    const tabLow = document.getElementById("inv-tab-low") || document.querySelector('.tab-pill[data-tab="low"]');
    const tabOut = document.getElementById("inv-tab-out") || document.querySelector('.tab-pill[data-tab="out"]');
    if (tabAll) tabAll.innerText = `All (${totalSkus})`;
    if (tabLow) tabLow.innerText = `Low Stock (${lowStockCount})`;
    if (tabOut) tabOut.innerText = `Out of Stock (${outStockCount})`;

    // 4. Real-Time Update of Table Rows
    const tbody = document.getElementById("inventory-tbody");
    if (tbody) tbody.innerHTML = this.renderTableRows();

    // 5. Broadcast global event so POS billing and dashboard reflect changes immediately
    window.dispatchEvent(new CustomEvent("medhub:stock_updated", {
      detail: { totalSkus, totalUnits, lowStockCount, outStockCount }
    }));
  },

  async exportFormalStockPdf() {
    const apiStore = await MedHub.api.getStoreSettings();
    const store = MedHub.resolveActiveStore ? MedHub.resolveActiveStore(apiStore) : { ...MedHub.defaultStore, ...MedHub.state.store, ...apiStore };
    const lic = MedHub.formatStoreLicenses ? MedHub.formatStoreLicenses(store) : { gstin: store.gstin || "", dl20: store.dl_no_20b || store.drug_license_no || "", dl21: store.dl_no_21b || "" };
    const list = this.getFilteredMedicines();

    const totalUnits = list.reduce((sum, m) => sum + (Number(m.available_qty) || 0), 0);
    const totalValuation = list.reduce((sum, m) => sum + ((Number(m.available_qty) || 0) * (Number(m.selling_rate) || Number(m.mrp) || 0)), 0);

    let reportWrap = document.getElementById("temp-inventory-pdf-wrap");
    if (!reportWrap) {
      reportWrap = document.createElement("div");
      reportWrap.id = "temp-inventory-pdf-wrap";
      reportWrap.style.cssText = "position: absolute; left: 0; top: 0; width: 1040px; pointer-events: none; z-index: -1;";
      document.body.appendChild(reportWrap);
    }

    reportWrap.innerHTML = `
      <div id="formal-inventory-report-sheet" class="invoice-sheet" style="padding: 24px; background: #ffffff;">
        <!-- FORMAL MEDICAL STORE HEADER (PROPER DETAILS IN HEADER) -->
        <div class="invoice-formal-header">
          <div class="formal-header-top">
            <div class="formal-store-info">
              <h1 class="formal-store-name">${store.store_name || "MEDICAL STORE"}</h1>
              <p class="formal-store-tagline">${store.tagline || "Retail & Wholesale Chemists"}</p>
              <p class="formal-store-address">
                ${store.address || ""}${store.city ? `, ${store.city}` : ""}${store.state ? `, ${store.state}` : ""}${store.pincode ? ` - ${store.pincode}` : ""}
              </p>
              <p class="formal-store-contact">
                <span><strong>Phone:</strong> ${store.phone || "—"}</span>
                ${store.upi_id ? `<span> | <strong>UPI:</strong> ${store.upi_id}</span>` : ""}
              </p>
            </div>
            <div class="formal-header-badge-box">
              <span class="formal-tax-badge">STOCK INVENTORY REPORT</span>
              <span class="formal-sub-badge">FORMAL AUDIT STATEMENT</span>
            </div>
          </div>

          <div class="formal-regulatory-bar">
            ${lic.gstin ? `<div class="reg-item"><strong>GSTIN:</strong> ${lic.gstin}</div>` : ""}
            ${lic.dl20 ? `<div class="reg-item"><strong>D.L. No. (20B):</strong> ${lic.dl20}</div>` : ""}
            ${lic.dl21 ? `<div class="reg-item"><strong>D.L. No. (21B):</strong> ${lic.dl21}</div>` : ""}
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
    try { reportWrap.remove(); } catch (e) {}
  },

  // Reusable helper to bind inline quick-add (+ Add) controls for Company, Category, Drug Schedule
  _bindQuickAddControl({ btnId, wrapId, inputId, saveBtnId, cancelBtnId, selectId, createFn, labelName }) {
    const btn = document.getElementById(btnId);
    const wrap = document.getElementById(wrapId);
    const input = document.getElementById(inputId);
    const saveBtn = document.getElementById(saveBtnId);
    const cancelBtn = document.getElementById(cancelBtnId);
    const select = document.getElementById(selectId);

    const hideWrap = () => {
      if (wrap) wrap.style.display = "none";
      if (input) input.value = "";
    };

    btn?.addEventListener("click", () => {
      if (!wrap) return;
      const isHidden = wrap.style.display === "none" || !wrap.style.display;
      wrap.style.display = isHidden ? "flex" : "none";
      if (isHidden) {
        input?.focus();
      }
    });

    cancelBtn?.addEventListener("click", hideWrap);

    const commit = async () => {
      const val = (input?.value || "").trim();
      if (!val) {
        MedHub.toast(`Kripya ${labelName} ka naam darj karein`, "warning");
        input?.focus();
        return;
      }
      if (saveBtn) saveBtn.disabled = true;
      const created = await createFn(val);
      if (saveBtn) saveBtn.disabled = false;

      const finalName = created?.name || val;
      if (select) {
        let existingOpt = Array.from(select.options).find(o => o.value.toLowerCase() === finalName.toLowerCase());
        if (!existingOpt) {
          existingOpt = document.createElement("option");
          existingOpt.value = finalName;
          existingOpt.textContent = finalName;
          select.appendChild(existingOpt);
        }
        select.value = existingOpt.value;
      }
      hideWrap();
      MedHub.toast(`${labelName} "${finalName}" add aur select ho gaya!`, "success");
    };

    saveBtn?.addEventListener("click", commit);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        commit();
      } else if (e.key === "Escape") {
        hideWrap();
      }
    });
  },

  // ==========================================================================
  // EXACT MODAL DIALOG MATCHING IMAGE 2: "Add New Medicine to Catalog"
  // ==========================================================================
  async openAddMedicineModal(options = {}) {
    const modalWrap = options.wrapEl || document.getElementById("add-medicine-modal-wrap");
    if (!modalWrap) return;

    const [categoriesList, companiesList, schedulesList] = await Promise.all([
      MedHub.api.getCategories(),
      MedHub.api.getCompanies ? MedHub.api.getCompanies() : (MedHub.state.companies || []),
      MedHub.api.getDrugSchedules ? MedHub.api.getDrugSchedules() : (MedHub.state.drugSchedules || [])
    ]);

    modalWrap.innerHTML = `
      <div class="modal-overlay" ${options.overlayZIndex ? `style="z-index: ${options.overlayZIndex};"` : ""}>
        <div class="modal-box medicine-modal-dialog">
          <!-- MODAL HEADER -->
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Add New Medicine to Catalog</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-med-modal">${MedHub.icons.close}</button>
          </div>

          <!-- MODAL BODY FORM -->
          <form id="add-medicine-form" class="modal-dialog-body">
            <!-- ROW 1: Medicine Name & Company (with + Add Company) -->
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Medicine Name <span class="req">*</span></label>
                <input type="text" id="m-name" class="input-field" placeholder="e.g. Dolo 650 Tablet" required />
              </div>
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Company / Manufacturer <span class="req">*</span></label>
                  <button type="button" class="btn-cat-mini" id="btn-add-company" title="Add new pharma company">+ Add Company</button>
                </div>
                <select id="m-company" class="input-field select-field" required>
                  <option value="">Select Company / Manufacturer</option>
                  ${(companiesList || []).map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
                </select>
                <div id="inline-add-company-wrap" class="inline-quick-add" style="display: none; gap: 6px; margin-top: 6px; align-items: center;">
                  <input type="text" id="inline-new-company-input" class="input-field" placeholder="New company (e.g. Mankind Pharma)" style="flex: 1;" />
                  <button type="button" class="btn-primary-sm" id="btn-save-inline-company">Save</button>
                  <button type="button" class="btn-outline-sm" id="btn-cancel-inline-company">✕</button>
                </div>
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

            <!-- ROW 3: Category, Drug Schedule (+ Add), Pack Size, Barcode -->
            <div class="form-row-medicine-specs" style="margin-top: 14px;">
              <!-- Category -->
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Category</label>
                  <button type="button" class="btn-cat-mini" id="btn-add-cat" title="Add new category">+ Add</button>
                </div>
                <select id="m-category" class="input-field select-field">
                  <option value="">Select Category</option>
                  ${(categoriesList || []).map(c => `<option value="${c.name}">${c.name}</option>`).join("")}
                </select>
                <div id="inline-add-cat-wrap" class="inline-quick-add" style="display: none; gap: 4px; margin-top: 6px; align-items: center;">
                  <input type="text" id="inline-new-cat-input" class="input-field" placeholder="New category..." style="flex: 1;" />
                  <button type="button" class="btn-primary-sm" id="btn-save-inline-cat">Save</button>
                  <button type="button" class="btn-outline-sm" id="btn-cancel-inline-cat">✕</button>
                </div>
              </div>

              <!-- Drug Schedule (with + Add Schedule) -->
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Drug Schedule</label>
                  <button type="button" class="btn-cat-mini" id="btn-add-schedule" title="Add new drug schedule">+ Add</button>
                </div>
                <select id="m-schedule" class="input-field select-field">
                  ${(schedulesList || []).map(s => `<option value="${s.name}">${s.name}</option>`).join("")}
                </select>
                <div id="inline-add-schedule-wrap" class="inline-quick-add" style="display: none; gap: 4px; margin-top: 6px; align-items: center;">
                  <input type="text" id="inline-new-schedule-input" class="input-field" placeholder="e.g. Schedule H2" style="flex: 1;" />
                  <button type="button" class="btn-primary-sm" id="btn-save-inline-schedule">Save</button>
                  <button type="button" class="btn-outline-sm" id="btn-cancel-inline-schedule">✕</button>
                </div>
              </div>

              <!-- Pack Size ("X" is always between for pack) -->
              <div class="form-group">
                <label class="form-label">Pack Size</label>
                <div class="pack-size-duo-wrap">
                  <input type="number" id="m-pack-strip" min="1" placeholder="1" value="1" title="Pack / Strips count" />
                  <span class="pack-size-x-badge">×</span>
                  <input type="text" id="m-pack-unit" placeholder="10" value="10" title="Units / Tablets per pack" />
                </div>
                <div id="m-pack-units-hint" style="font-size:11px; color:#1d4ed8; font-weight:700; margin-top:4px;">1 Pack = 10 Tablets/Units</div>
              </div>

              <!-- Barcode -->
              <div class="form-group">
                <label class="form-label">Barcode</label>
                <input type="text" id="m-barcode" class="input-field" placeholder="Scan or enter code" />
              </div>
            </div>

            <!-- ROW 3B: Purchase Price, MRP & GST Rate -->
            <div class="form-row-3" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Purchase Price (₹)</label>
                <input type="number" step="0.01" min="0" id="m-purchase-price" class="input-field" placeholder="e.g. 24.50" />
              </div>
              <div class="form-group">
                <label class="form-label">MRP (₹) <span class="req">*</span></label>
                <input type="number" step="0.01" min="0" id="m-mrp" class="input-field" placeholder="e.g. 35.00" required />
              </div>
              <div class="form-group">
                <label class="form-label">GST Rate (%)</label>
                <select id="m-gst" class="input-field select-field">
                  <option value="12" selected>12%</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>

            <!-- SUB-CARD: OPTIONAL INITIAL BATCH & STOCK (PACK & TABLET) -->
            <div class="modal-subcard-batch" style="margin-top: 16px;">
              <h4 class="subcard-title">Initial Batch, Expiry &amp; Add Stock</h4>
              <div class="form-row-3" style="margin-top: 10px;">
                <div class="form-group">
                  <label class="form-label">Batch Number</label>
                  <input type="text" id="m-batch-no" class="input-field" placeholder="e.g. B-998" />
                </div>
                <div class="form-group">
                  <label class="form-label">Expiry (Month &amp; Year only)</label>
                  ${MedHub.renderMonthYearPicker("m-exp", "")}
                </div>
                <div class="form-group">
                  <label class="form-label">Add Stock (Pack &amp; Tablet)</label>
                  <div class="stock-pack-tab-grid">
                    <div class="stock-unit-box">
                      <input type="number" id="m-quantity" class="input-field" min="0" step="1" placeholder="0" />
                      <span class="stock-unit-tag">Pack</span>
                    </div>
                    <div class="stock-unit-box">
                      <input type="number" id="m-quantity-tabs" class="input-field" min="0" step="1" placeholder="0" />
                      <span class="stock-unit-tag" id="m-stock-unit-tag">Tablet</span>
                    </div>
                  </div>
                  <div id="m-stock-total-hint" class="stock-total-hint">0 packs = 0 tablets</div>
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

    // Quick-Add bindings for Company, Category & Drug Schedule
    this._bindQuickAddControl({
      btnId: "btn-add-company",
      wrapId: "inline-add-company-wrap",
      inputId: "inline-new-company-input",
      saveBtnId: "btn-save-inline-company",
      cancelBtnId: "btn-cancel-inline-company",
      selectId: "m-company",
      createFn: (val) => MedHub.api.createCompany(val),
      labelName: "Company"
    });

    this._bindQuickAddControl({
      btnId: "btn-add-cat",
      wrapId: "inline-add-cat-wrap",
      inputId: "inline-new-cat-input",
      saveBtnId: "btn-save-inline-cat",
      cancelBtnId: "btn-cancel-inline-cat",
      selectId: "m-category",
      createFn: (val) => MedHub.api.createCategory(val),
      labelName: "Category"
    });

    this._bindQuickAddControl({
      btnId: "btn-add-schedule",
      wrapId: "inline-add-schedule-wrap",
      inputId: "inline-new-schedule-input",
      saveBtnId: "btn-save-inline-schedule",
      cancelBtnId: "btn-cancel-inline-schedule",
      selectId: "m-schedule",
      createFn: (val) => MedHub.api.createDrugSchedule(val),
      labelName: "Drug Schedule"
    });

    const updateAddStockHint = () => {
      const sVal = document.getElementById("m-pack-strip")?.value.trim() || "1";
      const uVal = document.getElementById("m-pack-unit")?.value.trim() || "10";
      const catVal = document.getElementById("m-category")?.value || "";
      const nameVal = document.getElementById("m-name")?.value || "";
      const pVal = document.getElementById("m-quantity")?.value;
      const tVal = document.getElementById("m-quantity-tabs")?.value;
      const calc = this.computeStockPacksAndUnits(pVal, tVal, `${sVal}x${uVal}`);
      const lbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(catVal, nameVal) : { singular: "tab", plural: "tabs" };
      const unitWord = lbl.singular === "btl" ? "Bottle" : (lbl.singular === "cap" ? "Capsule" : "Tablet");
      const tagEl = document.getElementById("m-stock-unit-tag");
      if (tagEl) tagEl.innerText = unitWord;
      const hintEl = document.getElementById("m-stock-total-hint");
      if (hintEl) {
        hintEl.innerText = `${calc.totalPacks} pack${calc.totalPacks === 1 ? "" : "s"} = ${calc.totalTablets} ${calc.totalTablets === 1 ? lbl.singular : lbl.plural}`;
      }
    };

    const updateAddPackHint = () => {
      const sVal = document.getElementById("m-pack-strip")?.value.trim() || "1";
      const uVal = document.getElementById("m-pack-unit")?.value.trim() || "10";
      const catVal = document.getElementById("m-category")?.value || "";
      const nameVal = document.getElementById("m-name")?.value || "";
      const info = MedHub.parsePackSize ? MedHub.parsePackSize(`${sVal}x${uVal}`) : { unitsPerPack: 10 };
      const lbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(catVal, nameVal) : { modalUnit: "Tablets/Units" };
      const el = document.getElementById("m-pack-units-hint");
      if (el) el.innerText = `1 Pack = ${info.unitsPerPack} ${lbl.modalUnit}`;
      updateAddStockHint();
    };
    document.getElementById("m-pack-strip")?.addEventListener("input", updateAddPackHint);
    document.getElementById("m-pack-unit")?.addEventListener("input", updateAddPackHint);
    document.getElementById("m-quantity")?.addEventListener("input", updateAddStockHint);
    document.getElementById("m-quantity-tabs")?.addEventListener("input", updateAddStockHint);

    let categoryManualOverride = false;
    const catSelectEl = document.getElementById("m-category");
    catSelectEl?.addEventListener("change", () => {
      categoryManualOverride = Boolean(catSelectEl.value);
      updateAddPackHint();
    });

    document.getElementById("m-name")?.addEventListener("input", (e) => {
      if (categoryManualOverride || !MedHub.inferMedicineCategory) return;
      const inferred = MedHub.inferMedicineCategory(e.target.value, categoriesList);
      if (inferred && catSelectEl) {
        let opt = Array.from(catSelectEl.options).find(o => o.value.toLowerCase() === inferred.toLowerCase());
        if (!opt) {
          opt = document.createElement("option");
          opt.value = inferred;
          opt.textContent = inferred;
          catSelectEl.appendChild(opt);
        }
        catSelectEl.value = opt.value;
      }
      updateAddPackHint();
    });

    // Form Submit: Save Medicine
    const form = document.getElementById("add-medicine-form");
    if (form && MedHub.enableEnterNavigation) {
      MedHub.enableEnterNavigation(form, { focusSubmitOnLast: true, autoFocusFirst: true });
    }
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("m-name").value.trim();
      const company = document.getElementById("m-company").value.trim();
      const generic_name = document.getElementById("m-generic").value.trim();
      const salt_composition = document.getElementById("m-salt").value.trim();
      const category = document.getElementById("m-category").value || (MedHub.inferMedicineCategory ? MedHub.inferMedicineCategory(name, categoriesList) : "") || "Tablet";
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

      // Initial batch & dual stock inputs (Packs + Tablets)
      const batch_no = document.getElementById("m-batch-no")?.value.trim() || "";
      const expiry_date = MedHub.readMonthYearValue("m-exp");
      const qtyPackVal = document.getElementById("m-quantity")?.value;
      const qtyTabsVal = document.getElementById("m-quantity-tabs")?.value;
      const stockCalc = this.computeStockPacksAndUnits(qtyPackVal, qtyTabsVal, pack_size);
      const quantityNum = stockCalc.totalPacks;

      let initialBatch = null;
      if (batch_no || quantityNum > 0) {
        initialBatch = {
          batch_no: batch_no || ("BT-" + Date.now().toString().slice(-4)),
          expiry_date: expiry_date || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
          quantity: quantityNum
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
        // Refresh inventory table & KPI stats if on inventory page, and fire callback
        this.medicinesList = await MedHub.api.getMedicines();
        if (document.getElementById("inventory-tbody")) {
          this.updateStatsAndTable();
        }
        if (typeof options.onSaved === "function") {
          options.onSaved(saved);
        }
      } else {
        MedHub.toast("Medicine save karne me dikkat aayi", "error");
        saveBtn.disabled = false;
        saveBtn.innerText = "Save Medicine";
      }
    });
  },

  // ==========================================================================
  // ADD NEW STOCK BATCH (Batch No & Expiry Month/Year Only)
  // ==========================================================================
  openAddStockModal(med) {
    let modalWrap = document.getElementById("add-medicine-modal-wrap");
    if (!modalWrap) return;

    const unitLbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(med) : { singular: "tab", plural: "tabs" };
    const unitTagText = unitLbl.singular === "btl" ? "Bottle" : (unitLbl.singular === "cap" ? "Capsule" : "Tablet");
    const basePackCalc = this.computeStockPacksAndUnits(1, 0, med.pack_size || "1x10");

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 560px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">+ Add New Stock / Inward</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-stock-modal">${MedHub.icons.close}</button>
          </div>
          <form id="add-stock-form" class="modal-dialog-body" style="padding: 20px;">
            <div style="background: #f0f7ff; padding: 12px 14px; border-radius: 6px; border: 1.5px solid #bfdbfe; margin-bottom: 16px;">
              <strong style="color: #1e40af; font-size: 14.5px;">${med.name}</strong>
              <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                ${med.company || "Manufacturer"} • Pack: ${med.pack_size || "1x10"} • Current Stock: <strong style="color: #1d4ed8;">${Number((Number(med.available_qty) || 0).toFixed(2))} packs</strong>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Batch Number <span class="req">*</span></label>
              <input type="text" id="stock-batch-no" class="input-field" placeholder="e.g. BT-2026" required autofocus />
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Expiry (Month & Year only) <span class="req">*</span></label>
              ${MedHub.renderMonthYearPicker("stock-exp", "2027-11", { required: true })}
            </div>

            <div class="form-row-3" style="margin-bottom: 16px;">
              <div class="form-group">
                <label class="form-label">Add Stock (Pack &amp; ${unitTagText}) <span class="req">*</span></label>
                <div class="stock-pack-tab-grid">
                  <div class="stock-unit-box">
                    <input type="number" id="stock-qty" class="input-field" min="0" step="1" placeholder="0" />
                    <span class="stock-unit-tag">Pack</span>
                  </div>
                  <div class="stock-unit-box">
                    <input type="number" id="stock-qty-tabs" class="input-field" min="0" step="1" placeholder="0" />
                    <span class="stock-unit-tag">${unitTagText}</span>
                  </div>
                </div>
                <div id="stock-total-hint" class="stock-total-hint">1 pack = ${basePackCalc.unitsPerPack} ${unitLbl.plural}</div>
              </div>
              <div class="form-group">
                <label class="form-label">Purchase Rate (₹)</label>
                <input type="number" step="0.01" min="0" id="stock-pur-rate" class="input-field" placeholder="25.00" value="${med.purchase_price || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">MRP (₹)</label>
                <input type="number" step="0.01" min="0" id="stock-mrp" class="input-field" placeholder="35.00" value="${Number(med.mrp) > 0 ? Number(med.mrp) : (med.selling_rate || '')}" />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 10px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-stock-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" id="btn-save-stock">Add Stock</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeStockModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-stock-modal")?.addEventListener("click", closeStockModal);
    document.getElementById("btn-cancel-stock-modal")?.addEventListener("click", closeStockModal);

    const updateModalStockHint = () => {
      const calc = this.computeStockPacksAndUnits(
        document.getElementById("stock-qty")?.value,
        document.getElementById("stock-qty-tabs")?.value,
        med.pack_size || "1x10"
      );
      const hintEl = document.getElementById("stock-total-hint");
      if (hintEl) {
        hintEl.innerText = calc.totalPacks > 0
          ? `${calc.totalPacks} pack${calc.totalPacks === 1 ? "" : "s"} = ${calc.totalTablets} ${calc.totalTablets === 1 ? unitLbl.singular : unitLbl.plural}`
          : `1 pack = ${basePackCalc.unitsPerPack} ${unitLbl.plural}`;
      }
    };
    document.getElementById("stock-qty")?.addEventListener("input", updateModalStockHint);
    document.getElementById("stock-qty-tabs")?.addEventListener("input", updateModalStockHint);

    const form = document.getElementById("add-stock-form");
    if (form && MedHub.enableEnterNavigation) {
      MedHub.enableEnterNavigation(form, { focusSubmitOnLast: true, autoFocusFirst: true });
    }
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const batch_no = document.getElementById("stock-batch-no").value.trim();
      const expiry_date = MedHub.readMonthYearValue("stock-exp");
      const stockCalc = this.computeStockPacksAndUnits(
        document.getElementById("stock-qty")?.value,
        document.getElementById("stock-qty-tabs")?.value,
        med.pack_size || "1x10"
      );
      const qty = stockCalc.totalPacks;
      const pur_rate = parseFloat(document.getElementById("stock-pur-rate").value) || med.purchase_price || 0;
      const mrpVal = parseFloat(document.getElementById("stock-mrp")?.value) || Number(med.mrp) || Number(med.selling_rate) || 0;

      if (!batch_no || !expiry_date || qty <= 0) {
        MedHub.toast("Please enter Batch Number, Expiry, and Pack or Tablet stock quantity", "warning");
        return;
      }

      const saveBtn = document.getElementById("btn-save-stock");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = "Adding...";
      }

      const ok = await MedHub.api.addStockBatch(med.id, {
        batch_no,
        expiry_date,
        quantity: qty,
        purchase_price: pur_rate,
        mrp: mrpVal,
        selling_price: mrpVal
      });

      if (ok) {
        MedHub.toast(`Added ${stockCalc.totalPacks} pack(s) (${stockCalc.totalTablets} ${unitLbl.plural}) to ${med.name}!`, "success");
        closeStockModal();
        this.medicinesList = await MedHub.api.getMedicines();
        this.updateStatsAndTable();
      } else {
        MedHub.toast("Stock add karne me samasya aayi", "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerText = "Add Stock";
        }
      }
    });
  },

  // ==========================================================================
  // EDIT MEDICINE DETAILS MODAL
  // ==========================================================================
  async openEditMedicineModal(med) {
    let modalWrap = document.getElementById("add-medicine-modal-wrap");
    if (!modalWrap) return;

    const [categoriesList, companiesList, schedulesList, batchesList] = await Promise.all([
      MedHub.api.getCategories(),
      MedHub.api.getCompanies ? MedHub.api.getCompanies() : (MedHub.state.companies || []),
      MedHub.api.getDrugSchedules ? MedHub.api.getDrugSchedules() : (MedHub.state.drugSchedules || []),
      MedHub.api.getBatches ? MedHub.api.getBatches(med.id) : []
    ]);
    const primaryBatch = (batchesList && batchesList.length) ? batchesList[0] : null;
    const initBatchNo = primaryBatch?.batch_no || "";
    const initExpiry = primaryBatch?.expiry_date || (med.nearest_expiry && med.nearest_expiry !== "—" ? med.nearest_expiry : "");
    const initQty = primaryBatch ? primaryBatch.quantity : (med.available_qty ?? "");

    const companyNames = (companiesList || []).map(c => c.name);
    if (med.company && !companyNames.some(c => c.toLowerCase() === med.company.toLowerCase())) {
      companyNames.unshift(med.company);
    }

    const scheduleNames = (schedulesList || []).map(s => s.name);
    if (med.drug_schedule && !scheduleNames.some(s => s.toLowerCase() === med.drug_schedule.toLowerCase())) {
      scheduleNames.push(med.drug_schedule);
    }

    const packParts = (med.pack_size || "1 × 10").split(/×|x/i).map(s => s.trim());
    const stripVal = packParts[0] || "1";
    const unitVal = packParts[1] || "10";
    const initSplit = this.splitPacksToPackAndUnits(initQty, `${stripVal}x${unitVal}`);
    const initUnitLbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(med) : { singular: "tab", plural: "tabs", modalUnit: "Tablets/Units" };
    const initUnitTag = initUnitLbl.singular === "btl" ? "Bottle" : (initUnitLbl.singular === "cap" ? "Capsule" : "Tablet");
    const initCalc = this.computeStockPacksAndUnits(initSplit.packs, initSplit.tablets, `${stripVal}x${unitVal}`);

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box medicine-modal-dialog">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Edit Medicine Details</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-edit-modal">${MedHub.icons.close}</button>
          </div>

          <form id="edit-medicine-form" class="modal-dialog-body">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Medicine Name <span class="req">*</span></label>
                <input type="text" id="edit-m-name" class="input-field" value="${med.name || ''}" required />
              </div>
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Company / Manufacturer <span class="req">*</span></label>
                  <button type="button" class="btn-cat-mini" id="btn-edit-add-company" title="Add new company">+ Add Company</button>
                </div>
                <select id="edit-m-company" class="input-field select-field" required>
                  <option value="">Select Company / Manufacturer</option>
                  ${companyNames.map(c => `<option value="${c}" ${(med.company || '').toLowerCase() === c.toLowerCase() ? 'selected' : ''}>${c}</option>`).join("")}
                </select>
                <div id="inline-edit-company-wrap" class="inline-quick-add" style="display: none; gap: 6px; margin-top: 6px; align-items: center;">
                  <input type="text" id="inline-edit-company-input" class="input-field" placeholder="New company..." style="flex: 1;" />
                  <button type="button" class="btn-primary-sm" id="btn-save-edit-inline-company">Save</button>
                  <button type="button" class="btn-outline-sm" id="btn-cancel-edit-inline-company">✕</button>
                </div>
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Generic Name</label>
                <input type="text" id="edit-m-generic" class="input-field" value="${med.generic_name || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Salt Composition</label>
                <input type="text" id="edit-m-salt" class="input-field" value="${med.salt_composition || ''}" />
              </div>
            </div>

            <div class="form-row-medicine-specs" style="margin-top: 14px;">
              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Category</label>
                  <button type="button" class="btn-cat-mini" id="btn-edit-add-cat" title="Add new category">+ Add</button>
                </div>
                <select id="edit-m-category" class="input-field select-field">
                  ${(categoriesList || []).map(c => `<option value="${c.name}" ${med.category === c.name ? 'selected' : ''}>${c.name}</option>`).join("")}
                </select>
                <div id="inline-edit-cat-wrap" class="inline-quick-add" style="display: none; gap: 4px; margin-top: 6px; align-items: center;">
                  <input type="text" id="inline-edit-cat-input" class="input-field" placeholder="New category..." style="flex: 1;" />
                  <button type="button" class="btn-primary-sm" id="btn-save-edit-inline-cat">Save</button>
                  <button type="button" class="btn-outline-sm" id="btn-cancel-edit-inline-cat">✕</button>
                </div>
              </div>

              <div class="form-group">
                <div class="label-flex">
                  <label class="form-label">Drug Schedule</label>
                  <button type="button" class="btn-cat-mini" id="btn-edit-add-schedule" title="Add new drug schedule">+ Add</button>
                </div>
                <select id="edit-m-schedule" class="input-field select-field">
                  ${scheduleNames.map(s => `<option value="${s}" ${(med.drug_schedule || 'General (OTC / Non-Rx)') === s ? 'selected' : ''}>${s}</option>`).join("")}
                </select>
                <div id="inline-edit-schedule-wrap" class="inline-quick-add" style="display: none; gap: 4px; margin-top: 6px; align-items: center;">
                  <input type="text" id="inline-edit-schedule-input" class="input-field" placeholder="New schedule..." style="flex: 1;" />
                  <button type="button" class="btn-primary-sm" id="btn-save-edit-inline-schedule">Save</button>
                  <button type="button" class="btn-outline-sm" id="btn-cancel-edit-inline-schedule">✕</button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Pack Size</label>
                <div class="pack-size-duo-wrap">
                  <input type="number" id="edit-m-pack-strip" min="1" value="${stripVal}" />
                  <span class="pack-size-x-badge">×</span>
                  <input type="text" id="edit-m-pack-unit" value="${unitVal}" />
                </div>
                <div id="edit-m-pack-units-hint" style="font-size:11px; color:#1d4ed8; font-weight:700; margin-top:4px;">
                  1 Pack = ${(MedHub.parsePackSize ? MedHub.parsePackSize(`${stripVal}x${unitVal}`).unitsPerPack : 10)} Tablets/Units
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Barcode</label>
                <input type="text" id="edit-m-barcode" class="input-field" value="${med.barcode || ''}" />
              </div>
            </div>

            <div class="form-row-3" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Purchase Price (₹)</label>
                <input type="number" step="0.01" min="0" id="edit-m-purchase-price" class="input-field" value="${med.purchase_price || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">MRP (₹) <span class="req">*</span></label>
                <input type="number" step="0.01" min="0" id="edit-m-mrp" class="input-field" value="${Number(med.mrp) > 0 ? Number(med.mrp) : (med.selling_rate || '')}" required />
              </div>
              <div class="form-group">
                <label class="form-label">GST Rate (%)</label>
                <select id="edit-m-gst" class="input-field select-field">
                  <option value="12" ${Number(med.gst_percent) === 12 ? 'selected' : ''}>12%</option>
                  <option value="0" ${Number(med.gst_percent) === 0 ? 'selected' : ''}>0%</option>
                  <option value="5" ${Number(med.gst_percent) === 5 ? 'selected' : ''}>5%</option>
                  <option value="18" ${Number(med.gst_percent) === 18 ? 'selected' : ''}>18%</option>
                  <option value="28" ${Number(med.gst_percent) === 28 ? 'selected' : ''}>28%</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label">Rack / Shelf Location</label>
              <input type="text" id="edit-m-rack" class="input-field" value="${med.rack_location || ''}" placeholder="e.g. Shelf A-02" />
            </div>

            <!-- EDIT EXPIRY (MONTH & YEAR) & BATCH STOCK -->
            <div class="modal-subcard-batch" style="margin-top: 16px;">
              <h4 class="subcard-title">Edit Batch Expiry (Month & Year) & Stock</h4>
              <div class="form-row-3" style="margin-top: 10px;">
                <div class="form-group">
                  <label class="form-label">Batch Number</label>
                  <input type="text" id="edit-m-batch-no" class="input-field" value="${initBatchNo}" placeholder="e.g. BT-01" />
                </div>
                <div class="form-group">
                  <label class="form-label">Expiry (Month & Year only)</label>
                  ${MedHub.renderMonthYearPicker("edit-m-exp", initExpiry)}
                </div>
                <div class="form-group">
                  <label class="form-label">Stock Quantity (Pack &amp; ${initUnitTag})</label>
                  <div class="stock-pack-tab-grid">
                    <div class="stock-unit-box">
                      <input type="number" id="edit-m-qty" class="input-field" min="0" step="1" value="${initSplit.packs}" placeholder="0" />
                      <span class="stock-unit-tag">Pack</span>
                    </div>
                    <div class="stock-unit-box">
                      <input type="number" id="edit-m-qty-tabs" class="input-field" min="0" step="1" value="${initSplit.tablets}" placeholder="0" />
                      <span class="stock-unit-tag" id="edit-m-stock-unit-tag">${initUnitTag}</span>
                    </div>
                  </div>
                  <div id="edit-m-stock-total-hint" class="stock-total-hint">${initCalc.totalPacks} pack${initCalc.totalPacks === 1 ? "" : "s"} = ${initCalc.totalTablets} ${initCalc.totalTablets === 1 ? initUnitLbl.singular : initUnitLbl.plural}</div>
                </div>
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 24px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-edit-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" id="btn-save-edit-medicine">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeEditModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-edit-modal")?.addEventListener("click", closeEditModal);
    document.getElementById("btn-cancel-edit-modal")?.addEventListener("click", closeEditModal);

    // Quick-Add bindings for Edit modal
    this._bindQuickAddControl({
      btnId: "btn-edit-add-company",
      wrapId: "inline-edit-company-wrap",
      inputId: "inline-edit-company-input",
      saveBtnId: "btn-save-edit-inline-company",
      cancelBtnId: "btn-cancel-edit-inline-company",
      selectId: "edit-m-company",
      createFn: (val) => MedHub.api.createCompany(val),
      labelName: "Company"
    });

    this._bindQuickAddControl({
      btnId: "btn-edit-add-cat",
      wrapId: "inline-edit-cat-wrap",
      inputId: "inline-edit-cat-input",
      saveBtnId: "btn-save-edit-inline-cat",
      cancelBtnId: "btn-cancel-edit-inline-cat",
      selectId: "edit-m-category",
      createFn: (val) => MedHub.api.createCategory(val),
      labelName: "Category"
    });

    this._bindQuickAddControl({
      btnId: "btn-edit-add-schedule",
      wrapId: "inline-edit-schedule-wrap",
      inputId: "inline-edit-schedule-input",
      saveBtnId: "btn-save-edit-inline-schedule",
      cancelBtnId: "btn-cancel-edit-inline-schedule",
      selectId: "edit-m-schedule",
      createFn: (val) => MedHub.api.createDrugSchedule(val),
      labelName: "Drug Schedule"
    });

    const updateEditStockHint = () => {
      const sVal = document.getElementById("edit-m-pack-strip")?.value.trim() || "1";
      const uVal = document.getElementById("edit-m-pack-unit")?.value.trim() || "10";
      const catVal = document.getElementById("edit-m-category")?.value || med.category || "";
      const nameVal = document.getElementById("edit-m-name")?.value || med.name || "";
      const pVal = document.getElementById("edit-m-qty")?.value;
      const tVal = document.getElementById("edit-m-qty-tabs")?.value;
      const calc = this.computeStockPacksAndUnits(pVal, tVal, `${sVal}x${uVal}`);
      const lbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(catVal, nameVal) : { singular: "tab", plural: "tabs" };
      const unitWord = lbl.singular === "btl" ? "Bottle" : (lbl.singular === "cap" ? "Capsule" : "Tablet");
      const tagEl = document.getElementById("edit-m-stock-unit-tag");
      if (tagEl) tagEl.innerText = unitWord;
      const hintEl = document.getElementById("edit-m-stock-total-hint");
      if (hintEl) {
        hintEl.innerText = `${calc.totalPacks} pack${calc.totalPacks === 1 ? "" : "s"} = ${calc.totalTablets} ${calc.totalTablets === 1 ? lbl.singular : lbl.plural}`;
      }
    };

    const updateEditPackHint = () => {
      const sVal = document.getElementById("edit-m-pack-strip")?.value.trim() || "1";
      const uVal = document.getElementById("edit-m-pack-unit")?.value.trim() || "10";
      const catVal = document.getElementById("edit-m-category")?.value || med.category || "";
      const nameVal = document.getElementById("edit-m-name")?.value || med.name || "";
      const info = MedHub.parsePackSize ? MedHub.parsePackSize(`${sVal}x${uVal}`) : { unitsPerPack: 10 };
      const lbl = MedHub.getUnitLabels ? MedHub.getUnitLabels(catVal, nameVal) : { modalUnit: "Tablets/Units" };
      const el = document.getElementById("edit-m-pack-units-hint");
      if (el) el.innerText = `1 Pack = ${info.unitsPerPack} ${lbl.modalUnit}`;
      updateEditStockHint();
    };
    document.getElementById("edit-m-pack-strip")?.addEventListener("input", updateEditPackHint);
    document.getElementById("edit-m-pack-unit")?.addEventListener("input", updateEditPackHint);
    document.getElementById("edit-m-category")?.addEventListener("change", updateEditPackHint);
    document.getElementById("edit-m-name")?.addEventListener("input", updateEditPackHint);
    document.getElementById("edit-m-qty")?.addEventListener("input", updateEditStockHint);
    document.getElementById("edit-m-qty-tabs")?.addEventListener("input", updateEditStockHint);

    const form = document.getElementById("edit-medicine-form");
    if (form && MedHub.enableEnterNavigation) {
      MedHub.enableEnterNavigation(form, { focusSubmitOnLast: true });
    }
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("edit-m-name").value.trim();
      const company = document.getElementById("edit-m-company").value.trim();
      const generic_name = document.getElementById("edit-m-generic").value.trim();
      const salt_composition = document.getElementById("edit-m-salt").value.trim();
      const category = document.getElementById("edit-m-category").value;
      const drug_schedule = document.getElementById("edit-m-schedule").value;
      const stripV = document.getElementById("edit-m-pack-strip").value.trim() || "1";
      const unitV = document.getElementById("edit-m-pack-unit").value.trim() || "10";
      const pack_size = `${stripV} × ${unitV}`;
      const barcode = document.getElementById("edit-m-barcode").value.trim();
      const purchase_price = parseFloat(document.getElementById("edit-m-purchase-price").value) || 0;
      const mrp = parseFloat(document.getElementById("edit-m-mrp")?.value) || Number(med.mrp) || Number(med.selling_rate) || purchase_price;
      const gst_percent = parseInt(document.getElementById("edit-m-gst").value, 10) || 12;
      const rack_location = document.getElementById("edit-m-rack").value.trim();

      const saveBtn = document.getElementById("btn-save-edit-medicine");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = "Saving...";
      }

      const updated = await MedHub.api.updateMedicine(med.id, {
        name,
        company,
        generic_name,
        salt_composition,
        category,
        drug_schedule,
        pack_size,
        barcode,
        purchase_price,
        mrp,
        selling_rate: mrp,
        gst_percent,
        rack_location
      });

      const editBatchNo = document.getElementById("edit-m-batch-no")?.value.trim();
      const editExpiry = MedHub.readMonthYearValue("edit-m-exp");
      const editQtyPackRaw = document.getElementById("edit-m-qty")?.value;
      const editQtyTabsRaw = document.getElementById("edit-m-qty-tabs")?.value;
      const hasQty = (editQtyPackRaw !== undefined && editQtyPackRaw !== "") || (editQtyTabsRaw !== undefined && editQtyTabsRaw !== "");
      const editStockCalc = this.computeStockPacksAndUnits(editQtyPackRaw, editQtyTabsRaw, pack_size);
      if (MedHub.api.updateMedicineBatch && (editExpiry || hasQty || (editBatchNo && primaryBatch))) {
        await MedHub.api.updateMedicineBatch(primaryBatch ? primaryBatch.id : null, med.id, {
          batch_no: editBatchNo || initBatchNo || "BT-01",
          expiry_date: editExpiry || initExpiry || undefined,
          quantity: hasQty ? editStockCalc.totalPacks : undefined,
          purchase_price,
          selling_price: mrp || med.selling_rate || med.mrp || purchase_price
        });
      }

      if (updated) {
        MedHub.toast(`'${name}' updated successfully!`, "success");
        closeEditModal();
        this.medicinesList = await MedHub.api.getMedicines();
        this.updateStatsAndTable();
      } else {
        MedHub.toast("Medicine update karne me samasya aayi", "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerText = "Save Changes";
        }
      }
    });
  }
};
