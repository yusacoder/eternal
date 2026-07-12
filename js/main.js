/* ==========================================================================
   main.js — uygulamayı başlatır
   ========================================================================== */

(async function bootstrap() {
  const shell = document.getElementById("app-shell");
  try {
    const data = await Store.load();

    shell.innerHTML = `
      ${UI.renderNavbar(data)}
      ${UI.renderSideMenu(data)}
      <main class="page-content" id="page-content"></main>
    `;

    UI.wireSideMenu();

    // data.json içinde herhangi bir değişiklik olduğunda (ekleme/silme/güncelleme)
    // aktif sayfa yeniden çizilerek panelin anında güncellenmesi sağlanır.
    Store.onChange(() => Router.render());

    Router.init();

    window.addEventListener("beforeunload", (e) => {
      if (Store.isDirty()) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  } catch (err) {
    console.error(err);
    shell.innerHTML = `
      <div style="padding:80px 24px; text-align:center; font-family:sans-serif;">
        <h2>data.json yüklenemedi</h2>
        <p style="color:#888;">Bu panelin çalışması için bir yerel sunucu üzerinden açılması gerekir
        (tarayıcılar dosya:// protokolünde fetch isteklerini engeller).</p>
        <p style="color:#888; font-size:13px;">Örnek: <code>python -m http.server 8080</code> komutunu bu klasörde çalıştırıp
        <code>http://localhost:8080</code> adresini açın.</p>
        <p style="color:#c00; font-size:12px;">Hata: ${err.message}</p>
      </div>
    `;
  }
})();
