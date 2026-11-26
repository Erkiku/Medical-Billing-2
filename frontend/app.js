// ============================================================================
// MedEduHub Medical Billing & Inventory System - Main Application Orchestrator
// Modular Architecture: Loads js/config.js, js/api.js, js/login.js, js/*.js
// Sidebar Navigation redesigned strictly matching Screenshot 3
// Real-time Store Header updates across all pages
// Dedicated Pharmacist Login Portal
// ============================================================================

window.MedHub = window.MedHub || {};

MedHub.menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "billing", label: "POS Billing", icon: "pos" },
  { id: "invoices", label: "Invoices & Bills", icon: "bills" },
  { id: "inventory", label: "Medicines & Stock", icon: "medicines" },
  { id: "purchases", label: "Purchases", icon: "purchases" },
  { id: "ledger", label: "Customers & Ledger", icon: "ledger" },
  { id: "suppliers", label: "Suppliers", icon: "suppliers" },
  { id: "reports", label: "Reports & GST", icon: "reports" },
  { id: "security", label: "Security Lock", icon: "lock" },
  { id: "settings", label: "Store Settings", icon: "settings" }
];

MedHub.getMenuItems = function() {
  const isSuper = (MedHub.state.user && MedHub.state.user.role === "superadmin") || 
                  (localStorage.getItem("medhub_user_role") === "superadmin");
  if (isSuper) {
    // DEVELOPER / ADMIN MENU ONLY: Retail store billing tabs removed as requested!
    return [
      { id: "admin-logins", label: "Stores & Login Monitor", icon: "shield" },
      { id: "admin-stock", label: "Real-time Stock Monitor", icon: "medicines" }
    ];
  }
  return MedHub.menuItems;
};

