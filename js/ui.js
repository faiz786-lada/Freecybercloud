/**
 * UI layer: routing between pages, rendering the dashboard / file
 * list / folders / settings views, and all view-only interactions
 * (search, sort, filter, select, modals, theme, mobile sidebar).
 */
const UI = {
  /* ---------- Mobile sidebar drawer ---------- */
  openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('scrim').classList.add('show');
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('scrim').classList.remove('show');
  },

  /* ---------- Theme ---------- */
  toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) { html.removeAttribute('data-theme'); localStorage.setItem?.('cc-theme', 'dark'); }
    else { html.setAttribute('data-theme', 'light'); localStorage.setItem?.('cc-theme', 'light'); }
  },

  /* ---------- Routing ---------- */
  goTo(page) {
    if (page !== 'uploads') State.activeFolder = null;
    State.page = page;
    State.selected.clear();
    document.querySelectorAll('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    UI.closeSidebar();
    UI.render();
  },

  hide(id) { document.getElementById(id).style.display = 'none'; },
  show(id) { document.getElementById(id).style.display = 'flex'; },

  /* ---------- Modals ---------- */
  confirm(title, text, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = text;
    const btn = document.getElementById('confirm-btn');
    const freshBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(freshBtn, btn);
    freshBtn.onclick = () => { onConfirm(); UI.closeConfirm(); };
    UI.show('confirm-overlay');
  },
  closeConfirm() { UI.hide('confirm-overlay'); },

  preview(f) {
    const body = document.getElementById('preview-content');
    if (f.type.startsWith('image/')) {
      body.innerHTML = `<img src="${f.url}"><p style="margin-top:12px">${Utils.esc(f.name)}</p>`;
    } else {
      body.innerHTML = `
        <h3>${Utils.esc(f.name)}</h3>
        <p>Preview not available for this file type — download to view.</p>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick='Files.download(${JSON.stringify(f)})'>Download</button>
        </div>`;
    }
    UI.show('preview-overlay');
  },

  /* ---------- Data derivation ---------- */
  getVisibleFiles() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase();
    let list = Object.entries(State.files || {}).map(([id, f]) => ({ id, ...f }));

    if (State.page === 'trash') {
      list = list.filter(f => f.deleted);
    } else {
      list = list.filter(f => !f.deleted);
      if (State.page === 'favorites') list = list.filter(f => f.favorite);
      if (State.page === 'uploads' && State.activeFolder) list = list.filter(f => f.folder === State.activeFolder);
    }
    if (q) list = list.filter(f => f.name.toLowerCase().includes(q));
    if (State.filterType !== 'all') list = list.filter(f => f.type.startsWith(State.filterType));

    const [key, dir] = State.sort.split('-');
    list.sort((a, b) => {
      const v = key === 'name' ? a.name.localeCompare(b.name)
        : key === 'size' ? a.size - b.size
        : a.uploadedAt - b.uploadedAt;
      return dir === 'desc' ? -v : v;
    });
    return list;
  },

  /* ---------- Root render ---------- */
  render() {
    const c = document.getElementById('content');
    const allFiles = Object.values(State.files || {});

    document.getElementById('count-all').textContent = allFiles.filter(f => !f.deleted).length;
    document.getElementById('count-trash').textContent = allFiles.filter(f => f.deleted).length;

    const usedBytes = allFiles.filter(f => !f.deleted).reduce((s, f) => s + (f.size || 0), 0);
    document.getElementById('storage-used').textContent = Utils.fmtSize(usedBytes);
    const totalBytes = 1 * 1024 * 1024 * 1024; // 1 GB — Realtime Database free "Spark" plan storage cap
    document.getElementById('storage-bar').style.width = Math.min(100, (usedBytes / totalBytes) * 100) + '%';

    if (State.page === 'dashboard') return UI.renderDashboard(c, allFiles);
    if (State.page === 'folders') return UI.renderFolders(c);
    if (State.page === 'settings') return UI.renderSettings(c);
    return UI.renderFileList(c);
  },

  /* ---------- Dashboard page ---------- */
  renderDashboard(c, allFiles) {
    const active = allFiles.filter(f => !f.deleted);
    const recent = [...active].sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 8);
    const usedBytes = active.reduce((s, f) => s + (f.size || 0), 0);

    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">Dashboard</div><div class="page-sub">Welcome back, ${Utils.esc(State.user.displayName || State.user.email)}</div></div>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-label">Total files</div><div class="stat-value">${active.length}</div></div>
        <div class="stat-card"><div class="stat-label">Storage used</div><div class="stat-value">${Utils.fmtSize(usedBytes)}</div></div>
        <div class="stat-card"><div class="stat-label">Folders</div><div class="stat-value">${Object.keys(State.folders || {}).length}</div></div>
        <div class="stat-card"><div class="stat-label">Favorites</div><div class="stat-value">${active.filter(f => f.favorite).length}</div></div>
      </div>
      <div class="dropzone" id="dashboard-drop" onclick="document.getElementById('file-input').click()">
        <div class="ic">⬆</div><h3>Drag &amp; drop files here</h3><p>or click to browse — bulk uploads supported, up to ${Utils.fmtSize(MAX_FILE_SIZE)} per file</p>
      </div>
      <div class="page-head"><div class="page-title" style="font-size:16px">Recently uploaded</div></div>
      <div class="file-grid">${
        recent.length
          ? recent.map(f => UI.fileCard(f)).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><div class="ic">☁</div>No files yet — upload your first one above.</div>'
      }</div>`;
    UI.bindDropzone(document.getElementById('dashboard-drop'));
  },

  /* ---------- Folders page ---------- */
  renderFolders(c) {
    const folders = Object.entries(State.folders || {});
    c.innerHTML = `
      <div class="page-head">
        <div><div class="page-title">Folders</div><div class="page-sub">Organize files into groups</div></div>
        <button class="btn btn-primary" style="width:auto" onclick="UI.show('folder-overlay')">+ New folder</button>
      </div>
      <div class="folder-grid">${
        folders.length
          ? folders.map(([id, f]) => {
              const count = Object.values(State.files || {}).filter(x => x.folder === id && !x.deleted).length;
              return `<div class="folder-card" onclick="Folders.open('${id}')">
                        <div class="ic">▢</div><h4>${Utils.esc(f.name)}</h4><span>${count} file${count !== 1 ? 's' : ''}</span>
                      </div>`;
            }).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><div class="ic">▢</div>No folders yet.</div>'
      }</div>`;
  },

  /* ---------- Settings page ---------- */
  renderSettings(c) {
    const u = State.user;
    c.innerHTML = `
      <div class="page-head"><div class="page-title">Settings</div></div>
      <div class="settings-section">
        <h3>Profile</h3>
        <div class="field"><label>Display name</label><input type="text" id="set-name" value="${Utils.esc(u.displayName || '')}"></div>
        <div class="field"><label>Email</label><input type="text" value="${Utils.esc(u.email)}" disabled></div>
        <button class="btn btn-primary" style="width:auto" onclick="UI.saveProfile()">Save changes</button>
      </div>
      <div class="settings-section">
        <h3>Security</h3>
        <div class="toggle-row"><span>Email verified</span><span>${u.emailVerified ? '✅ Verified' : '⚠ Not verified'}</span></div>
        <div class="toggle-row"><span>Two-factor authentication</span><button class="switch" id="tfa-switch" onclick="this.classList.toggle('on')"></button></div>
        <button class="btn btn-ghost" style="width:auto; margin-top:12px" onclick="Auth.resetPassword()">Send password reset email</button>
      </div>
      <div class="settings-section">
        <h3>Preferences</h3>
        <div class="toggle-row"><span>Email notifications</span><button class="switch on" onclick="this.classList.toggle('on')"></button></div>
        <div class="toggle-row"><span>Dark mode</span><button class="switch ${document.documentElement.getAttribute('data-theme') !== 'light' ? 'on' : ''}" onclick="UI.toggleTheme(); this.classList.toggle('on')"></button></div>
      </div>
      <div class="settings-section">
        <h3>Account</h3>
        <button class="btn btn-danger" style="width:auto" onclick="Auth.logout()">Sign out</button>
      </div>`;
  },

  async saveProfile() {
    const name = document.getElementById('set-name').value.trim();
    await State.user.updateProfile({ displayName: name });
    document.getElementById('user-avatar').textContent = (name || State.user.email)[0].toUpperCase();
    toast('Profile updated', 'success');
  },

  /* ---------- File list pages (uploads / favorites / trash) ---------- */
  renderFileList(c) {
    const list = UI.getVisibleFiles();
    const titleMap = { uploads: 'All Files', favorites: 'Favorites', trash: 'Trash' };
    let title = titleMap[State.page] || 'Files';
    if (State.page === 'uploads' && State.activeFolder && State.folders[State.activeFolder]) {
      title = State.folders[State.activeFolder].name;
    }

    c.innerHTML = `
      <div class="page-head"><div><div class="page-title">${title}</div><div class="page-sub">${list.length} item${list.length !== 1 ? 's' : ''}</div></div></div>
      ${State.page === 'uploads' ? `
        <div class="dropzone" id="files-drop" onclick="document.getElementById('file-input').click()">
          <div class="ic">⬆</div><h3>Drag &amp; drop to upload</h3><p>Multiple files supported, up to ${Utils.fmtSize(MAX_FILE_SIZE)} each</p>
        </div>` : ''}
      <div class="toolbar">
        <select class="select" onchange="State.sort=this.value; UI.render()">
          <option value="date-desc" ${State.sort === 'date-desc' ? 'selected' : ''}>Newest first</option>
          <option value="date-asc" ${State.sort === 'date-asc' ? 'selected' : ''}>Oldest first</option>
          <option value="name-asc" ${State.sort === 'name-asc' ? 'selected' : ''}>Name A–Z</option>
          <option value="name-desc" ${State.sort === 'name-desc' ? 'selected' : ''}>Name Z–A</option>
          <option value="size-desc" ${State.sort === 'size-desc' ? 'selected' : ''}>Largest first</option>
          <option value="size-asc" ${State.sort === 'size-asc' ? 'selected' : ''}>Smallest first</option>
        </select>
        <select class="select" onchange="State.filterType=this.value; UI.render()">
          <option value="all">All types</option>
          <option value="image/">Images</option>
          <option value="video/">Videos</option>
          <option value="audio/">Audio</option>
          <option value="application/">Documents</option>
        </select>
        <div class="view-toggle">
          <button class="${State.view === 'grid' ? 'active' : ''}" onclick="State.view='grid'; UI.render()">▦</button>
          <button class="${State.view === 'list' ? 'active' : ''}" onclick="State.view='list'; UI.render()">☰</button>
        </div>
      </div>
      <div class="bulk-bar" id="bulk-bar">
        <span id="bulk-count">0 selected</span>
        <button onclick="Files.bulkDelete()">Delete selected</button>
        <button onclick="State.selected.clear(); UI.render()">Clear</button>
      </div>
      ${list.length === 0
        ? `<div class="empty-state"><div class="ic">${State.page === 'trash' ? '🗑' : '☁'}</div>${State.page === 'trash' ? 'Trash is empty.' : 'No files here yet.'}</div>`
        : State.view === 'grid'
          ? `<div class="file-grid">${list.map(f => UI.fileCard(f)).join('')}</div>`
          : UI.fileTable(list)
      }`;

    if (State.page === 'uploads') UI.bindDropzone(document.getElementById('files-drop'));
    UI.updateBulkBar();
  },

  fileCard(f) {
    const thumb = f.type.startsWith('image/') ? `<img src="${f.url}" loading="lazy">` : Utils.iconFor(f.type);
    const inTrash = State.page === 'trash';
    return `<div class="file-card">
      <div class="file-thumb" onclick="UI.previewById('${f.id}')">
        <input type="checkbox" class="file-check" onclick="event.stopPropagation(); UI.toggleSelect('${f.id}')" ${State.selected.has(f.id) ? 'checked' : ''}>
        ${!inTrash ? `<button class="file-fav ${f.favorite ? 'active' : ''}" onclick="event.stopPropagation(); Files.toggleFavorite('${f.id}')">★</button>` : ''}
        ${thumb}
      </div>
      <div class="file-body">
        <div class="file-name" title="${Utils.esc(f.name)}">${Utils.esc(f.name)}</div>
        <div class="file-meta"><span>${Utils.fmtSize(f.size)}</span><span>${Utils.fmtDate(f.uploadedAt)}</span></div>
        <div class="file-actions">
          ${inTrash ? `
            <button onclick="Files.restore('${f.id}')">Restore</button>
            <button onclick="UI.confirmPermDelete('${f.id}')">Delete</button>
          ` : `
            <button onclick="Files.download(State.files['${f.id}'])">↓</button>
            <button onclick="Files.share(State.files['${f.id}'])">Share</button>
            <button onclick="UI.confirmSoftDelete('${f.id}')">Del</button>
          `}
        </div>
      </div>
    </div>`;
  },

  fileTable(list) {
    const inTrash = State.page === 'trash';
    return `<div style="background:var(--bg-elev); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden">
      ${list.map(f => `<div class="file-list-row">
        <input type="checkbox" onclick="UI.toggleSelect('${f.id}')" ${State.selected.has(f.id) ? 'checked' : ''}>
        <span style="font-size:16px">${Utils.iconFor(f.type)}</span>
        <span class="fn" onclick="UI.previewById('${f.id}')" style="cursor:pointer">${Utils.esc(f.name)}</span>
        <span class="fm">${Utils.fmtSize(f.size)}</span>
        <span class="fm">${Utils.fmtDate(f.uploadedAt)}</span>
        ${inTrash
          ? `<button class="icon-btn" onclick="Files.restore('${f.id}')">↺</button><button class="icon-btn" onclick="UI.confirmPermDelete('${f.id}')">✕</button>`
          : `<button class="icon-btn" onclick="Files.download(State.files['${f.id}'])">↓</button><button class="icon-btn" onclick="UI.confirmSoftDelete('${f.id}')">✕</button>`}
      </div>`).join('')}
    </div>`;
  },

  previewById(id) { UI.preview(State.files[id]); },

  toggleSelect(id) {
    State.selected.has(id) ? State.selected.delete(id) : State.selected.add(id);
    UI.updateBulkBar();
  },
  updateBulkBar() {
    const bar = document.getElementById('bulk-bar');
    if (!bar) return;
    bar.style.display = State.selected.size > 0 ? 'flex' : 'none';
    const cnt = document.getElementById('bulk-count');
    if (cnt) cnt.textContent = State.selected.size + ' selected';
  },

  confirmSoftDelete(id) { UI.confirm('Move to trash?', 'You can restore this file later from the Trash.', () => Files.softDelete(id)); },
  confirmPermDelete(id) { UI.confirm('Delete permanently?', 'This cannot be undone.', () => Files.permanentDelete(id)); },

  /* ---------- Drag & drop wiring ---------- */
  bindDropzone(el) {
    if (!el) return;
    ['dragenter', 'dragover'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => el.addEventListener(ev, e => { e.preventDefault(); el.classList.remove('drag'); }));
    el.addEventListener('drop', e => { if (e.dataTransfer.files.length) Files.handleFiles(e.dataTransfer.files); });
  }
};
