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
  { id: "settings", label: "Store Settings", icon: "settings" }
];

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

    appEl.innerHTML = `
      <div class="app-layout">
        <!-- SIDEBAR NAVIGATION (SCREENSHOT 3 EXACT LAYOUT) -->
        <aside class="sidebar" id="app-sidebar">
          <div class="sidebar-brand">
            ${MedHub.renderLogo ? MedHub.renderLogo(34) : `
              <span class="brand-logo-icon">💊</span>
              <div class="brand-text-wrap">
                <span class="brand-title">MedEduHub</span>
                <span class="brand-sub">Pharma OS v2.0</span>
              </div>
            `}
          </div>

          <nav class="sidebar-nav" id="sidebar-menu">
            ${MedHub.menuItems.map(item => `
              <button type="button" class="nav-item ${item.id === this.currentPage ? 'active' : ''}" data-page="${item.id}">
                <span class="nav-icon">${MedHub.icons[item.icon] || ""}</span>
                <span class="nav-label">${item.label}</span>
              </button>
            `).join("")}
          </nav>

          <div class="sidebar-footer">
            <div class="user-profile-badge">
              <div class="user-avatar">${MedHub.getInitials ? MedHub.getInitials(MedHub.state.user.name) : "DA"}</div>
              <div class="user-meta">
                <span class="user-name">${MedHub.state.user.name || "Dr. Anil Kumar"}</span>
                <span class="user-role">${MedHub.state.user.role === 'admin' ? 'Pharmacist Admin' : (MedHub.state.user.role || 'Pharmacist Admin')}</span>
              </div>
            </div>
            <button type="button" class="btn-sidebar-logout" id="btn-logout" title="Sign Out">
              ${MedHub.icons.logout}
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
    const currentItem = MedHub.menuItems.find(m => m.id === pageId);
    const headingEl = document.getElementById("page-heading");
    if (headingEl && currentItem) {
      headingEl.innerText = currentItem.label;
    }

    // Always maintain real-time store header in topbar
    MedHub.updateStoreHeader();

    // Render corresponding page module
    const contentContainer = document.getElementById("page-content");
    if (!contentContainer) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    switch (pageId) {
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
      case "settings":
        if (MedHub.settings) MedHub.settings.render(contentContainer);
        break;
      default:
        if (MedHub.billing) MedHub.billing.render(contentContainer);
    }
  },

  logout() {
    MedHub.state.isAuthenticated = false;
    if (MedHub.login) {
      MedHub.login.currentStep = 1;
      MedHub.login.tempAuth = { email: "", name: "", password: "" };
      MedHub.login.storeData = null;
      MedHub.login.isNewStore = false;
    }
    try {
      localStorage.setItem("medhub_authenticated", "false");
      localStorage.removeItem("medhub_current_user");
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
  if (typeof MedHub.loadConfig === "function") {
    await MedHub.loadConfig();
  } else {
    MedHub.initSupabaseClient();
  }
  MedHub.router.init();
});
