<<<<<<< HEAD
# FreeCyberCloud

100% free private cloud storage (no payment / subscription). Static site: HTML + CSS + JS,
Firebase Authentication + Firebase **Realtime Database**. Live: https://freecybercloud.netlify.app

## Setup (ek baar)
1. **Firebase Console → Authentication → Sign-in method** → *Email/Password* enable karo.
   Authentication → Settings → *Authorized domains* me `freecybercloud.netlify.app` add karo.
2. **Build → Realtime Database → Create database**. Phir **Data** tab me jo URL dikhe
   (`https://...firebaseio.com` ya `...firebasedatabase.app`) wo `js/firebase-config.js` ke
   `databaseURL` se match karna chahiye — warna wahan paste kar do.
3. **Realtime Database → Rules** me `database_rules.json` ka poora content paste karke *Publish* karo.
4. Is poore folder ko Netlify par deploy karo (site name: `freecybercloud`). Build command/env vars ki zaroorat nahi.

## Search indexing
- `sitemap.xml`, `robots.txt`, canonical, Open Graph, JSON-LD (WebSite, WebApplication, FAQ) ready hain.
- Google Search Console → URL-prefix property `https://freecybercloud.netlify.app` add karo →
  verification ka HTML meta tag `index.html` me commented jagah par daalo → Sitemaps me `sitemap.xml` submit karo →
  URL Inspection se homepage par *Request indexing* dabao.
=======
# Freecybercloud
>>>>>>> bab21a86e419b08d9f98e6363160efff4631101b
