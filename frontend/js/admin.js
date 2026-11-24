// ============================================================================
// MedEduHub - Master / Super Admin Control Center (js/admin.js)
// Centralized multi-store SaaS management, store provisioning,
// license tracking, status control (Active/Suspended), and store access switching.
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.admin = {
  storesList: [],
  filterStatus: "all",
  searchQuery: "",

  async render(container) {
    this.storesList = await MedHub.api.getAllStores();

    const totalStores = this.storesList.length;
    const activeStores = this.storesList.filter(s => s.status !== "suspended").length;
    const suspendedStores = this.storesList.filter(s => s.status === "suspended").length;

    // Estimate platform GMV & bills across active stores
    const platformBills = 104; // aggregated platform baseline
    const platformTurnover = 284500.00;

    container.innerHTML = `
      <div class="admin-page-wrap">
        <!-- HEADER -->
        <div class="page-header-flex">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 22px;">🛡️</span>
              <h2 class="page-title" style="margin: 0;">Master Admin Control Center</h2>
            </div>
            <p class="page-subtitle">Centralized SaaS Pharmacy Store Management, Licenses, Security & Status Governance</p>
          </div>
          <div class="header-action-btns">
            <button type="button" class="btn-outline" id="btn-admin-refresh">
              🔄 Refresh Stores
            </button>
            <button type="button" class="btn-outline" id="btn-admin-change-pass">
              🔑 Master Admin Security
            </button>
            <button type="button" class="btn-primary" id="btn-admin-add-store" style="background: #0f766e !important;">
              ${MedHub.icons.plus} + Provision New Store
            </button>
          </div>
        </div>

        <!-- KPI STATS CARDS -->
        <div class="stats-grid" style="margin-top: 18px;">
          <div class="stat-card">
            <span class="stat-label">Total Stores Managed</span>
            <span class="stat-value" id="kpi-total-stores">${totalStores}</span>
            <span class="stat-note">Multi-Tenant Pharmacy SaaS</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Active Operating Stores</span>
            <span class="stat-value" id="kpi-active-stores" style="color: #16a34a;">${activeStores}</span>
            <span class="stat-note">Authorized for billing & sales</span>
          </div>
          <div class="stat-card ${suspendedStores > 0 ? 'stat-out' : ''}">
            <span class="stat-label">Suspended Stores</span>
            <span class="stat-value" id="kpi-suspended-stores" style="${suspendedStores > 0 ? 'color: #dc2626;' : ''}">${suspendedStores}</span>
            <span class="stat-note">Deactivated / Access Locked</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Platform Invoices</span>
            <span class="stat-value">${platformBills}</span>
            <span class="stat-note">Bills issued across network</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Total Platform Turnover</span>
            <span class="stat-value" style="color: #0f766e;">${MedHub.rupee(platformTurnover)}</span>
            <span class="stat-note">Consolidated Gross Value</span>
          </div>
        </div>

        <!-- FILTER & SEARCH BAR -->
        <div class="card filter-bar-card" style="margin-top: 20px;">
          <div class="filter-bar-flex">
            <!-- Status Tabs -->
            <div class="tab-pills">
              <button type="button" class="tab-pill ${this.filterStatus === 'all' ? 'active' : ''}" data-status="all">
                All Stores (${totalStores})
              </button>
              <button type="button" class="tab-pill ${this.filterStatus === 'active' ? 'active' : ''}" data-status="active">
                Active (${activeStores})
              </button>
              <button type="button" class="tab-pill ${this.filterStatus === 'suspended' ? 'active' : ''}" data-status="suspended">
                Suspended (${suspendedStores})
              </button>
            </div>

            <!-- Search Filter -->
            <div class="filter-inputs">
              <div class="search-input-wrap-sm" style="min-width: 280px;">
                <span class="search-icon">${MedHub.icons.search}</span>
                <input type="text" id="admin-store-search" placeholder="Search by store name, pharmacist, phone, city..." value="${this.searchQuery}" />
              </div>
            </div>
          </div>
        </div>

        <!-- STORES DIRECTORY TABLE -->
        <div class="card table-card" style="margin-top: 16px;">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 36px;">#</th>
                  <th>Store Name & Licenses</th>
                  <th>Pharmacist In-Charge</th>
                  <th>Login Username</th>
                  <th>Contact Phone</th>
                  <th>Location / Address</th>
                  <th>Status</th>
                  <th style="width: 250px; text-align: center;">Store Management Actions</th>
                </tr>
              </thead>
              <tbody id="admin-stores-tbody">
                ${this.renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODALS CONTAINER -->
      <div id="admin-modal-wrap"></div>
    `;

    this.bindEvents(container);
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
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.gstin && s.gstin.toLowerCase().includes(q)) ||
        (s.dl_no_20b && s.dl_no_20b.toLowerCase().includes(q))
      );
    }

    return list;
  },

  renderTableRows() {
    const list = this.getFilteredStores();
    if (!list.length) {
      return `<tr><td colspan="8" class="table-empty">Koi store nahi mila. Naya store add karne ke liye "+ Provision New Store" par click karein.</td></tr>`;
    }

    return list.map((s, idx) => {
      const isSuspended = s.status === "suspended";
      const statusBadge = isSuspended
        ? `<span class="badge-status status-out" style="font-weight: 800;">SUSPENDED</span>`
        : `<span class="badge-status status-in" style="font-weight: 800;">ACTIVE</span>`;

      return `
        <tr data-id="${s.id || s.user_email}">
          <td class="cell-nowrap">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; font-size: 14.5px; color: #1e3a8a;">
              ${s.store_name || "Pharmacy Store"}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${s.gstin ? `<span class="badge-code" style="font-size: 10px;">GSTIN: ${s.gstin}</span>` : ""}
              ${s.dl_no_20b ? `<span style="margin-left: 4px;">DL: ${s.dl_no_20b}</span>` : ""}
            </div>
          </td>
          <td>
            <strong>${s.pharmacist_name || "Pharmacist Admin"}</strong>
            <div style="font-size: 11.5px; color: #64748b;">${s.user_email || "store@mededuhub.com"}</div>
            ${s.last_login_at ? `
              <div style="font-size: 10.5px; color: #059669; margin-top: 2px; font-weight: 600;">
                🟢 Active: ${new Date(s.last_login_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            ` : `
              <div style="font-size: 10.5px; color: #94a3b8; margin-top: 2px;">
                ⚪ Not logged in yet
              </div>
            `}
          </td>
          <td>
            <span class="badge-cat" style="font-family: monospace; font-size: 12px; font-weight: 700;">
              👤 ${s.username || (s.user_email ? s.user_email.split('@')[0] : 'admin')}
            </span>
          </td>
          <td class="cell-nowrap">${s.phone || "—"}</td>
          <td>
            <div style="font-size: 12px; color: #334155; max-width: 200px; white-space: normal;">
              ${s.address || "Main Road"}
            </div>
          </td>
          <td class="cell-nowrap">${statusBadge}</td>
          <td class="cell-nowrap table-actions-cell" style="justify-content: center;">
            <button type="button" class="btn-outline-sm btn-open-store" data-email="${s.user_email}" title="Switch into this store session">
              👁️ Open Store
            </button>
            <button type="button" class="btn-action-edit btn-edit-store" data-email="${s.user_email}" title="Edit Store Details">
              ✏️ Edit
            </button>
            <button type="button" class="btn-action-stock btn-status-store" data-email="${s.user_email}" data-status="${isSuspended ? 'active' : 'suspended'}" title="${isSuspended ? 'Activate Store' : 'Suspend Store'}" style="${isSuspended ? 'color: #16a34a; background: #dcfce7;' : 'color: #ea580c; background: #ffedd5;'}">
              ${isSuspended ? '✅ Activate' : '🔒 Suspend'}
            </button>
            <button type="button" class="btn-outline-sm btn-reset-pass" data-user="${s.username || s.user_email}" title="Reset Password" style="font-size: 11px;">
              🔑 Pass
            </button>
            <button type="button" class="btn-action-delete btn-delete-store" data-email="${s.user_email}" title="Delete Store">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join("");
  },

  updateStatsAndTable() {
    const totalStores = this.storesList.length;
    const activeStores = this.storesList.filter(s => s.status !== "suspended").length;
    const suspendedStores = this.storesList.filter(s => s.status === "suspended").length;

    const elTotal = document.getElementById("kpi-total-stores");
    if (elTotal) elTotal.innerText = totalStores;

    const elActive = document.getElementById("kpi-active-stores");
    if (elActive) elActive.innerText = activeStores;

    const elSuspended = document.getElementById("kpi-suspended-stores");
    if (elSuspended) {
      elSuspended.innerText = suspendedStores;
      elSuspended.style.color = suspendedStores > 0 ? "#dc2626" : "";
    }

    const tbody = document.getElementById("admin-stores-tbody");
    if (tbody) tbody.innerHTML = this.renderTableRows();
  },

  bindEvents(container) {
    const self = this;

    // Refresh button
    container.querySelector("#btn-admin-refresh")?.addEventListener("click", async () => {
      self.storesList = await MedHub.api.getAllStores();
      self.updateStatsAndTable();
      MedHub.toast("Stores directory refreshed!", "info");
    });

    // Add store button
    container.querySelector("#btn-admin-add-store")?.addEventListener("click", () => {
      self.openAddStoreModal();
    });

    // Master security password change button
    container.querySelector("#btn-admin-change-pass")?.addEventListener("click", () => {
      self.openMasterSecurityModal();
    });

    // Status filter tabs
    container.querySelectorAll(".tab-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        container.querySelectorAll(".tab-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        self.filterStatus = pill.dataset.status;
        self.updateStatsAndTable();
      });
    });

    // Search filter input
    const searchInput = container.querySelector("#admin-store-search");
    searchInput?.addEventListener("input", MedHub.debounce((e) => {
      self.searchQuery = e.target.value;
      self.updateStatsAndTable();
    }, 200));

    // Table Actions (Open, Edit, Suspend/Activate, Reset Password, Delete)
    container.addEventListener("click", async (e) => {
      // 1. Open Store (Switch into Store View)
      const openBtn = e.target.closest(".btn-open-store");
      if (openBtn) {
        const email = openBtn.dataset.email;
        const store = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
        if (store) {
          self.loginAsStore(store);
        }
        return;
      }

      // 2. Edit Store
      const editBtn = e.target.closest(".btn-edit-store");
      if (editBtn) {
        const email = editBtn.dataset.email;
        const store = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
        if (store) {
          self.openEditStoreModal(store);
        }
        return;
      }

      // 3. Suspend / Activate Toggle
      const statusBtn = e.target.closest(".btn-status-store");
      if (statusBtn) {
        const email = statusBtn.dataset.email;
        const targetStatus = statusBtn.dataset.status;
        const store = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
        if (store) {
          const actionWord = targetStatus === "suspended" ? "suspend (lock)" : "activate (unlock)";
          if (confirm(`Kya aap '${store.store_name}' ko ${actionWord} karna chahte hain?`)) {
            await MedHub.api.setStoreStatus(email, targetStatus);
            store.status = targetStatus;
            self.updateStatsAndTable();
            MedHub.toast(`Store '${store.store_name}' is now ${targetStatus.toUpperCase()}!`, "success");
          }
        }
        return;
      }

      // 4. Reset Password
      const resetBtn = e.target.closest(".btn-reset-pass");
      if (resetBtn) {
        const username = resetBtn.dataset.user;
        const store = self.storesList.find(s => s.username === username || s.user_email === username);
        if (store) {
          self.openResetPasswordModal(store);
        }
        return;
      }

      // 5. Delete Store
      const delBtn = e.target.closest(".btn-delete-store");
      if (delBtn) {
        const email = delBtn.dataset.email;
        const store = self.storesList.find(s => s.user_email?.toLowerCase() === email?.toLowerCase());
        if (store && confirm(`WARNING: Kya aap store '${store.store_name}' ko permanently delete karna chahte hain?`)) {
          await MedHub.api.deleteStore(email);
          self.storesList = self.storesList.filter(s => s.user_email?.toLowerCase() !== email?.toLowerCase());
          self.updateStatsAndTable();
          MedHub.toast(`Store '${store.store_name}' permanently deleted.`, "info");
        }
        return;
      }
    });
  },

  // --------------------------------------------------------------------------
  // SWITCH INTO STORE (SUPER ADMIN IMPERSONATION / STORE ASSISTANCE)
  // --------------------------------------------------------------------------
  loginAsStore(store) {
    MedHub.state.impersonatedStore = store;
    MedHub.state.store = { ...store };
    MedHub.updateStoreHeader(store);

    // Show floating super admin return banner
    let banner = document.getElementById("superadmin-return-banner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "superadmin-return-banner";
      banner.className = "superadmin-floating-banner";
      document.body.appendChild(banner);
    }

    banner.innerHTML = `
      <div class="superadmin-banner-flex">
        <span>🛡️ <strong>Master Admin Mode:</strong> Viewing <strong>${store.store_name}</strong> (${store.pharmacist_name || store.user_email})</span>
        <button type="button" id="btn-return-to-master-admin" class="btn-return-admin">
          🔙 Return to Master Admin Panel
        </button>
      </div>
    `;

    banner.style.display = "block";
    document.getElementById("btn-return-to-master-admin")?.addEventListener("click", () => {
      MedHub.admin.returnToMasterAdmin();
    });

    MedHub.toast(`Switched view to store: "${store.store_name}"`, "info");
    MedHub.router.navigate("billing");
  },

  returnToMasterAdmin() {
    const banner = document.getElementById("superadmin-return-banner");
    if (banner) banner.style.display = "none";
    MedHub.state.impersonatedStore = null;
    MedHub.router.navigate("admin");
  },

  // --------------------------------------------------------------------------
  // MODAL: PROVISION NEW MEDICAL STORE
  // --------------------------------------------------------------------------
  openAddStoreModal() {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;

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
              <button type="submit" class="btn-dialog-save" style="background: #0f766e !important;">Create & Authorize Store 🚀</button>
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
        upi_id: upi,
        payee_name: storeName
      };

      const created = await MedHub.api.createStoreAdmin(storePayload, { username, password });
      if (created) {
        MedHub.toast(`Store "${storeName}" provisioned with login "${username}"!`, "success");
        closeModal();
        this.storesList = await MedHub.api.getAllStores();
        this.updateStatsAndTable();
      }
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: EDIT EXISTING STORE
  // --------------------------------------------------------------------------
  openEditStoreModal(store) {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 680px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">Edit Store: ${store.store_name}</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-edit-admin-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-edit-store-form" class="modal-dialog-body" style="padding: 20px;">
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">Medical Store Name <span class="req">*</span></label>
                <input type="text" id="edit-adm-store-name" class="input-field" value="${store.store_name || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Pharmacist In-Charge Name <span class="req">*</span></label>
                <input type="text" id="edit-adm-pharm-name" class="input-field" value="${store.pharmacist_name || ''}" required />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Store Phone / Mobile <span class="req">*</span></label>
                <input type="tel" id="edit-adm-phone" class="input-field" value="${store.phone || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Store Status</label>
                <select id="edit-adm-status" class="input-field select-field">
                  <option value="active" ${store.status !== 'suspended' ? 'selected' : ''}>Active (Billing Allowed)</option>
                  <option value="suspended" ${store.status === 'suspended' ? 'selected' : ''}>Suspended (Access Locked)</option>
                </select>
              </div>
            </div>

            <div class="form-row-3" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">GSTIN</label>
                <input type="text" id="edit-adm-gstin" class="input-field" value="${store.gstin || ''}" maxlength="15" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (20B)</label>
                <input type="text" id="edit-adm-dl20" class="input-field" value="${store.dl_no_20b || store.drug_license_no || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Drug License (21B)</label>
                <input type="text" id="edit-adm-dl21" class="input-field" value="${store.dl_no_21b || ''}" />
              </div>
            </div>

            <div class="form-row-2" style="margin-top: 14px;">
              <div class="form-group">
                <label class="form-label">Address & City</label>
                <input type="text" id="edit-adm-address" class="input-field" value="${store.address || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Store UPI ID</label>
                <input type="text" id="edit-adm-upi" class="input-field" value="${store.upi_id || ''}" />
              </div>
            </div>

            <div class="modal-dialog-footer" style="margin-top: 22px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-edit-admin-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save">Save Store Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-edit-admin-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-edit-admin-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-edit-store-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updated = {
        store_name: document.getElementById("edit-adm-store-name").value.trim(),
        pharmacist_name: document.getElementById("edit-adm-pharm-name").value.trim(),
        phone: document.getElementById("edit-adm-phone").value.trim(),
        status: document.getElementById("edit-adm-status").value,
        gstin: document.getElementById("edit-adm-gstin").value.trim().toUpperCase(),
        dl_no_20b: document.getElementById("edit-adm-dl20").value.trim(),
        dl_no_21b: document.getElementById("edit-adm-dl21").value.trim(),
        address: document.getElementById("edit-adm-address").value.trim(),
        upi_id: document.getElementById("edit-adm-upi").value.trim()
      };

      await MedHub.api.updateStoreAdmin(store.user_email, updated);
      await MedHub.api.setStoreStatus(store.user_email, updated.status);
      MedHub.toast(`Store "${updated.store_name}" updated!`, "success");
      closeModal();
      this.storesList = await MedHub.api.getAllStores();
      this.updateStatsAndTable();
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: RESET STORE PASSWORD
  // --------------------------------------------------------------------------
  openResetPasswordModal(store) {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 440px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">🔑 Reset Store Password</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-reset-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-reset-form" class="modal-dialog-body" style="padding: 20px;">
            <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
              <strong style="color: #166534; font-size: 14px;">Store: ${store.store_name}</strong>
              <div style="font-size: 12px; color: #475569; margin-top: 4px;">
                User: <code>${store.username || store.user_email}</code>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">New Password / PIN <span class="req">*</span></label>
              <input type="password" id="adm-new-pass" class="input-field" placeholder="Enter new password" required autofocus />
            </div>

            <div class="modal-dialog-footer" style="margin-top: 20px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-reset-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save">Set New Password</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-reset-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-reset-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-reset-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPass = document.getElementById("adm-new-pass").value.trim();
      if (!newPass) return;
      await MedHub.api.resetStorePassword(store.username || store.user_email, newPass);
      MedHub.toast(`Password for store "${store.store_name}" has been updated!`, "success");
      closeModal();
    });
  },

  // --------------------------------------------------------------------------
  // MODAL: MASTER ADMIN SECURITY CREDENTIALS
  // --------------------------------------------------------------------------
  openMasterSecurityModal() {
    const modalWrap = document.getElementById("admin-modal-wrap");
    if (!modalWrap) return;

    const currentCreds = MedHub.api._getMasterAdminCredentials();

    modalWrap.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width: 480px;">
          <div class="modal-header-dialog">
            <h3 class="modal-dialog-title">🛡️ Master Admin Security Credentials</h3>
            <button type="button" class="btn-dialog-close" id="btn-close-sec-modal">${MedHub.icons.close}</button>
          </div>
          <form id="admin-security-form" class="modal-dialog-body" style="padding: 20px;">
            <div style="background: #fefce8; border: 1.5px solid #fef08a; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #854d0e; margin: 0; line-height: 1.5;">
                In credentials se aap login page ke <strong>"Master Admin Portal"</strong> me login kar sakte hain. Store owners ko ye credentials na dein.
              </p>
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Master Admin Username <span class="req">*</span></label>
              <input type="text" id="sec-username" class="input-field" value="${currentCreds.username}" required />
            </div>

            <div class="form-group" style="margin-bottom: 14px;">
              <label class="form-label">Master Security Password / Key <span class="req">*</span></label>
              <input type="text" id="sec-password" class="input-field" value="${currentCreds.password}" required />
            </div>

            <div class="form-group">
              <label class="form-label">Admin Contact Email</label>
              <input type="email" id="sec-email" class="input-field" value="${currentCreds.email || 'masteradmin@mededuhub.com'}" />
            </div>

            <div class="modal-dialog-footer" style="margin-top: 22px;">
              <button type="button" class="btn-dialog-cancel" id="btn-cancel-sec-modal">Cancel</button>
              <button type="submit" class="btn-dialog-save" style="background: #0f766e !important;">Save Master Credentials</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { modalWrap.innerHTML = ""; };
    document.getElementById("btn-close-sec-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-sec-modal")?.addEventListener("click", closeModal);

    document.getElementById("admin-security-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("sec-username").value.trim().toLowerCase();
      const password = document.getElementById("sec-password").value.trim();
      const email = document.getElementById("sec-email").value.trim();

      MedHub.api._saveMasterAdminCredentials({
        username,
        password,
        email,
        name: "Platform Master Administrator",
        role: "superadmin"
      });

      MedHub.toast("Master Admin credentials updated successfully!", "success");
      closeModal();
    });
  }
};
