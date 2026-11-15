/**
 * Firebase configuration & SDK bootstrap — FreeCyberCloud.
 * Uses the compat SDK so the rest of the app can use the classic
 * firebase.auth() / firebase.database() API.
 *
 * Database: Firebase Realtime Database (project: cybercloud-835ba).
 * Files are stored as Base64 data URLs inside the Realtime Database
 * (see js/files.js), so no Firebase Storage / paid plan is needed.
 *
 * NOTE: If your Realtime Database URL in Firebase Console is different
 * from the one below (e.g. a regional URL ending in
 * ".firebasedatabase.app"), copy it from
 * Console -> Build -> Realtime Database -> Data and paste it here.
 */
const firebaseConfig = {
  apiKey: "AIzaSyAP9lTYcDgeyzAXcJ3t6iqTNCkcekqE_AM",
  authDomain: "cybercloud-835ba.firebaseapp.com",
  databaseURL: "https://cybercloud-835ba-default-rtdb.firebaseio.com",
  projectId: "cybercloud-835ba",
  storageBucket: "cybercloud-835ba.firebasestorage.app",
  messagingSenderId: "294850430342",
  appId: "1:294850430342:web:63db236818080c112fd807",
  measurementId: "G-DCJ5WJ0ZXY"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();

// Analytics is optional — never let it break the app (ad-blockers, http, etc.)
try {
  if (firebase.analytics) firebase.analytics();
} catch (e) {
  console.warn('Analytics unavailable:', e.message);
}