MedHub.router = {
  currentPage: "billing",

  init() {
    const appEl = document.getElementById("app");
    if (!appEl) return;

    // Check Authentication: If not logged in, show Login Screen
    if (!MedHub.state.isAuthenticated) {
      if (MedHub.login) {
        MedHub.login.render(appEl);
      }
      return;
    }

    const isSuper = (MedHub.state.user && MedHub.state.user.role === "superadmin") || 
                    (localStorage.getItem("medhub_user_role") === "superadmin");
    if (isSuper) {
      if (!this.currentPage || this.currentPage === "billing" || !["admin", "admin-logins", "admin-stock"].includes(this.currentPage)) {
        this.currentPage = "admin-logins";
      }
    }

    const currentMenu = MedHub.getMenuItems();

    appEl.innerHTML = `
      <div class="app-layout">
        <!-- SIDEBAR NAVIGATION (SCREENSHOT 3 EXACT LAYOUT) -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-brand">
            ${MedHub.renderLogo ? MedHub.renderLogo(34) : `
              <span class="brand-logo-icon">💊</span>
              <div class="brand-text-wrap">
                <span class="brand-title">MedEduHub</span>
                <span class="brand-sub">${isSuper ? 'Developer Console' : 'Pharma OS v2.0'}</span>
              </div>
            `}
          </div>

          <nav class="sidebar-nav" id="sidebar-menu">
            ${currentMenu.map(item => `
              <button type="button" class="nav-item ${item.id === this.currentPage ? 'active' : ''}" data-page="${item.id}">
                <span class="nav-icon">${MedHub.icons[item.icon] || ""}</span>
                <span class="nav-label">${item.label}</span>
              </button>
            `).join("")}
          </nav>

          <div class="sidebar-footer">
            <div class="user-profile-badge">
              <div class="user-avatar">${isSuper ? "DEV" : (MedHub.getInitials ? MedHub.getInitials((MedHub.state.store?.pharmacist_name || MedHub.state.user?.name)) : "DA")}</div>
              <div class="user-meta">
                <span class="user-name">${isSuper ? (MedHub.state.user?.name || "Developer Admin") : ((MedHub.state.user?.name && MedHub.state.user.name !== "Dr. Anil Kumar") ? MedHub.state.user.name : (MedHub.state.store?.pharmacist_name || MedHub.state.user?.name || "Dr. Anil Kumar"))}</span>
                <span class="user-role">${isSuper ? 'Platform Developer' : (MedHub.state.user?.role === 'admin' ? 'Pharmacist Admin' : (MedHub.state.user?.role || 'Pharmacist Admin'))}</span>
              </div>
            </div>
            <button type="button" class="btn-sidebar-logout" id="btn-logout" title="Sign Out">
              ${MedHub.icons.logout || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'}
            </button>
          </div>
        </aside>

        <!-- MAIN VIEW AREA -->
        <div class="main-viewport">
          <!-- TOPBAR WITH REAL-TIME STORE BADGE (SCREENSHOT 3) -->
          <header class="topbar">
            <div class="topbar-left">
              <h1 class="topbar-title" id="page-heading">POS Billing</h1>
              <!-- Real-time store header pill (Screenshot 3) -->
              <div class="topbar-store-badge" id="topbar-store-badge"></div>
            </div>
            <div class="topbar-right">
              <div class="topbar-clock" id="topbar-clock"></div>
            </div>
          </header>

          <!-- PAGE CONTENT CONTAINER -->
          <main class="page-container" id="page-content"></main>
        </div>
      </div>
    `;

    this.bindSidebarEvents();
    this.startClock();
    
    // RENDER REAL-TIME STORE & USER BADGES ON LOAD
    MedHub.updateStoreHeader();
    MedHub.updateUserBadge();

    this.navigate(this.currentPage);
  },

  bindSidebarEvents() {
    const navButtons = document.querySelectorAll(".nav-item");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        this.navigate(page);
      });
    });

    // Logout button
    document.getElementById("btn-logout")?.addEventListener("click", () => {
      this.logout();
    });

    // Global keyboard shortcuts (F1 = Billing, F2 = Inventory, etc.)
    window.addEventListener("keydown", (e) => {
      if (!MedHub.state.isAuthenticated) return;
      if (e.key === "F1") {
        e.preventDefault();
        this.navigate("billing");
      } else if (e.key === "F2") {
        e.preventDefault();
        this.navigate("inventory");
      } else if (e.key === "F3") {
        e.preventDefault();
        this.navigate("invoices");
      }
    });
  },

  navigate(pageId) {
    this.currentPage = pageId;
    MedHub.state.page = pageId;

    // Update active nav class
    document.querySelectorAll(".nav-item").forEach(btn => {
      if (btn.dataset.page === pageId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update topbar heading
    const menu = MedHub.getMenuItems ? MedHub.getMenuItems() : MedHub.menuItems;
    const currentItem = menu.find(m => m.id === pageId) || MedHub.menuItems.find(m => m.id === pageId);
    const headingEl = document.getElementById("page-heading");
    if (headingEl) {
      if (pageId === "admin" || pageId === "admin-logins") {
        headingEl.innerText = "Stores & Real-time Login Monitor";
      } else if (pageId === "admin-stock") {
        headingEl.innerText = "Real-time Stock Details Monitor";
      } else if (currentItem) {
        headingEl.innerText = currentItem.label;
      }
    }

    // Always maintain real-time store header in topbar
    MedHub.updateStoreHeader();

    // Render corresponding page module
    const contentContainer = document.getElementById("page-content");
    if (!contentContainer) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    switch (pageId) {
      case "admin":
      case "admin-logins":
        if (MedHub.admin) {
          MedHub.admin.activeView = "logins";
          MedHub.admin.render(contentContainer);
        }
        break;
      case "admin-stock":
        if (MedHub.admin) {
          MedHub.admin.activeView = "stock";
          MedHub.admin.render(contentContainer);
        }
        break;
      case "dashboard":
        if (MedHub.dashboard) MedHub.dashboard.render(contentContainer);
        break;
      case "billing":
        if (MedHub.billing) MedHub.billing.render(contentContainer);
        break;
      case "invoices":
        if (MedHub.invoices) MedHub.invoices.render(contentContainer);
        break;
      case "inventory":
        if (MedHub.inventory) MedHub.inventory.render(contentContainer);
        break;
      case "purchases":
        if (MedHub.purchases) MedHub.purchases.render(contentContainer);
        break;
      case "ledger":
        if (MedHub.ledger) MedHub.ledger.render(contentContainer);
        break;
      case "suppliers":
        if (MedHub.suppliers) MedHub.suppliers.render(contentContainer);
        break;
      case "reports":
        if (MedHub.reports) MedHub.reports.render(contentContainer);
        break;
      case "security":
        if (MedHub.security) MedHub.security.render(contentContainer);
        break;
      case "settings":
        if (MedHub.settings) MedHub.settings.render(contentContainer);
        break;
      default:
        if (MedHub.billing) MedHub.billing.render(contentContainer);
    }
  },

  logout() {
    MedHub.state.isAuthenticated = false;
    MedHub.state.impersonatedStore = null;
    const banner = document.getElementById("superadmin-return-banner");
    if (banner) banner.style.display = "none";

    if (MedHub.login) {
      MedHub.login.currentStep = 1;
      MedHub.login.tempAuth = { email: "", name: "", password: "" };
      MedHub.login.storeData = null;
      MedHub.login.isNewStore = false;
    }
    try {
      localStorage.setItem("medhub_authenticated", "false");
      localStorage.removeItem("medhub_current_user");
      localStorage.removeItem("medhub_username");
      localStorage.removeItem("medhub_store_id");
      localStorage.removeItem("medhub_user_role");
      localStorage.removeItem("medhub_impersonated_store");
    } catch (e) {}
    MedHub.toast("Successfully signed out.", "info");
    this.init();
  },

  startClock() {
    const clockEl = document.getElementById("topbar-clock");
    const update = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    };
    update();
    setInterval(update, 30000);
  }
};

// Application entrypoint on DOM load
document.addEventListener("DOMContentLoaded", async () => {
  if (typeof MedHub.ensureSupabaseClient === "function") {
    await MedHub.ensureSupabaseClient();
  } else if (typeof MedHub.loadConfig === "function") {
    await MedHub.loadConfig();
  } else {
    MedHub.initSupabaseClient();
  }
  if (MedHub.state.isAuthenticated && !MedHub.state.isSuperAdmin && MedHub.state.user?.role !== "superadmin") {
    try {
      if (MedHub.api?.syncUnsyncedLocalDataToCloud) {
        await MedHub.api.syncUnsyncedLocalDataToCloud();
      }
      if (MedHub.api?.getStoreSettings) {
        const freshStore = await MedHub.api.getStoreSettings(MedHub.state.user);
        if (freshStore) {
          MedHub.state.store = freshStore;
          if (MedHub.state.user) {
            if (freshStore.id) MedHub.state.user.store_id = freshStore.id;
            if (freshStore.pharmacist_name) {
              MedHub.state.user.name = freshStore.pharmacist_name;
              try { localStorage.setItem("medhub_user_name", freshStore.pharmacist_name); } catch (e) {}
            }
            if (freshStore.user_email && (!MedHub.state.user.email || MedHub.state.user.email === "admin@mededuhub.com")) {
              MedHub.state.user.email = freshStore.user_email;
              try { localStorage.setItem("medhub_current_user", freshStore.user_email); } catch (e) {}
            }
          }
        }
      }
    } catch (e) {}
  }
  MedHub.router.init();
});
