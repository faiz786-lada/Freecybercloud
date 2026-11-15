/**
 * Authentication: sign up, sign in, password reset, sign out,
 * plus the persistent auth-state listener that swaps between the
 * auth screen and the main app shell.
 */
const Auth = {
  showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
  },
  showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  },

  async signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;
    const errEl = document.getElementById('signup-error');
    errEl.style.display = 'none';

    if (!email || !pass || pass.length < 6) {
      errEl.textContent = 'Please enter a valid email and a password of at least 6 characters.';
      errEl.style.display = 'block';
      return;
    }
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      if (name) await cred.user.updateProfile({ displayName: name });
      await cred.user.sendEmailVerification();
      await db.ref('users/' + cred.user.uid + '/settings').set({ theme: 'dark', notifications: true });
      toast('Account created. Check your email to verify.', 'success');
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  },

  async login() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';

    if (!email || !pass) {
      errEl.textContent = 'Enter your email and password.';
      errEl.style.display = 'block';
      return;
    }
    try {
      await auth.signInWithEmailAndPassword(email, pass);
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
    }
  },

  async resetPassword() {
    const email = document.getElementById('login-email').value.trim();
    const noteEl = document.getElementById('login-note');
    if (!email) { toast('Enter your email above first.', 'error'); return; }
    try {
      await auth.sendPasswordResetEmail(email);
      noteEl.textContent = 'Password reset email sent.';
      noteEl.style.display = 'block';
    } catch (e) {
      toast(e.message, 'error');
    }
  },

  logout() {
    auth.signOut();
  }
};

/** Central auth-state listener — drives which screen is visible. */
auth.onAuthStateChanged(user => {
  if (user) {
    State.user = user;
    document.getElementById('auth-screen').style.display = 'none';
    const landing = document.getElementById('seo-landing'); if (landing) landing.style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user-avatar').textContent = (user.displayName || user.email || 'U')[0].toUpperCase();
    Data.listen();
  } else {
    State.user = null;
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    const landing = document.getElementById('seo-landing'); if (landing) landing.style.display = 'block';
  }
});
