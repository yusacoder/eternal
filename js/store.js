/* ==========================================================================
   store.js
   Tüm panel data.json üzerinden çalışır. Bu modül:
   - data.json dosyasını fetch ile yükler
   - Bellekte tek bir "state" nesnesi olarak tutar
   - CRUD (ekle / oku / güncelle / sil) işlemlerini sağlar
   - Değişiklikleri güncel data.json olarak indirilebilir hale getirir
     (statik bir site sunucuya yazamayacağı için, admin değişiklikleri
     indirip gerçek data.json dosyasının üzerine yazabilir)
   ========================================================================== */

const Store = (() => {
  let state = null;
  let dirty = false;
  const listeners = [];

  async function load() {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("data.json yüklenemedi (" + res.status + ")");
    state = await res.json();
    return state;
  }

  function get() {
    return state;
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function notify() {
    dirty = true;
    listeners.forEach((fn) => fn(state));
  }

  function isDirty() {
    return dirty;
  }

  // ---------- Kullanıcı CRUD ----------

  function getUsers({ includeDeleted = false } = {}) {
    return state.users.filter((u) => includeDeleted || !u.deleted);
  }

  function getUserById(id) {
    return state.users.find((u) => u.id === id);
  }

  function getUserByUsername(username) {
    return state.users.find((u) => u.username === username);
  }

  function generateId() {
    return "u" + Math.random().toString(36).slice(2, 8);
  }

  function addUser(userData) {
    const newUser = Object.assign(
      {
        id: generateId(),
        registerDate: new Date().toISOString().slice(0, 10),
        joinDate: new Date().toISOString().slice(0, 10),
        lastLogin: null,
        active: true,
        deleted: false,
        isOwner: false,
        isFounder: false,
        isDeveloper: false,
        isAdmin: false,
        isYonetici: false,
        isYetkili: false,
        isModerator: false,
        tags: [],
        roles: [],
        social: { twitter: "", instagram: "", discord: "" },
        bio: "",
        avatar: "",
        banner: ""
      },
      userData
    );
    newUser.profileUrl = "#/profil/" + newUser.username;
    state.users.push(newUser);
    notify();
    return newUser;
  }

  function updateUser(id, patch) {
    const user = getUserById(id);
    if (!user) return null;
    Object.assign(user, patch);
    if (patch.username) user.profileUrl = "#/profil/" + patch.username;
    notify();
    return user;
  }

  function softDeleteUser(id) {
    return updateUser(id, { deleted: true, active: false });
  }

  function restoreUser(id) {
    return updateUser(id, { deleted: false });
  }

  function hardDeleteUser(id) {
    state.users = state.users.filter((u) => u.id !== id);
    notify();
  }

  function setActive(id, active) {
    return updateUser(id, { active });
  }

  // ---------- Site ayarları ----------

  function updateSites(patch) {
    state.sites = Object.assign({}, state.sites, patch);
    notify();
  }

  function updateAdminApplication(url) {
    state.adminApplication = url;
    notify();
  }

  // ---------- İstatistikler ----------

  function getStats() {
    const users = state.users;
    const active = users.filter((u) => !u.deleted);
    return {
      total: active.length,
      admin: active.filter((u) => u.isAdmin).length,
      yetkili: active.filter((u) => u.isYetkili).length,
      moderator: active.filter((u) => u.isModerator).length,
      inactive: active.filter((u) => !u.active).length,
      deleted: users.filter((u) => u.deleted).length,
      lastAdded: [...active].sort((a, b) =>
        (b.registerDate || "").localeCompare(a.registerDate || "")
      )[0]
    };
  }

  // ---------- Dışa aktarma (indirme) ----------

  function downloadJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    dirty = false;
  }

  return {
    load,
    get,
    onChange,
    isDirty,
    getUsers,
    getUserById,
    getUserByUsername,
    addUser,
    updateUser,
    softDeleteUser,
    restoreUser,
    hardDeleteUser,
    setActive,
    updateSites,
    updateAdminApplication,
    getStats,
    downloadJson
  };
})();
