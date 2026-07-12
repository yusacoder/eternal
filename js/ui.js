/* ==========================================================================
   ui.js — paylaşılan arayüz parçaları (navbar, hamburger menü, toast, modal)
   ========================================================================== */

const UI = (() => {
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "Hiç giriş yapılmadı";
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return mins + " dk önce";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + " sa önce";
    const days = Math.floor(hours / 24);
    if (days < 30) return days + " gün önce";
    return d.toLocaleDateString("tr-TR");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
  }

  function avatarImg(user, size) {
    const cls = size === "lg" ? "avatar-lg" : size === "md" ? "avatar-md" : "avatar-sm";
    const px = size === "lg" ? 108 : size === "md" ? 56 : 36;
    const src = user.avatar
      ? user.avatar
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.firstName + " " + user.lastName)}`;
    return `<img class="avatar ${cls}" src="${escapeHtml(src)}" width="${px}" height="${px}" alt="${escapeHtml(user.username)}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.firstName + ' ' + user.lastName)}'"/>`;
  }

  function statusBadge(user) {
    if (user.deleted) return `<span class="badge badge-deleted">Silinmiş</span>`;
    if (!user.active) return `<span class="badge badge-inactive">Pasif</span>`;
    return `<span class="badge badge-active">Aktif</span>`;
  }

  function roleBadges(user, limit = 3) {
    const roles = user.roles || [];
    const shown = roles.slice(0, limit);
    const extra = roles.length - shown.length;
    return (
      shown.map((r) => `<span class="badge badge-role">${escapeHtml(r)}</span>`).join("") +
      (extra > 0 ? `<span class="badge badge-role">+${extra}</span>` : "")
    );
  }

  function tagBadges(user, limit = 4) {
    const tags = user.tags || [];
    const shown = tags.slice(0, limit);
    const extra = tags.length - shown.length;
    return (
      shown.map((t) => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join("") +
      (extra > 0 ? `<span class="badge badge-tag">+${extra}</span>` : "")
    );
  }

  // ---------- Toast ----------
  function toast(message, type = "success") {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "toast-stack";
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------- Modal ----------
  function openModal(innerHtml, onMount) {
    closeModal();
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "active-modal";
    overlay.innerHTML = `<div class="modal-box">${innerHtml}</div>`;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    if (onMount) onMount(overlay);
  }

  function closeModal() {
    const existing = document.getElementById("active-modal");
    if (existing) existing.remove();
  }

  // ---------- Navbar ----------
  function renderNavbar(data) {
    return `
      <nav class="navbar">
        <div class="navbar-left">
          <button class="hamburger-btn" id="hamburger-toggle" aria-label="Menü">
            <span></span><span></span><span></span>
          </button>
          <a href="#/dashboard" class="brand">${escapeHtml(data.site.logoText || "Eternal")}<span>.</span></a>
        </div>
        <div class="navbar-right">
          <a href="#/kullanicilar" class="nav-pill">Kullanıcılar</a>
          <a href="${escapeHtml(data.adminApplication)}" target="_blank" rel="noopener" class="nav-pill primary">Admin Başvurusu</a>
        </div>
      </nav>
    `;
  }

  // ---------- Hamburger side menu ----------
  function renderSideMenu(data) {
    const sites = data.sites || {};
    return `
      <div class="side-overlay" id="side-overlay"></div>
      <aside class="side-menu" id="side-menu">
        <div class="side-menu-header">
          <span class="brand">${escapeHtml(data.site.logoText || "Eternal")}<span>.</span></span>
          <button class="side-menu-close" id="side-menu-close">✕</button>
        </div>

        <div class="side-menu-section">
          <p class="side-menu-title">Panel</p>
          <a href="#/dashboard" class="side-menu-link" data-route="dashboard"><span class="icon">📊</span> Dashboard</a>
          <a href="#/kullanicilar" class="side-menu-link" data-route="kullanicilar"><span class="icon">👥</span> Kullanıcı Yönetimi</a>
          <a href="#/silinenler" class="side-menu-link" data-route="silinenler"><span class="icon">🗑️</span> Silinen Kullanıcılar</a>
          <a href="#/ayarlar" class="side-menu-link" data-route="ayarlar"><span class="icon">⚙️</span> Site Ayarları</a>
        </div>

        <div class="side-menu-section">
          <p class="side-menu-title">Sitelerimiz</p>
          <a href="${escapeHtml(sites.anime || "#")}" target="_blank" rel="noopener" class="side-menu-link external"><span class="icon">🎬</span> Anime Sitemiz <span class="ext-mark">↗</span></a>
          <a href="${escapeHtml(sites.manga || "#")}" target="_blank" rel="noopener" class="side-menu-link external"><span class="icon">📖</span> Manga Sitemiz <span class="ext-mark">↗</span></a>
          <a href="${escapeHtml(sites.haber || "#")}" target="_blank" rel="noopener" class="side-menu-link external"><span class="icon">📰</span> Anime Haber Sitemiz <span class="ext-mark">↗</span></a>
        </div>

        <div class="side-menu-section">
          <p class="side-menu-title">Başvuru</p>
          <a href="${escapeHtml(data.adminApplication)}" target="_blank" rel="noopener" class="side-menu-link external"><span class="icon">📝</span> Admin Başvuru Formu <span class="ext-mark">↗</span></a>
        </div>
      </aside>
    `;
  }

  function wireSideMenu() {
    const menu = document.getElementById("side-menu");
    const overlay = document.getElementById("side-overlay");
    const toggleBtn = document.getElementById("hamburger-toggle");
    const closeBtn = document.getElementById("side-menu-close");

    function open() {
      menu.classList.add("is-open");
      overlay.classList.add("is-visible");
      toggleBtn.classList.add("is-open");
    }
    function close() {
      menu.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      toggleBtn.classList.remove("is-open");
    }
    toggleBtn.addEventListener("click", () => {
      menu.classList.contains("is-open") ? close() : open();
    });
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  }

  function highlightActiveRoute(routeName) {
    document.querySelectorAll(".side-menu-link[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === routeName);
    });
  }

  return {
    escapeHtml,
    timeAgo,
    formatDate,
    avatarImg,
    statusBadge,
    roleBadges,
    tagBadges,
    toast,
    openModal,
    closeModal,
    renderNavbar,
    renderSideMenu,
    wireSideMenu,
    highlightActiveRoute
  };
})();
