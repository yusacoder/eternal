/* ==========================================================================
   pages.js — her rota için sayfa içeriğini üreten fonksiyonlar
   ========================================================================== */

const Pages = (() => {
  const { escapeHtml, timeAgo, formatDate, avatarImg, statusBadge, roleBadges, tagBadges, toast, openModal, closeModal } = UI;

  // ------------------------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------------------------
  function dashboard() {
    const stats = Store.getStats();
    const data = Store.get();
    const last = stats.lastAdded;

    return `
      <div class="page-header">
        <p class="page-eyebrow">Genel Bakış</p>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Tüm istatistikler data.json üzerinden anlık hesaplanır.</p>
      </div>

      <div class="stat-grid">
        <div class="glass-card stat-card tint-accent">
          <div class="stat-icon">👥</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Toplam Kullanıcı</div>
        </div>
        <div class="glass-card stat-card tint-accent">
          <div class="stat-icon">🛡️</div>
          <div class="stat-value">${stats.admin}</div>
          <div class="stat-label">Toplam Admin</div>
        </div>
        <div class="glass-card stat-card tint-teal">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">${stats.yetkili}</div>
          <div class="stat-label">Toplam Yetkili</div>
        </div>
        <div class="glass-card stat-card tint-teal">
          <div class="stat-icon">🧭</div>
          <div class="stat-value">${stats.moderator}</div>
          <div class="stat-label">Toplam Moderatör</div>
        </div>
        <div class="glass-card stat-card tint-amber">
          <div class="stat-icon">💤</div>
          <div class="stat-value">${stats.inactive}</div>
          <div class="stat-label">Pasif Kullanıcı</div>
        </div>
        <div class="glass-card stat-card tint-red">
          <div class="stat-icon">🗑️</div>
          <div class="stat-value">${stats.deleted}</div>
          <div class="stat-label">Silinen Kullanıcı</div>
        </div>
      </div>

      <div class="glass-card" style="padding:22px 24px;">
        <div class="flex between center" style="margin-bottom:8px;">
          <h3 class="section-title" style="margin:0;">Son Eklenen Kullanıcı</h3>
          <a href="#/kullanicilar" class="nav-pill">Tümünü Gör</a>
        </div>
        ${
          last
            ? `<div class="recent-user-row">
                ${avatarImg(last, "sm")}
                <div>
                  <div class="user-name">${escapeHtml(last.firstName)} ${escapeHtml(last.lastName)}</div>
                  <div class="user-handle">@${escapeHtml(last.username)} · ${formatDate(last.registerDate)}</div>
                </div>
              </div>`
            : `<p class="muted">Henüz kullanıcı yok.</p>`
        }
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // KULLANICI LİSTESİ
  // ------------------------------------------------------------------
  let userListState = { search: "", filter: "all", includeDeleted: false };

  function usersList({ includeDeleted = false, title = "Kullanıcı Yönetimi", eyebrow = "Yönetim" } = {}) {
    userListState.includeDeleted = includeDeleted;

    return `
      <div class="page-header">
        <p class="page-eyebrow">${eyebrow}</p>
        <h1 class="page-title">${title}</h1>
        <p class="page-sub">Kullanıcı ekleme, düzenleme, arama ve filtreleme burada yönetilir.</p>
      </div>

      <div class="toolbar">
        <div class="search-box">
          <span>🔍</span>
          <input type="text" id="user-search" placeholder="Kullanıcı adı, ad soyad, yetki, etiket veya e-posta ara..." value="${escapeHtml(userListState.search)}"/>
        </div>
        ${!includeDeleted ? `<button class="btn btn-primary" id="add-user-btn">+ Kullanıcı Ekle</button>` : ""}
      </div>

      <div class="toolbar" id="filter-chips">
        ${renderFilterChip("all", "Tümü")}
        ${renderFilterChip("admin", "Adminler")}
        ${renderFilterChip("yetkili", "Yetkililer")}
        ${renderFilterChip("moderator", "Moderatörler")}
        ${renderFilterChip("developer", "Geliştiriciler")}
        ${renderFilterChip("owner", "Owner")}
        ${renderFilterChip("active", "Aktif")}
        ${renderFilterChip("inactive", "Pasif")}
      </div>

      <div class="glass-card user-table" id="user-table-root"></div>
    `;
  }

  function renderFilterChip(key, label) {
    const active = userListState.filter === key ? "active" : "";
    return `<button class="filter-chip ${active}" data-filter="${key}">${label}</button>`;
  }

  function filterPredicate(user) {
    const f = userListState.filter;
    if (f === "all") return true;
    if (f === "admin") return !!user.isAdmin;
    if (f === "yetkili") return !!user.isYetkili;
    if (f === "moderator") return !!user.isModerator;
    if (f === "developer") return !!user.isDeveloper;
    if (f === "owner") return !!user.isOwner;
    if (f === "active") return !!user.active && !user.deleted;
    if (f === "inactive") return !user.active && !user.deleted;
    return true;
  }

  function searchPredicate(user) {
    const q = userListState.search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      user.username,
      user.firstName,
      user.lastName,
      user.email,
      ...(user.roles || []),
      ...(user.tags || [])
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  }

  function renderUserTable() {
    const root = document.getElementById("user-table-root");
    if (!root) return;
    const users = Store.getUsers({ includeDeleted: userListState.includeDeleted }).filter(
      (u) => (userListState.includeDeleted ? u.deleted : true) && filterPredicate(u) && searchPredicate(u)
    );

    if (users.length === 0) {
      root.innerHTML = `<div class="empty-state">Kriterlere uyan kullanıcı bulunamadı.</div>`;
      return;
    }

    root.innerHTML = `
      <div class="user-row header-row">
        <span>Kullanıcı</span>
        <span class="hide-mobile">Roller</span>
        <span class="hide-mobile">Etiketler</span>
        <span>Durum</span>
        <span></span>
      </div>
      ${users
        .map(
          (u) => `
        <div class="user-row" data-id="${u.id}">
          <div class="user-cell-identity" data-open="${u.id}">
            ${avatarImg(u, "sm")}
            <div>
              <div class="user-name">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</div>
              <div class="user-handle">@${escapeHtml(u.username)}</div>
            </div>
          </div>
          <div class="chip-row hide-mobile">${roleBadges(u)}</div>
          <div class="chip-row hide-mobile">${tagBadges(u)}</div>
          <div>${statusBadge(u)}</div>
          <div class="row-actions">
            ${
              userListState.includeDeleted
                ? `<button class="icon-btn" data-restore="${u.id}" title="Geri Yükle">↺</button>`
                : `
                  <button class="icon-btn" data-edit="${u.id}" title="Düzenle">✎</button>
                  <button class="icon-btn" data-toggle-active="${u.id}" title="${u.active ? "Pasifleştir" : "Aktif Et"}">${u.active ? "⏸" : "▶"}</button>
                  <button class="icon-btn danger" data-delete="${u.id}" title="Sil">🗑</button>
                `
            }
          </div>
        </div>
      `
        )
        .join("")}
    `;

    root.querySelectorAll("[data-open]").forEach((el) => {
      el.addEventListener("click", () => {
        location.hash = `#/admin-detay/${el.dataset.open}`;
      });
    });
    root.querySelectorAll("[data-edit]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openUserForm(Store.getUserById(el.dataset.edit));
      });
    });
    root.querySelectorAll("[data-toggle-active]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const u = Store.getUserById(el.dataset.toggleActive);
        Store.setActive(u.id, !u.active);
        toast(u.active ? "Kullanıcı pasifleştirildi" : "Kullanıcı aktif edildi");
        renderUserTable();
      });
    });
    root.querySelectorAll("[data-delete]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        confirmDialog("Bu kullanıcıyı silmek istediğinize emin misiniz?", () => {
          Store.softDeleteUser(el.dataset.delete);
          toast("Kullanıcı silindi");
          renderUserTable();
        });
      });
    });
    root.querySelectorAll("[data-restore]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        Store.restoreUser(el.dataset.restore);
        toast("Kullanıcı geri yüklendi");
        renderUserTable();
      });
    });
  }

  function wireUsersListEvents() {
    const searchInput = document.getElementById("user-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        userListState.search = e.target.value;
        renderUserTable();
      });
    }
    document.querySelectorAll("#filter-chips [data-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        userListState.filter = chip.dataset.filter;
        document.querySelectorAll("#filter-chips [data-filter]").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        renderUserTable();
      });
    });
    const addBtn = document.getElementById("add-user-btn");
    if (addBtn) addBtn.addEventListener("click", () => openUserForm(null));
    renderUserTable();
  }

  // ------------------------------------------------------------------
  // Onay diyaloğu (basit modal)
  // ------------------------------------------------------------------
  function confirmDialog(message, onConfirm) {
    openModal(`
      <div class="modal-header"><h3 class="modal-title">Emin misiniz?</h3></div>
      <p class="muted">${escapeHtml(message)}</p>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="confirm-cancel">Vazgeç</button>
        <button class="btn btn-danger" id="confirm-ok">Evet, Onayla</button>
      </div>
    `, (overlay) => {
      overlay.querySelector("#confirm-cancel").addEventListener("click", closeModal);
      overlay.querySelector("#confirm-ok").addEventListener("click", () => {
        onConfirm();
        closeModal();
      });
    });
  }

  // ------------------------------------------------------------------
  // Kullanıcı ekle / düzenle formu (modal)
  // ------------------------------------------------------------------
  function openUserForm(existingUser) {
    const data = Store.get();
    const isEdit = !!existingUser;
    const u = existingUser || {};
    const roles = u.roles || [];
    const tags = u.tags || [];

    openModal(
      `
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}</h3>
        <button class="icon-btn" id="form-close">✕</button>
      </div>
      <div class="form-grid">
        <div class="field"><label>Ad</label><input id="f-firstName" value="${escapeHtml(u.firstName || "")}"/></div>
        <div class="field"><label>Soyad</label><input id="f-lastName" value="${escapeHtml(u.lastName || "")}"/></div>
        <div class="field"><label>Kullanıcı Adı</label><input id="f-username" value="${escapeHtml(u.username || "")}"/></div>
        <div class="field"><label>E-posta</label><input id="f-email" value="${escapeHtml(u.email || "")}"/></div>
        <div class="field field-span-2"><label>Profil Resmi (PNG/JPG/JPEG/WEBP/URL)</label><input id="f-avatar" placeholder="https://... veya dosya yolu" value="${escapeHtml(u.avatar || "")}"/></div>
        <div class="field field-span-2"><label>Arka Plan Resmi (PNG/JPG/JPEG/WEBP/URL)</label><input id="f-banner" placeholder="https://... veya dosya yolu" value="${escapeHtml(u.banner || "")}"/></div>
        <div class="field field-span-2"><label>Açıklama</label><textarea id="f-bio" rows="2">${escapeHtml(u.bio || "")}</textarea></div>

        <div class="field field-span-2">
          <label>Roller</label>
          <div class="tag-picker" id="f-roles">
            ${data.availableRoles
              .map(
                (r) =>
                  `<button type="button" class="tag-option ${roles.includes(r) ? "selected" : ""}" data-role="${escapeHtml(r)}">${escapeHtml(r)}</button>`
              )
              .join("")}
          </div>
        </div>

        <div class="field field-span-2">
          <label>Etiketler</label>
          <div class="tag-picker" id="f-tags">
            ${data.availableTags
              .map(
                (t) =>
                  `<button type="button" class="tag-option ${tags.includes(t) ? "selected" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
              )
              .join("")}
          </div>
        </div>

        <div class="field field-span-2">
          <label>Yetkiler</label>
          <div class="toggle-grid">
            ${renderTogglePermission("isOwner", "Owner", u.isOwner)}
            ${renderTogglePermission("isFounder", "Founder", u.isFounder)}
            ${renderTogglePermission("isDeveloper", "Developer", u.isDeveloper)}
            ${renderTogglePermission("isAdmin", "Admin", u.isAdmin)}
            ${renderTogglePermission("isYonetici", "Yönetici", u.isYonetici)}
            ${renderTogglePermission("isYetkili", "Yetkili", u.isYetkili)}
            ${renderTogglePermission("isModerator", "Moderatör", u.isModerator)}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" id="form-cancel">Vazgeç</button>
        <button class="btn btn-primary" id="form-save">${isEdit ? "Kaydet" : "Kullanıcıyı Ekle"}</button>
      </div>
    `,
      (overlay) => {
        overlay.querySelectorAll("#f-roles [data-role]").forEach((btn) => {
          btn.addEventListener("click", () => btn.classList.toggle("selected"));
        });
        overlay.querySelectorAll("#f-tags [data-tag]").forEach((btn) => {
          btn.addEventListener("click", () => btn.classList.toggle("selected"));
        });
        overlay.querySelector("#form-close").addEventListener("click", closeModal);
        overlay.querySelector("#form-cancel").addEventListener("click", closeModal);
        overlay.querySelector("#form-save").addEventListener("click", () => {
          const patch = {
            firstName: overlay.querySelector("#f-firstName").value.trim(),
            lastName: overlay.querySelector("#f-lastName").value.trim(),
            username: overlay.querySelector("#f-username").value.trim(),
            email: overlay.querySelector("#f-email").value.trim(),
            avatar: overlay.querySelector("#f-avatar").value.trim(),
            banner: overlay.querySelector("#f-banner").value.trim(),
            bio: overlay.querySelector("#f-bio").value.trim(),
            roles: Array.from(overlay.querySelectorAll("#f-roles .selected")).map((b) => b.dataset.role),
            tags: Array.from(overlay.querySelectorAll("#f-tags .selected")).map((b) => b.dataset.tag)
          };
          ["isOwner", "isFounder", "isDeveloper", "isAdmin", "isYonetici", "isYetkili", "isModerator"].forEach((key) => {
            const el = overlay.querySelector(`#f-${key}`);
            if (el) patch[key] = el.checked;
          });

          if (!patch.username || !patch.firstName) {
            toast("Ad ve kullanıcı adı zorunludur", "error");
            return;
          }

          if (isEdit) {
            Store.updateUser(existingUser.id, patch);
            toast("Kullanıcı güncellendi");
          } else {
            Store.addUser(patch);
            toast("Kullanıcı eklendi");
          }
          closeModal();
          renderUserTable();
          Dashboard_refreshIfMounted();
        }
        );
      }
    );
  }

  function renderTogglePermission(key, label, checked) {
    return `
      <div class="toggle-item">
        <span>${label}</span>
        <label class="switch">
          <input type="checkbox" id="f-${key}" ${checked ? "checked" : ""}/>
          <span class="track"></span>
        </label>
      </div>
    `;
  }

  function Dashboard_refreshIfMounted() {
    // no-op hook reserved for future live-refresh needs
  }

  // ------------------------------------------------------------------
  // ADMIN DETAY SAYFASI
  // ------------------------------------------------------------------
  function adminDetay(userId) {
    const u = Store.getUserById(userId);
    if (!u) return notFound("Kullanıcı bulunamadı.");

    return `
      <div class="page-header">
        <p class="page-eyebrow">Admin Detay</p>
        <h1 class="page-title">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</h1>
        <p class="page-sub">Kullanıcının tüm bilgileri data.json üzerinden gösterilir.</p>
      </div>

      <div class="glass-card">
        <div class="detail-banner" style="background-image:url('${escapeHtml(u.banner || "")}'); background-color:#eeecff;"></div>
        <div class="detail-header">
          ${avatarImg(u, "lg")}
          <div class="detail-name-block">
            <p class="detail-fullname">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</p>
            <p class="detail-username">@${escapeHtml(u.username)} · ${statusBadge(u)}</p>
          </div>
          <div style="margin-left:auto; padding-bottom:6px; display:flex; gap:8px;">
            <button class="btn btn-ghost btn-sm" id="detail-edit-btn">✎ Düzenle</button>
            <a href="#/profil/${escapeHtml(u.username)}" class="btn btn-ghost btn-sm">Profili Gör</a>
          </div>
        </div>

        <div style="padding:0 28px 28px;">
          <div class="detail-grid">
            <div>
              <div class="glass-card section-block" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4);">
                <h3 class="section-title">Hakkında</h3>
                <p class="muted" style="font-size:13.5px; line-height:1.6;">${escapeHtml(u.bio || "Açıklama girilmemiş.")}</p>
              </div>

              <div class="glass-card section-block" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4); margin-top:16px;">
                <h3 class="section-title">Roller</h3>
                <div class="chip-row">${(u.roles || []).map((r) => `<span class="badge badge-role">${escapeHtml(r)}</span>`).join("") || `<span class="muted">Rol atanmamış</span>`}</div>
              </div>

              <div class="glass-card section-block" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4); margin-top:16px;">
                <h3 class="section-title">Etiketler</h3>
                <div class="chip-row">${(u.tags || []).map((t) => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join("") || `<span class="muted">Etiket yok</span>`}</div>
              </div>

              <div class="glass-card section-block" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4); margin-top:16px;">
                <h3 class="section-title">Yetkiler</h3>
                <div class="toggle-grid">
                  ${renderTogglePermission("isOwner", "Owner", u.isOwner)}
                  ${renderTogglePermission("isFounder", "Founder", u.isFounder)}
                  ${renderTogglePermission("isDeveloper", "Developer", u.isDeveloper)}
                  ${renderTogglePermission("isAdmin", "Admin", u.isAdmin)}
                  ${renderTogglePermission("isYonetici", "Yönetici", u.isYonetici)}
                  ${renderTogglePermission("isYetkili", "Yetkili", u.isYetkili)}
                  ${renderTogglePermission("isModerator", "Moderatör", u.isModerator)}
                </div>
                <p class="muted" style="font-size:12px; margin-top:10px;">Yetki değişiklikleri anında panele yansır.</p>
              </div>
            </div>

            <div>
              <div class="glass-card" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4);">
                <h3 class="section-title">Bilgiler</h3>
                <div class="info-list">
                  <div class="info-row"><span class="label">E-posta</span><span class="value">${escapeHtml(u.email)}</span></div>
                  <div class="info-row"><span class="label">Kayıt Tarihi</span><span class="value">${formatDate(u.registerDate)}</span></div>
                  <div class="info-row"><span class="label">Katılım Tarihi</span><span class="value">${formatDate(u.joinDate)}</span></div>
                  <div class="info-row"><span class="label">Son Giriş</span><span class="value">${timeAgo(u.lastLogin)}</span></div>
                  <div class="info-row"><span class="label">Durum</span><span class="value">${statusBadge(u)}</span></div>
                </div>
              </div>

              <div class="glass-card" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4); margin-top:16px;">
                <h3 class="section-title">Sosyal Medya</h3>
                <div class="info-list">
                  <div class="info-row"><span class="label">Twitter</span><span class="value">${u.social && u.social.twitter ? `<a href="${escapeHtml(u.social.twitter)}" target="_blank">${escapeHtml(u.social.twitter)}</a>` : "—"}</span></div>
                  <div class="info-row"><span class="label">Instagram</span><span class="value">${u.social && u.social.instagram ? `<a href="${escapeHtml(u.social.instagram)}" target="_blank">${escapeHtml(u.social.instagram)}</a>` : "—"}</span></div>
                  <div class="info-row"><span class="label">Discord</span><span class="value">${(u.social && u.social.discord) || "—"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function wireAdminDetayEvents(userId) {
    const editBtn = document.getElementById("detail-edit-btn");
    if (editBtn) editBtn.addEventListener("click", () => openUserForm(Store.getUserById(userId)));

    // Yetki toggle anlık güncelleme
    ["isOwner", "isFounder", "isDeveloper", "isAdmin", "isYonetici", "isYetkili", "isModerator"].forEach((key) => {
      const el = document.getElementById(`f-${key}`);
      if (el) {
        el.addEventListener("change", () => {
          Store.updateUser(userId, { [key]: el.checked });
          toast("Yetki güncellendi");
        });
      }
    });
  }

  // ------------------------------------------------------------------
  // PROFİL SAYFASI
  // ------------------------------------------------------------------
  function profile(username) {
    const u = Store.getUserByUsername(username);
    if (!u) return notFound("Profil bulunamadı.");

    return `
      <div class="glass-card">
        <div class="detail-banner" style="background-image:url('${escapeHtml(u.banner || "")}'); background-color:#eeecff;"></div>
        <div class="detail-header">
          ${avatarImg(u, "lg")}
          <div class="detail-name-block">
            <p class="detail-fullname">${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</p>
            <p class="detail-username">@${escapeHtml(u.username)}</p>
          </div>
        </div>
        <div style="padding:0 28px 28px;">
          <div class="chip-row" style="margin-bottom:18px;">
            ${(u.roles || []).map((r) => `<span class="badge badge-role">${escapeHtml(r)}</span>`).join("")}
            ${(u.tags || []).map((t) => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join("")}
          </div>

          <div class="detail-grid">
            <div class="glass-card" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4);">
              <h3 class="section-title">Hakkında</h3>
              <p class="muted" style="font-size:13.5px; line-height:1.6;">${escapeHtml(u.bio || "Bu kullanıcı henüz bir açıklama eklememiş.")}</p>
              <div class="info-row" style="margin-top:16px;"><span class="label">Katılım Tarihi</span><span class="value">${formatDate(u.joinDate)}</span></div>
            </div>
            <div class="glass-card" style="padding:20px; box-shadow:none; background:rgba(255,255,255,0.4);">
              <h3 class="section-title">Sosyal Medya</h3>
              <div class="info-list">
                <div class="info-row"><span class="label">Twitter</span><span class="value">${u.social && u.social.twitter ? `<a href="${escapeHtml(u.social.twitter)}" target="_blank">Profili Gör</a>` : "—"}</span></div>
                <div class="info-row"><span class="label">Instagram</span><span class="value">${u.social && u.social.instagram ? `<a href="${escapeHtml(u.social.instagram)}" target="_blank">Profili Gör</a>` : "—"}</span></div>
                <div class="info-row"><span class="label">Discord</span><span class="value">${(u.social && u.social.discord) || "—"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // SİTE AYARLARI
  // ------------------------------------------------------------------
  function settings() {
    const data = Store.get();
    return `
      <div class="page-header">
        <p class="page-eyebrow">Yönetim</p>
        <h1 class="page-title">Site Ayarları</h1>
        <p class="page-sub">Hamburger menüsünde görünen linkler ve başvuru formu burada yönetilir.</p>
      </div>

      <div class="glass-card" style="padding:22px 24px; margin-bottom:20px;">
        <h3 class="section-title">Sitelerimiz</h3>
        ${renderSiteRow("anime", "Anime Sitemiz", data.sites.anime)}
        ${renderSiteRow("manga", "Manga Sitemiz", data.sites.manga)}
        ${renderSiteRow("haber", "Anime Haber Sitemiz", data.sites.haber)}
      </div>

      <div class="glass-card" style="padding:22px 24px; margin-bottom:20px;">
        <h3 class="section-title">Admin Başvuru Formu</h3>
        <div class="field">
          <label>Google Forms Linki</label>
          <input id="admin-app-input" value="${escapeHtml(data.adminApplication)}"/>
        </div>
        <button class="btn btn-primary" id="save-admin-app-btn" style="margin-top:12px;">Kaydet</button>
        <p class="muted" style="font-size:12px; margin-top:10px;">Form yanıtları destek@eternalproduction.net adresine yönlendirilecek şekilde Google Forms üzerinden yapılandırılmalıdır.</p>
      </div>

      <div class="glass-card" style="padding:22px 24px;">
        <h3 class="section-title">Değişiklikleri Kaydet</h3>
        <p class="muted" style="font-size:13px;">Bu panel statik olarak çalışır; yaptığınız değişiklikler tarayıcı belleğinde tutulur. Kalıcı hale getirmek için güncel data.json dosyasını indirip sunucunuzdaki dosyanın üzerine yazın.</p>
        <button class="btn btn-ghost" id="download-json-btn" style="margin-top:10px;">⬇ data.json indir</button>
      </div>
    `;
  }

  function renderSiteRow(key, label, url) {
    return `
      <div class="site-link-card glass-card" style="box-shadow:none; background:rgba(255,255,255,0.4); margin-top:10px;">
        <div>
          <div class="name">${label}</div>
          <div class="url">${escapeHtml(url)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-edit-site="${key}">Düzenle</button>
      </div>
    `;
  }

  function wireSettingsEvents() {
    document.querySelectorAll("[data-edit-site]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.editSite;
        const current = Store.get().sites[key];
        const newUrl = prompt("Yeni link:", current);
        if (newUrl) {
          Store.updateSites({ [key]: newUrl });
          toast("Site linki güncellendi");
          Router.render();
        }
      });
    });
    const saveAppBtn = document.getElementById("save-admin-app-btn");
    if (saveAppBtn) {
      saveAppBtn.addEventListener("click", () => {
        const val = document.getElementById("admin-app-input").value.trim();
        Store.updateAdminApplication(val);
        toast("Başvuru formu linki güncellendi");
        Router.render();
      });
    }
    const downloadBtn = document.getElementById("download-json-btn");
    if (downloadBtn) downloadBtn.addEventListener("click", () => Store.downloadJson());
  }

  function notFound(message) {
    return `<div class="empty-state glass-card" style="padding:60px;">${escapeHtml(message)}</div>`;
  }

  return {
    dashboard,
    usersList,
    renderUserTable,
    wireUsersListEvents,
    adminDetay,
    wireAdminDetayEvents,
    profile,
    settings,
    wireSettingsEvents,
    openUserForm,
    notFound
  };
})();
