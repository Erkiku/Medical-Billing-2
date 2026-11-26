// ============================================================================
// MedEduHub - Developer / Master Admin Control Center (js/admin.js)
// Real-time Store Login Tracking (Kitne baje login kiya, kitne store login hai)
// Real-time Stock Details Monitor (Live medicines & batches across stores)
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.admin = {
  activeView: "logins", // "logins" | "stock"
  storesList: [],
  stocksList: [],
  filterStatus: "all",
  searchQuery: "",
  stockSearchQuery: "",
  stockFilter: "all", // "all" | "in" | "low" | "out"

  async render(container, forceView) {
    if (forceView) this.activeView = forceView;

    // Fetch live stores and live stock batches in parallel from Supabase
    const [stores, stocks] = await Promise.all([
      MedHub.api.getAllStores(),
      MedHub.api.getAllStockBatches ? MedHub.api.getAllStockBatches() : []
    ]);

    this.storesList = stores || [];
    this.stocksList = stocks || [];

    const totalStores = this.storesList.length;
    // Active/Logged in stores: stores with last_login_at in past 24 hours or marked active with a login
    const loggedInStores = this.storesList.filter(s => s.last_login_at).length;
    const activeStores = this.storesList.filter(s => s.status !== "suspended").length;
    const suspendedStores = this.storesList.filter(s => s.status === "suspended").length;

    // Stock stats
    const totalStockQty = this.stocksList.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const lowStockCount = this.stocksList.filter(b => b.quantity > 0 && b.quantity <= 15).length;
    const outOfStockCount = this.stocksList.filter(b => b.quantity <= 0).length;

    container.innerHTML = `
      <div class="admin-page-wrap">
        <!-- DEVELOPER CONSOLE HEADER -->
        <div class="page-header-flex">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">🛡️</span>
              <div>
                <h2 class="page-title" style="margin: 0;">Developer & Platform Governance Console</h2>
                <p class="page-subtitle" style="margin-top: 2px;">
                  Real-time live monitoring of store login activity, active sessions & multi-store stock inventory
                </p>
              </div>
            </div>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-outline" id="btn-admin-refresh">
              🔄 Real-time Refresh
            </button>
            <button type="button" class="btn-outline" id="btn-admin-change-pass">
              🔑 Security Settings
            </button>
            <button type="button" class="btn-primary" id="btn-admin-add-store" style="background: #2563eb !important;">
              ${MedHub.icons.plus} + Provision New Store
            </button>
          </div>
        </div>

        <!-- REAL-TIME KPI STATS CARDS -->
        <div class="stats-grid" style="margin-top: 18px;">
          <div class="stat-card">
            <span class="stat-label">Live Logged-in Stores</span>
            <span class="stat-value" id="kpi-logged-stores" style="color: #059669;">
              🟢 ${loggedInStores}
            </span>
            <span class="stat-note">Stores with recorded login activity</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Registered Stores</span>
            <span class="stat-value" id="kpi-total-stores">${totalStores}</span>
            <span class="stat-note">${activeStores} active · ${suspendedStores} suspended</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Medicine Stock Units</span>
            <span class="stat-value" style="color: #2563eb;">${totalStockQty.toLocaleString()}</span>
            <span class="stat-note">Across ${this.stocksList.length} live batches</span>
          </div>
          <div class="stat-card ${lowStockCount + outOfStockCount > 0 ? 'stat-out' : ''}">
            <span class="stat-label">Stock Reorder Alerts</span>
            <span class="stat-value" style="color: #dc2626;">${lowStockCount + outOfStockCount}</span>
            <span class="stat-note">${lowStockCount} low · ${outOfStockCount} out of stock</span>
          </div>
        </div>

        <!-- TOP CONSOLE TABS SWITCHER -->
        <div class="login-portal-switcher" style="display: flex; max-width: 520px; background: rgba(0, 0, 0, 0.06); border: 1.5px solid var(--cream-border); border-radius: 30px; padding: 4px; margin-top: 22px;">
          <button type="button" class="portal-switch-btn ${this.activeView === 'logins' ? 'active' : ''}" id="tab-view-logins" style="flex: 1; padding: 10px 16px; border-radius: 25px; border: none; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; ${this.activeView === 'logins' ? 'background: #2563eb; color: #ffffff; box-shadow: 0 2px 8px rgba(37,99,235,0.3);' : 'background: transparent; color: #475569;'}">
            🕒 Stores & Login Monitor (${totalStores})
          </button>
          <button type="button" class="portal-switch-btn ${this.activeView === 'stock' ? 'active' : ''}" id="tab-view-stock" style="flex: 1; padding: 10px 16px; border-radius: 25px; border: none; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; ${this.activeView === 'stock' ? 'background: #2563eb; color: #ffffff; box-shadow: 0 2px 8px rgba(37,99,235,0.3);' : 'background: transparent; color: #475569;'}">
            📦 Real-time Stock Monitor (${this.stocksList.length})
          </button>
        </div>

        <!-- VIEW CONTAINER -->
        <div id="admin-view-content" style="margin-top: 16px;">
          ${this.activeView === 'logins' ? this.renderLoginsView() : this.renderStockView()}
        </div>
      </div>

      <!-- MODALS CONTAINER -->
      <div id="admin-modal-wrap"></div>
    `;

    this.bindEvents(container);
  },

  // --------------------------------------------------------------------------
  // VIEW 1: STORES & REAL-TIME LOGIN MONITOR
  // --------------------------------------------------------------------------
  renderLoginsView() {
    const list = this.getFilteredStores();

    return `
      <!-- FILTER & SEARCH BAR -->
      <div class="card filter-bar-card">
        <div class="filter-bar-flex">
          <div class="tab-pills">
            <button type="button" class="tab-pill ${this.filterStatus === 'all' ? 'active' : ''}" data-status="all">
              All Stores (${this.storesList.length})
            </button>
            <button type="button" class="tab-pill ${this.filterStatus === 'active' ? 'active' : ''}" data-status="active">
              Active / Logged-in (${this.storesList.filter(s => s.status !== 'suspended').length})
            </button>
            <button type="button" class="tab-pill ${this.filterStatus === 'suspended' ? 'active' : ''}" data-status="suspended">
              Suspended (${this.storesList.filter(s => s.status === 'suspended').length})
            </button>
          </div>

          <div class="filter-inputs">
            <div class="search-input-wrap-sm" style="min-width: 320px;">
              <span class="search-icon">${MedHub.icons.search}</span>
              <input type="text" id="admin-store-search" placeholder="Search store name, username, pharmacist, phone..." value="${this.searchQuery}" />
            </div>
          </div>
        </div>
      </div>

      <!-- STORES & LOGINS TABLE -->
      <div class="card table-card" style="margin-top: 14px;">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 36px;">#</th>
                <th>Store Name & Location</th>
                <th>Pharmacist In-Charge & Email</th>
                <th>Login Username</th>
                <th>🕒 Exact Login Time (Kitne baje login kiya)</th>
                <th>Contact Phone</th>
                <th>Status</th>
                <th style="width: 200px; text-align: center;">Controls</th>
              </tr>
            </thead>
            <tbody id="admin-stores-tbody">
              ${this.renderStoreTableRows(list)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderStoreTableRows(list) {
    if (!list.length) {
      return `<tr><td colspan="8" class="table-empty">Koi store nahi mila. Naya store add karne ke liye "+ Provision New Store" par click karein.</td></tr>`;
    }

    return list.map((s, idx) => {
      const isSuspended = s.status === "suspended";
      const statusBadge = isSuspended
        ? `<span class="badge-status status-out" style="font-weight: 800;">SUSPENDED</span>`
        : `<span class="badge-status status-in" style="font-weight: 800;">ACTIVE</span>`;

      // Format exact login time with 12-hour AM/PM and relative badge
      let loginDisplay = `<span style="color: #94a3b8; font-size: 12px; font-weight: 600;">⚪ Never logged in</span>`;
      if (s.last_login_at) {
        const loginDate = new Date(s.last_login_at);
        const timeFormatted = loginDate.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

        // Relative time helper
        const elapsedMins = Math.floor((Date.now() - loginDate.getTime()) / 60000);
        let relativeTag = "Recently";
        if (elapsedMins < 5) relativeTag = "🟢 Just now";
        else if (elapsedMins < 60) relativeTag = `${elapsedMins}m ago`;
        else if (elapsedMins < 1440) relativeTag = `${Math.floor(elapsedMins / 60)}h ago`;
        else relativeTag = `${Math.floor(elapsedMins / 1440)}d ago`;

        loginDisplay = `
          <div>
            <div style="font-weight: 800; font-size: 13.5px; color: #047857;">
              🟢 ${timeFormatted}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              <span class="badge-cat" style="padding: 1px 6px; font-size: 10.5px;">${relativeTag}</span>
              ${s.last_login_user ? `<span style="margin-left: 4px;">User: <strong>${s.last_login_user}</strong></span>` : ''}
            </div>
          </div>
        `;
      }

      return `
        <tr data-id="${s.id || s.user_email}">
          <td class="cell-nowrap">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; font-size: 14.5px; color: #1e3a8a;">
              ${s.store_name || "Pharmacy Store"}
            </div>
            <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
              ${s.address || "Main Road"} ${s.city ? `· ${s.city}` : ''}
            </div>
          </td>
          <td>
            <strong>${s.pharmacist_name || "Pharmacist Admin"}</strong>
            <div style="font-size: 11.5px; color: #64748b;">${s.user_email || "store@mededuhub.com"}</div>
          </td>
          <td>
            <span class="badge-cat" style="font-family: monospace; font-size: 12px; font-weight: 700;">
              👤 ${s.username || (s.user_email ? s.user_email.split('@')[0] : 'admin')}
            </span>
          </td>
          <td>${loginDisplay}</td>
          <td class="cell-nowrap">${s.phone || "—"}</td>
          <td class="cell-nowrap">${statusBadge}</td>
          <td class="cell-nowrap table-actions-cell" style="justify-content: center;">
            <button type="button" class="btn-action-stock btn-status-store" data-email="${s.user_email}" data-status="${isSuspended ? 'active' : 'suspended'}" title="${isSuspended ? 'Activate Store' : 'Suspend Store'}" style="${isSuspended ? 'color: #16a34a; background: #dcfce7;' : 'color: #ea580c; background: #ffedd5;'}">
              ${isSuspended ? '✅ Activate' : '🔒 Suspend'}
            </button>
            <button type="button" class="btn-outline-sm btn-reset-pass" data-user="${s.username || s.user_email}" title="Reset Password" style="font-size: 11px;">
              🔑 Pass
            </button>
            <button type="button" class="btn-action-edit btn-edit-store" data-email="${s.user_email}" title="Edit Store Details">
              ✏️
            </button>
            <button type="button" class="btn-action-delete btn-delete-store" data-email="${s.user_email}" title="Delete Store">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  // --------------------------------------------------------------------------
  // VIEW 2: REAL-TIME STOCK DETAILS MONITOR ACROSS STORES
  // --------------------------------------------------------------------------
  renderStockView() {
    const list = this.getFilteredStocks();

    return `
      <!-- FILTER & SEARCH BAR -->
      <div class="card filter-bar-card">
        <div class="filter-bar-flex">
          <div class="tab-pills">
            <button type="button" class="tab-pill ${this.stockFilter === 'all' ? 'active' : ''}" data-stock-filter="all">
              All Items (${this.stocksList.length})
            </button>
            <button type="button" class="tab-pill ${this.stockFilter === 'in' ? 'active' : ''}" data-stock-filter="in">
              In Stock (${this.stocksList.filter(b => b.quantity > 15).length})
            </button>
            <button type="button" class="tab-pill ${this.stockFilter === 'low' ? 'active' : ''}" data-stock-filter="low">
              Low Stock (${this.stocksList.filter(b => b.quantity > 0 && b.quantity <= 15).length})
            </button>
            <button type="button" class="tab-pill ${this.stockFilter === 'out' ? 'active' : ''}" data-stock-filter="out">
              Out of Stock (${this.stocksList.filter(b => b.quantity <= 0).length})
            </button>
          </div>

          <div class="filter-inputs">
            <div class="search-input-wrap-sm" style="min-width: 340px;">
              <span class="search-icon">${MedHub.icons.search}</span>
              <input type="text" id="admin-stock-search" placeholder="Search medicine, salt, manufacturer, batch no..." value="${this.stockSearchQuery}" />
            </div>
          </div>
        </div>
      </div>

      <!-- LIVE STOCK DETAILS TABLE -->
      <div class="card table-card" style="margin-top: 14px;">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 36px;">#</th>
                <th>Medicine Name & Salt Composition</th>
                <th>Manufacturer / Company</th>
                <th>Category & Pack</th>
                <th>Batch No.</th>
                <th>Expiry (MM/YY)</th>
                <th>MRP (₹)</th>
                <th>Selling Price (₹)</th>
                <th style="text-align: center;">Live Available Stock</th>
                <th>Status</th>
                <th style="width: 120px; text-align: center;">Action</th>
              </tr>
            </thead>
            <tbody id="admin-stock-tbody">
              ${this.renderStockTableRows(list)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderStockTableRows(list) {
    if (!list.length) {
      return `<tr><td colspan="11" class="table-empty">Koi stock match nahi hua. Search query check karein.</td></tr>`;
    }

    return list.map((b, idx) => {
      const qty = Number(b.quantity) || 0;
      let statusBadge = `<span class="badge-status status-in">In Stock</span>`;
      let qtyColor = "#15803d";
      if (qty <= 0) {
        statusBadge = `<span class="badge-status status-out">Out of Stock</span>`;
        qtyColor = "#b91c1c";
      } else if (qty <= 15) {
        statusBadge = `<span class="badge-status status-low">Low Stock</span>`;
        qtyColor = "#b45309";
      }

      // Expiry formatted as MM/YY
      let expDisplay = "—";
      if (b.expiry_date) {
        const parts = b.expiry_date.split("-");
        if (parts.length >= 2) {
          const year = parts[0].slice(-2);
          const month = parts[1];
          expDisplay = `${month}/${year}`;
        }
      }

      return `
        <tr data-batch-id="${b.id}">
          <td class="cell-nowrap">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; font-size: 14px; color: #09090b;">
              ${b.medicine_name || "Medicine"}
            </div>
            <div style="font-size: 11.5px; color: #64748b;">
              ${b.salt_composition || b.generic_name || "Standard Formulation"}
            </div>
          </td>
          <td>${b.company || "Standard Pharma"}</td>
          <td>
            <span class="badge-cat">${b.category || "Tablet"}</span>
            <span style="font-size: 11px; color: #64748b; margin-left: 3px;">${b.pack_size || "1x10"}</span>
          </td>
          <td>
            <span class="badge-code" style="font-family: monospace; font-weight: 700;">${b.batch_no || "BT-DEFAULT"}</span>
          </td>
          <td class="cell-nowrap" style="font-weight: 700; color: #1d4ed8;">
            📅 ${expDisplay}
          </td>
          <td class="cell-nowrap" style="font-weight: 700;">₹${Number(b.mrp || b.selling_price || 0).toFixed(2)}</td>
          <td class="cell-nowrap" style="font-weight: 700; color: #16a34a;">₹${Number(b.selling_price || b.mrp || 0).toFixed(2)}</td>
          <td class="cell-nowrap" style="text-align: center;">
            <span style="font-size: 16px; font-weight: 900; color: ${qtyColor}; padding: 3px 10px; background: #f8fafc; border-radius: 6px; border: 1.5px solid var(--cream-border);">
              ${qty}
            </span>
          </td>
          <td class="cell-nowrap">${statusBadge}</td>
          <td class="cell-nowrap" style="text-align: center;">
            <button type="button" class="btn-action-edit btn-edit-batch-stock" data-batch-id="${b.id}" data-med-name="${b.medicine_name}" data-batch-no="${b.batch_no}" data-qty="${qty}" title="Real-time Stock Edit">
              ✏️ Edit Stock
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  getFilteredStores() {
    let list = this.storesList;
    if (this.filterStatus === "active") {
      list = list.filter(s => s.status !== "suspended");
    } else if (this.filterStatus === "suspended") {
      list = list.filter(s => s.status === "suspended");
    }
    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(s =>
        (s.store_name && s.store_name.toLowerCase().includes(q)) ||
        (s.pharmacist_name && s.pharmacist_name.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        (s.user_email && s.user_email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q))
      );
    }
    return list;
  },

  getFilteredStocks() {
    let list = this.stocksList;
    if (this.stockFilter === "in") {
      list = list.filter(b => b.quantity > 15);
    } else if (this.stockFilter === "low") {
      list = list.filter(b => b.quantity > 0 && b.quantity <= 15);
    } else if (this.stockFilter === "out") {
      list = list.filter(b => b.quantity <= 0);
    }

    if (this.stockSearchQuery && this.stockSearchQuery.trim().length > 0) {
      const q = this.stockSearchQuery.trim().toLowerCase();
      list = list.filter(b =>
        (b.medicine_name && b.medicine_name.toLowerCase().includes(q)) ||
        (b.salt_composition && b.salt_composition.toLowerCase().includes(q)) ||
        (b.generic_name && b.generic_name.toLowerCase().includes(q)) ||
        (b.company && b.company.toLowerCase().includes(q)) ||
        (b.batch_no && b.batch_no.toLowerCase().includes(q))
      );
    }
    return list;
  },

  bindEvents(container) {
    const self = this;

    // View Switcher: Logins vs Stock
    container.querySelector("#tab-view-logins")?.addEventListener("click", () => {
      self.activeView = "logins";
      self.render(container);
    });
    container.querySelector("#tab-view-stock")?.addEventListener("click", () => {
      self.activeView = "stock";
      self.render(container);
    });

    // Refresh Button (Real-time reload from Supabase)
    container.querySelector("#btn-admin-refresh")?.addEventListener("click", async () => {
      MedHub.toast("Refreshing real-time store logins and stock from Supabase...", "info");
      await self.render(container);
      MedHub.toast("Live Supabase data refreshed successfully!", "success");
    });

    // Security & Provisioning buttons
    container.querySelector("#btn-admin-change-pass")?.addEventListener("click", () => {
      self.openChangeMasterPasswordModal();
    });
    container.querySelector("#btn-admin-add-store")?.addEventListener("click", () => {
      self.openAddStoreModal();
    });

    // VIEW 1: STORES TAB EVENTS
    if (this.activeView === "logins") {
      const searchInput = container.querySelector("#admin-store-search");
      searchInput?.addEventListener("input", (e) => {
        self.searchQuery = e.target.value;
        const tbody = container.querySelector("#admin-stores-tbody");
        if (tbody) tbody.innerHTML = self.renderStoreTableRows(self.getFilteredStores());
      });

      const tabPills = container.querySelectorAll(".tab-pill");
      tabPills.forEach(pill => {
        pill.addEventListener("click", () => {
          tabPills.forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          self.filterStatus = pill.dataset.status;
          const tbody = container.querySelector("#admin-stores-tbody");
          if (tbody) tbody.innerHTML = self.renderStoreTableRows(self.getFilteredStores());
        });
      });

      container.querySelector("#admin-stores-tbody")?.addEventListener("click", async (e) => {
        const statusBtn = e.target.closest(".btn-status-store");
        if (statusBtn) {
          const email = statusBtn.dataset.email;
          const newStatus = statusBtn.dataset.status;
          await MedHub.api.setStoreStatus(email, newStatus);
          const st = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
          if (st) st.status = newStatus;
          self.render(container);
          MedHub.toast(`Store marked as ${newStatus.toUpperCase()}`, "success");
          return;
        }

        const passBtn = e.target.closest(".btn-reset-pass");
        if (passBtn) {
          const username = passBtn.dataset.user;
          self.openResetPasswordModal(username);
          return;
        }

        const editBtn = e.target.closest(".btn-edit-store");
        if (editBtn) {
          const email = editBtn.dataset.email;
          const store = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
          if (store) self.openEditStoreModal(store);
          return;
        }

        const delBtn = e.target.closest(".btn-delete-store");
        if (delBtn) {
          const email = delBtn.dataset.email;
          const store = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
          if (store && await MedHub.confirm(`Are you sure you want to permanently delete store "${store.store_name}"?`)) {
            await MedHub.api.deleteStore(email);
            self.storesList = self.storesList.filter(s => s.user_email?.toLowerCase() !== email?.toLowerCase());
            self.render(container);
            MedHub.toast(`Store deleted.`, "info");
          }
          return;
        }
      });
    }

    // VIEW 2: STOCK TAB EVENTS
    if (this.activeView === "stock") {
      const stockSearch = container.querySelector("#admin-stock-search");
      stockSearch?.addEventListener("input", (e) => {
        self.stockSearchQuery = e.target.value;
        const tbody = container.querySelector("#admin-stock-tbody");
        if (tbody) tbody.innerHTML = self.renderStockTableRows(self.getFilteredStocks());
      });

      const stockTabs = container.querySelectorAll("[data-stock-filter]");
      stockTabs.forEach(pill => {
        pill.addEventListener("click", () => {
          stockTabs.forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
          self.stockFilter = pill.dataset.stockFilter;
          const tbody = container.querySelector("#admin-stock-tbody");
          if (tbody) tbody.innerHTML = self.renderStockTableRows(self.getFilteredStocks());
        });
      });

      // Quick Stock Edit Handler
      container.querySelector("#admin-stock-tbody")?.addEventListener("click", (e) => {
        const editStockBtn = e.target.closest(".btn-edit-batch-stock");
        if (editStockBtn) {
          const batchId = editStockBtn.dataset.batchId;
          const medName = editStockBtn.dataset.medName;
          const batchNo = editStockBtn.dataset.batchNo;
          const currentQty = editStockBtn.dataset.qty;
          self.openEditStockModal(batchId, medName, batchNo, currentQty);
        }
      });
    }
  },

  // --------------------------------------------------------------------------
  // MODAL: REAL-TIME STOCK EDIT
  // --------------------------------------------------------------------------
  openEditStockModal(batchId, medName, batchNo, currentQty) {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;
    const self = this;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 440px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">✏️ Update Medicine Stock</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-stock-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-stock-edit-form" class="modal-dialog-body" style="padding: 20px;">
            <div style="background: #f8fafc; border: 1px solid var(--cream-border); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
              <div style="font-weight: 800; font-size: 15px; color: #09090b;">${medName}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Batch: <strong>${batchNo}</strong></div>
            </div>

            <div class="form-group">
              <label class="form-label">Available Stock Quantity (Units) <span class="req">*</span></label>
              <input type="number" id="edit-stock-qty" class="input-field" value="${currentQty}" min="0" required autofocus style="font-size: 18px; font-weight: 800; text-align: center;" />
            </div>

            <div class="modal-dialog-footer" style="margin-top: 20px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-stock-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #2563eb !important;">Save to Supabase 🚀</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-stock-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-stock-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-stock-edit-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newQty = Number(document.getElementById("edit-stock-qty").value) || 0;
      await MedHub.api.updateStockBatch(batchId, newQty);

      // Update in local state
      const b = self.stocksList.find(x => String(x.id) === String(batchId));
      if (b) b.quantity = newQty;

      closeModal();
      MedHub.toast(`Stock for "${medName}" (${batchNo}) updated to ${newQty} in Supabase!`, "success");
      const contentContainer = document.getElementById("page-content");
      if (contentContainer) self.render(contentContainer);
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: PROVISION NEW MEDICAL STORE
  // --------------------------------------------------------------------------
  openAddStoreModal() {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;
    const self = this;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 680px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">+ Provision New Medical Store</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-admin-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-add-store-form" class="modal-dialog-body" style="padding: 20px;">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Medical Store Name <span class="req">*</span></label>
                <input type="text" id="adm-store-name" class="input-field" placeholder="e.g. Apollo Chemist" required />
              </div>
              <div class="form-group">
                <label class="form-label">Pharmacist In-Charge Name <span class="req">*</span></label>
                <input type="text" id="adm-pharm-name" class="input-field" placeholder="Dr. / Pharmacist Name" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Store Username / Login ID <span class="req">*</span></label>
                <input type="text" id="adm-username" class="input-field" placeholder="e.g. apollocare" required />
              </div>
              <div class="form-group">
                <label class="form-label">Store Login Password <span class="req">*</span></label>
                <input type="password" id="adm-password" class="input-field" placeholder="Initial store password" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Store Phone / Mobile <span class="req">*</span></label>
                <input type="tel" id="adm-phone" class="input-field" placeholder="10-digit mobile" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Email</label>
                <input type="email" id="adm-email" class="input-field" placeholder="store@mededuhub.com" />
              </div>
            </div>

            <div class="form-row-3" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">GSTIN (15 Digits)</label>
                <input type="text" id="adm-gstin" class="input-field" placeholder="27ABCDE1234F1Z5" maxlength="15" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (20B) <span class="req">*</span></label>
                <input type="text" id="adm-dl20" class="input-field" placeholder="MH-20-DL-12345" required />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (21B)</label>
                <input type="text" id="adm-dl21" class="input-field" placeholder="DL-21B-654321" />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Store Address & City</label>
                <input type="text" id="adm-address" class="input-field" placeholder="Shop 4, Market Road, City" />
              </div>
              <div class="form-group">
                <label class="form-label">Store UPI ID</label>
                <input type="text" id="adm-upi" class="input-field" placeholder="store@okaxis" />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 22px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-admin-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #2563eb !important;">Create & Authorize Store 🚀</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-admin-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-admin-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-add-store-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const storeName = document.getElementById("adm-store-name").value.trim();
      const pharmacistName = document.getElementById("adm-pharm-name").value.trim();
      const username = document.getElementById("adm-username").value.trim().toLowerCase();
      const password = document.getElementById("adm-password").value.trim();
      const phone = document.getElementById("adm-phone").value.trim();
      const email = document.getElementById("adm-email").value.trim().toLowerCase() || `${username}@mededuhub.com`;
      const gstin = document.getElementById("adm-gstin").value.trim().toUpperCase();
      const dl20 = document.getElementById("adm-dl20").value.trim();
      const dl21 = document.getElementById("adm-dl21").value.trim();
      const address = document.getElementById("adm-address").value.trim();
      const upi = document.getElementById("adm-upi").value.trim();

      const storePayload = {
        store_name: storeName,
        pharmacist_name: pharmacistName,
        user_email: email,
        phone,
        address,
        gstin,
        dl_no_20b: dl20,
        dl_no_21b: dl21,
        drug_license_no: dl20,
        upi_id: upi
      };

      const userCredentials = { username, password };
      await MedHub.api.createStoreAdmin(storePayload, userCredentials);

      closeModal();
      MedHub.toast(`Store "${storeName}" provisioned & synchronized with Supabase!`, "success");
      const contentContainer = document.getElementById("page-content");
      if (contentContainer) self.render(contentContainer);
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: EDIT STORE
  // --------------------------------------------------------------------------
  openEditStoreModal(store) {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;
    const self = this;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 680px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">✏️ Edit Store: ${store.store_name}</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-edit-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-edit-store-form" class="modal-dialog-body" style="padding: 20px;">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Medical Store Name <span class="req">*</span></label>
                <input type="text" id="edit-store-name" class="input-field" value="${store.store_name || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Pharmacist In-Charge Name <span class="req">*</span></label>
                <input type="text" id="edit-pharm-name" class="input-field" value="${store.pharmacist_name || ''}" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Store Phone / Mobile <span class="req">*</span></label>
                <input type="tel" id="edit-phone" class="input-field" value="${store.phone || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Address & City</label>
                <input type="text" id="edit-address" class="input-field" value="${store.address || ''}" />
              </div>
            </div>

            <div class="form-row-3" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">GSTIN (15 Digits)</label>
                <input type="text" id="edit-gstin" class="input-field" value="${store.gstin || ''}" maxlength="15" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (20B)</label>
                <input type="text" id="edit-dl20" class="input-field" value="${store.dl_no_20b || store.drug_license_no || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (21B)</label>
                <input type="text" id="edit-dl21" class="input-field" value="${store.dl_no_21b || ''}" />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 22px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-edit-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #2563eb !important;">Save Changes 💾</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-edit-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-edit-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-edit-store-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updated = {
        store_name: document.getElementById("edit-store-name").value.trim(),
        pharmacist_name: document.getElementById("edit-pharm-name").value.trim(),
        phone: document.getElementById("edit-phone").value.trim(),
        address: document.getElementById("edit-address").value.trim(),
        gstin: document.getElementById("edit-gstin").value.trim().toUpperCase(),
        dl_no_20b: document.getElementById("edit-dl20").value.trim(),
        dl_no_21b: document.getElementById("edit-dl21").value.trim()
      };

      await MedHub.api.updateStoreAdmin(store.user_email || store.id, updated);
      closeModal();
      MedHub.toast(`Store details updated in Supabase!`, "success");
      const contentContainer = document.getElementById("page-content");
      if (contentContainer) self.render(contentContainer);
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: RESET PASSWORD
  // --------------------------------------------------------------------------
  openResetPasswordModal(usernameOrEmail) {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 440px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">🔑 Reset Password: ${usernameOrEmail}</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-pass-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-reset-pass-form" class="modal-dialog-body" style="padding: 20px;">
            <div class="form-group">
              <label class="form-label">New Password <span class="req">*</span></label>
              <input type="password" id="reset-new-password" class="input-field" placeholder="Enter new password" required />
            </div>
            <div class="modal-dialog-footer" style="margin-top: 18px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-pass-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #2563eb !important;">Reset Password</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-pass-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-pass-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-reset-pass-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPass = document.getElementById("reset-new-password").value;
      if (newPass.length < 4) {
        MedHub.toast("Password must be at least 4 characters.", "warning");
        return;
      }
      await MedHub.api.resetStorePassword(usernameOrEmail, newPass);
      closeModal();
      MedHub.toast(`Password for ${usernameOrEmail} successfully updated in Supabase!`, "success");
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: MASTER ADMIN SECURITY
  // --------------------------------------------------------------------------
  openChangeMasterPasswordModal() {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;

    const currentCreds = MedHub.api._getMasterAdminCredentials();

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 460px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">🛡️ Master Developer Security</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-master-modal">${MedHub.icons.close}</button>
          </div>
          <form id="master-security-form" class="modal-dialog-body" style="padding: 20px;">
            <div class="form-group">
              <label class="form-label">Master Admin Username</label>
              <input type="text" id="master-sec-username" class="input-field" value="${currentCreds.username}" required />
            </div>
            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label">Master Admin Password</label>
              <input type="password" id="master-sec-password" class="input-field" value="${currentCreds.password}" required />
            </div>
            <div class="modal-dialog-footer" style="margin-top: 20px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-master-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #2563eb !important;">Save Security Keys</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-master-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-master-modal")?.addEventListener("click", closeModal);

    document.getElementById("master-security-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = document.getElementById("master-sec-username").value.trim();
      const p = document.getElementById("master-sec-password").value.trim();
      if (!u || !p) {
        MedHub.toast("Username and password cannot be empty.", "warning");
        return;
      }
      MedHub.api._saveMasterAdminCredentials({
        ...currentCreds,
        username: u,
        password: p
      });
      closeModal();
      MedHub.toast("Master Admin credentials updated successfully!", "success");
    });
  }
};
