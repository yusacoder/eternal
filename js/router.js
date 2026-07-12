/* ==========================================================================
   router.js — basit hash tabanlı router
   Rotalar:
     #/dashboard
     #/kullanicilar
     #/silinenler
     #/admin-detay/:id
     #/profil/:username
     #/ayarlar
   ========================================================================== */

const Router = (() => {
  const contentEl = () => document.getElementById("page-content");

  function parseHash() {
    const hash = location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);
    return { route: parts[0] || "dashboard", param: parts[1] };
  }

  function render() {
    const { route, param } = parseHash();
    const el = contentEl();
    if (!el) return;

    switch (route) {
      case "dashboard":
        el.innerHTML = Pages.dashboard();
        UI.highlightActiveRoute("dashboard");
        break;

      case "kullanicilar":
        el.innerHTML = Pages.usersList({ includeDeleted: false });
        UI.highlightActiveRoute("kullanicilar");
        Pages.wireUsersListEvents();
        break;

      case "silinenler":
        el.innerHTML = Pages.usersList({
          includeDeleted: true,
          title: "Silinen Kullanıcılar",
          eyebrow: "Arşiv"
        });
        UI.highlightActiveRoute("silinenler");
        Pages.wireUsersListEvents();
        break;

      case "admin-detay":
        el.innerHTML = Pages.adminDetay(param);
        UI.highlightActiveRoute("kullanicilar");
        Pages.wireAdminDetayEvents(param);
        break;

      case "profil":
        el.innerHTML = Pages.profile(param);
        UI.highlightActiveRoute("kullanicilar");
        break;

      case "ayarlar":
        el.innerHTML = Pages.settings();
        UI.highlightActiveRoute("ayarlar");
        Pages.wireSettingsEvents();
        break;

      default:
        el.innerHTML = Pages.notFound("Sayfa bulunamadı.");
    }

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function init() {
    window.addEventListener("hashchange", render);
    if (!location.hash) location.hash = "#/dashboard";
    render();
  }

  return { init, render };
})();
