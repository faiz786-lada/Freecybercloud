/**
 * Realtime Database subscriptions.
 * Keeps State.files / State.folders in sync with Firebase and
 * triggers a re-render on every change (live, cross-device updates).
 */
const Data = {
  listen() {
    const uid = State.user.uid;

    db.ref('users/' + uid + '/files').on('value', snap => {
      State.files = snap.val() || {};
      UI.render();
    });

    db.ref('users/' + uid + '/folders').on('value', snap => {
      State.folders = snap.val() || {};
      UI.render();
    });
  }
};
