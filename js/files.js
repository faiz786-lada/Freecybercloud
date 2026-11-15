/**
 * File operations — Base64 / Realtime-Database-only edition.
 *
 * Firebase Storage needs the paid "Blaze" plan, so instead of
 * uploading bytes to Storage we read each file as a Base64 data URL
 * (FileReader) and write that string straight into the Realtime
 * Database alongside its metadata. This works entirely on the free
 * "Spark" plan, at the cost of a hard per-file size limit — Base64
 * inflates size by ~33%, and very large DB nodes are slow to sync
 * and expensive to read on every page load.
 */

// Keep individual files well under the Realtime Database's practical
// limits. Raise this if your plan/usage can support it, but keep in
// mind every byte here is also duplicated in RAM on every client that
// loads the file list.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file

const Files = {
  handleFiles(fileList) {
    const arr = Array.from(fileList);
    if (!arr.length) return;

    const tooBig = arr.filter(f => f.size > MAX_FILE_SIZE);
    const ok = arr.filter(f => f.size <= MAX_FILE_SIZE);

    tooBig.forEach(f => toast(
      `${f.name} is ${Utils.fmtSize(f.size)} — over the ${Utils.fmtSize(MAX_FILE_SIZE)} per-file limit.`,
      'error'
    ));
    if (!ok.length) return;

    const panel = document.getElementById('upload-panel');
    const list = document.getElementById('up-list');
    panel.style.display = 'block';
    document.getElementById('up-title').textContent = 'Uploading ' + ok.length + ' file' + (ok.length > 1 ? 's' : '');

    ok.forEach(file => Files.uploadOne(file, list));
  },

  uploadOne(file, list) {
    const uid = State.user.uid;
    const id = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    const item = document.createElement('div');
    item.className = 'up-item';
    item.innerHTML = `
      <div class="up-row"><span class="nm">${Utils.esc(file.name)}</span><span class="pct">0%</span></div>
      <div class="up-track"><div class="up-fill"></div></div>`;
    list.appendChild(item);
    const fill = item.querySelector('.up-fill');
    const pct = item.querySelector('.pct');

    const reader = new FileReader();

    // FileReader gives us real progress events while it reads the
    // file into memory and encodes it — this is the "upload" step now.
    reader.onprogress = evt => {
      if (!evt.lengthComputable) return;
      const p = Math.round((evt.loaded / evt.total) * 100);
      fill.style.width = p + '%';
      pct.textContent = p + '%';
    };

    reader.onerror = () => {
      fill.classList.add('fail');
      pct.textContent = 'Failed';
      toast('Could not read: ' + file.name, 'error');
    };

    reader.onload = async () => {
      fill.style.width = '100%';
      pct.textContent = 'Saving...';
      try {
        const base64Url = reader.result; // data:<mime>;base64,....
        await db.ref('users/' + uid + '/files/' + id).set({
          name: file.name,
          url: base64Url,
          type: file.type || 'application/octet-stream',
          size: file.size,
          uploadedAt: Date.now(),
          folder: State.activeFolder || null,
          favorite: false,
          deleted: false
        });
        fill.classList.add('done');
        pct.textContent = 'Done';
        toast(file.name + ' uploaded', 'success');
      } catch (e) {
        fill.classList.add('fail');
        pct.textContent = 'Failed';
        toast('Upload failed: ' + file.name + ' — ' + e.message, 'error');
      } finally {
        setTimeout(() => {
          if (item.parentNode) item.remove();
          if (!list.children.length) document.getElementById('upload-panel').style.display = 'none';
        }, 1500);
      }
    };

    reader.readAsDataURL(file);
  },

  async toggleFavorite(id) {
    const f = State.files[id];
    await db.ref('users/' + State.user.uid + '/files/' + id + '/favorite').set(!f.favorite);
  },

  async softDelete(id) {
    await db.ref('users/' + State.user.uid + '/files/' + id + '/deleted').set(true);
    toast('Moved to trash', 'success');
  },

  async restore(id) {
    await db.ref('users/' + State.user.uid + '/files/' + id + '/deleted').set(false);
    toast('File restored', 'success');
  },

  async permanentDelete(id) {
    // No Storage object to clean up — the file only ever lived as a
    // Base64 string inside this Database node.
    await db.ref('users/' + State.user.uid + '/files/' + id).remove();
    toast('File permanently deleted', 'success');
  },

  download(f) {
    const a = document.createElement('a');
    a.href = f.url; // data URL — downloads directly, no network round-trip
    a.download = f.name;
    a.click();
  },

  share(f) {
    // There is no hosted URL anymore — "sharing" copies the raw
    // Base64 data itself, which only works if the recipient pastes
    // it somewhere that can render a data URL. Make that clear.
    navigator.clipboard?.writeText(f.url)
      .then(() => toast('File data copied. Note: this is raw embedded data, not a real shareable link.', 'info'))
      .catch(() => toast('Could not copy to clipboard.', 'error'));
  },

  bulkDelete() {
    State.selected.forEach(id => Files.softDelete(id));
    State.selected.clear();
    UI.render();
  }
};
