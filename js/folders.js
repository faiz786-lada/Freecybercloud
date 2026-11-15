/**
 * Folder operations: create a folder, open a folder (filters the
 * "All Files" view down to that folder's contents).
 */
const Folders = {
  async create() {
    const input = document.getElementById('folder-name-input');
    const name = input.value.trim();
    if (!name) { toast('Enter a folder name', 'error'); return; }

    const id = 'fld_' + Date.now();
    await db.ref('users/' + State.user.uid + '/folders/' + id).set({ name, createdAt: Date.now() });
    input.value = '';
    UI.hide('folder-overlay');
    toast('Folder created', 'success');
  },

  open(id) {
    State.activeFolder = id;
    UI.goTo('uploads');
  }
};
