# AdSense review checklist

Steps for you, in order. The code side is on the `feat/pwa-adsense` branch. Don't click "Request review" until step 7.

## 1. Fix www (Namecheap)

`www.bayanwin.net` shows a Namecheap parking page today. Google can count that page as yours.

1. In Namecheap, open Domain List, then bayanwin.net, then Advanced DNS.
2. Delete the `www` CNAME record that points to `parkingpage.namecheap.com`.
3. On the Domain tab, make sure parking and any old redirect are off.
4. Map www to Cloud Run. Namecheap's URL Redirect Record works over HTTP only (port 443 doesn't answer), so use Cloud Run:
   1. Cloud Console, Cloud Run, **Manage custom domains**, **Add mapping**: pick `lof-frontend` (asia-southeast1) and enter `www.bayanwin.net`. Or:

      ```
      gcloud beta run domain-mappings create --service lof-frontend --domain www.bayanwin.net --region asia-southeast1
      ```
   2. In Namecheap, delete the `www` URL Redirect Record and add a **CNAME**: host `www`, value `ghs.googlehosted.com.`
   3. Wait for Cloud Run to show the certificate as active (15 minutes to 24 hours).
   4. Deploy this branch: `nginx.conf` sends `www.bayanwin.net` to `https://bayanwin.net` with a 301.
5. Check it. Both should show a 301 to `https://bayanwin.net/`, never the Namecheap page or a certificate error:

   ```
   curl -I http://www.bayanwin.net/
   curl -I https://www.bayanwin.net/
   ```

## 2. Fix the contact email

The site now shows `hello@bayanwin.net`.

1. In Namecheap, Redirect Email: type only `hello` as the alias (Namecheap adds `@bayanwin.net`), forward to your Gmail.
2. In Advanced DNS, Mail Settings: choose **Email Forwarding**.
3. Send a test email to `hello@bayanwin.net` from another account. Deploy only after it arrives.

## 3. Deploy

1. Review the branch, then deploy the frontend (Cloud Build, `frontend/cloudbuild.yaml`). The Docker build now runs `scripts/check-dist.mjs` and fails if an ad rule breaks.
2. Optional first: deploy a no-traffic revision and test it:

   ```
   gcloud run deploy <service> --source frontend --no-traffic --tag pwa
   ```

## 4. Check the live site

Each of these should load with status 200:

- https://bayanwin.net/manifest.webmanifest
- https://bayanwin.net/favicon.ico
- https://bayanwin.net/icons/favicon-192.png
- https://bayanwin.net/og-image.png
- https://bayanwin.net/ads.txt
- https://bayanwin.net/robots.txt
- https://bayanwin.net/sitemap.xml

Then view the page source (Ctrl+U):

- `/`: has `<meta name="google-adsense-account" ...>` and **no** `adsbygoogle.js`.
- `/methodology`: has `adsbygoogle.js` in `<head>`, right after the small `pauseAdRequests` script.
- `/blog`, `/contact`, `/privacy`, `/terms`, `/responsible-play`: no `adsbygoogle.js`.
- A made-up URL such as `/abc`: shows the 404 page and returns status 404.

On your phone: open `/`, tap **Add to your phone**, install, and open BayanWin from the icon.

## 5. Search Console

1. Use a **Domain** property for `bayanwin.net` (covers www and http).
2. Sitemaps: submit `https://bayanwin.net/sitemap.xml`.
3. URL Inspection on `https://bayanwin.net/`: Test live URL, then Request indexing. Do the same for `/methodology` and `/about`.
4. Pages report: look for "Crawled, currently not indexed" on the articles. Request indexing for any you find.

## 6. AdSense settings

1. Sites: the site is `bayanwin.net` (not www). ads.txt status is **Authorized**.
2. Ads, then By site, then Auto ads: turn **Anchor ads** and **Vignette ads** off for now. Keep in-page ads on.
3. Page exclusions: add `/`, `/blog`, `/responsible-play`, `/privacy`, `/terms`, and `/contact`. This is a second safety net; the code already keeps ads off these pages.
4. Privacy & messaging: create a **European regulations** message (Google's certified consent tool) for visitors from the EEA, the UK, and Switzerland. Our own cookie banner covers everyone else.

## 7. Wait, then request review once

1. Wait 2 to 4 weeks so Google recrawls the new pages and the fixed www.
2. In that time, publish 1 or 2 of the new guides (the owner approves the drafts, then they get added to the site, the sitemap, and later to `AD_ELIGIBLE_PATHS`).
3. Click **Request review** once.

## If it's rejected again

1. Open the Policy center and read the example URL and the screenshot Google gives.
2. Send both to the developer before changing anything else. The example URL tells us which page Google judged, which is usually the fastest way to the real cause.
