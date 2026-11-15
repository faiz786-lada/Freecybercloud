/**
 * Single source of truth for in-memory app state.
 * Populated by Data.listen() (Realtime Database listeners) and
 * mutated by user interactions in ui.js / files.js / folders.js.
 */
const State = {
  user: null,          // current Firebase user object
  files: {},           // { fileId: { name, url (Base64 data URL), type, size, uploadedAt, folder, favorite, deleted } }
  folders: {},         // { folderId: { name, createdAt } }
  page: 'dashboard',   // current route: dashboard | uploads | folders | favorites | trash | settings
  view: 'grid',        // grid | list
  sort: 'date-desc',   // date-desc | date-asc | name-asc | name-desc | size-desc | size-asc
  filterType: 'all',   // all | image/ | video/ | audio/ | application/
  activeFolder: null,  // folderId currently open, or null
  selected: new Set()  // fileIds selected for bulk actions
};
