# EmergingMarketIQ — Landing Page

A premium, production-ready landing page for the **EmergingMarketIQ** Android application. Built with vanilla **HTML, CSS, and JavaScript** so it deploys cleanly to **GitHub Pages** (or any static host) with zero build step.

---

## 1. What's in this project

```
emergingmarketiq/
├── index.html       # Landing page (all 9 sections + meta tags)
├── styles.css       # Premium dark-blue / white design system
├── script.js        # Nav, smooth scroll, reveal animations, email capture
└── README.md        # This file
```

No frameworks, no build tools, no dependencies. Just open `index.html` in a browser and it works.

---

## 2. Quick preview locally

You can simply double-click `index.html` to open it in your browser. If you'd like a local server (recommended so relative paths work the same way they will on GitHub Pages):

```bash
# Python 3
python3 -m http.server 8080
# then visit http://localhost:8080
```

```bash
# Or with Node (if you have it)
npx serve .
```

---

## 3. Deploy to GitHub Pages (step-by-step)

### Option A — Deploy from the `main` branch

1. Create a new public repository on GitHub, e.g. `emergingmarketiq`.
2. From the project folder on your computer:
   ```bash
   git init
   git add .
   git commit -m "Initial landing page"
   git branch -M main
   git remote add origin https://github.com/<your-username>/emergingmarketiq.git
   git push -u origin main
   ```
3. In GitHub, go to **Settings → Pages**.
4. Under **Build and deployment**, set:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Click **Save**. After ~1 minute, your site is live at:
   ```
   https://<your-username>.github.io/emergingmarketiq/
   ```

### Option B — Use a `gh-pages` branch

If you prefer to keep deployment isolated:

```bash
git checkout --orphan gh-pages
git add .
git commit -m "Publish"
git push origin gh-pages
```

Then in **Settings → Pages**, choose the `gh-pages` branch.

---

## 4. Replace the placeholders (important)

Open `index.html` and replace the following before going live:

### 4.1 Google Play Store link

Find every Google Play button (there are two — one in the hero, one in the CTA section):

```html
<a href="#" class="btn btn-play" aria-label="Download on Google Play">
```

Replace `href="#"` with your real Play Store URL, for example:

```html
<a
  href="https://play.google.com/store/apps/details?id=com.yourcompany.emergingmarketiq"
  class="btn btn-play"
  aria-label="Download on Google Play"
  target="_blank"
  rel="noopener"
>
```

### 4.2 Canonical URL, OpenGraph, and Twitter image

Search `index.html` for `yourusername.github.io/emergingmarketiq/` and replace every occurrence with your real site URL (either your `*.github.io` URL or your custom domain).

Replace `@yourhandle` with your real Twitter / X handle.

### 4.3 Social preview image

For LinkedIn / Twitter / WhatsApp previews to look great, add an image at:

```
assets/og-image.png   (1200 × 630 px, < 1 MB, PNG or JPG)
```

…and make sure these tags in `index.html` point to it (they already do by default):

```html
<meta property="og:image" content="https://<your-domain>/assets/og-image.png" />
<meta name="twitter:image" content="https://<your-domain>/assets/og-image.png" />
```

Tip: a clean preview image is a dark-blue background with the EmergingMarketIQ logo, the tagline, and a small "Available on Google Play" badge.

### 4.4 Favicon

The current favicon is an inline SVG ("iQ" on a navy square). To use your own:

1. Drop your icon as `favicon.ico` (or `favicon.png` / `favicon.svg`) in the project root.
2. Replace the `<link rel="icon" ...>` line in `<head>` with:
   ```html
   <link rel="icon" href="favicon.ico" />
   ```

### 4.5 Contact email & social links

The default support email is `supportmarketiq@gmail.com` — already wired into the footer. If you change it later, search `index.html` and `script.js` and replace it. Also update the three social `<a href="#">` links in the footer (LinkedIn, Twitter/X, YouTube) with your real profile URLs.

### 4.6 Privacy policy

The footer has a `Privacy Policy` link pointing to `#`. Replace it with either:

- A link to a hosted privacy policy (required by Google Play), e.g. `privacy.html` in this same repo, or
- An external URL (e.g. on your company site).

---

## 5. Add real app screenshots

The screenshots section currently uses styled HTML/CSS mockups so the page looks complete even before you upload real images. To swap them for real screenshots:

1. Create an `assets/screens/` folder and add your PNG/JPG images (recommended size: ~360 × 760 px or 1080 × 1920 px scaled down).
2. In `index.html`, locate the `<section class="section section-screens">` block.
3. Replace each `<div class="screen-mock-body">…</div>` with an `<img>` like:
   ```html
   <img
     src="assets/screens/dashboard.png"
     alt="EmergingMarketIQ dashboard screenshot"
     loading="lazy"
   />
   ```
4. (Optional) Wrap the image in a phone-style frame for visual consistency — you can re-use the `.phone-frame` styles in `styles.css`.

---

## 6. Wire up the email capture form

By default the form (`#emailForm`) saves the address to the user's browser `localStorage` and shows a confirmation message — that's a safe placeholder so nothing breaks before you have a real provider connected.

To send emails to a real list, open `script.js` and replace the body of `submitEmail()` with one of these:

### Formspree (no backend, free tier)
```js
function submitEmail(email) {
  return fetch('https://formspree.io/f/<your-form-id>', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email: email })
  });
}
```

### Mailchimp embedded form
Paste your Mailchimp embed action URL and switch the form `enctype` to `application/x-www-form-urlencoded`.

### Google Forms
Create a Google Form with a single short-answer "Email" field, copy the form's `formResponse` URL, and POST to it with `fetch` and `mode: 'no-cors'`.

---

## 7. Custom domain (optional)

If you own a domain (e.g. `emergingmarketiq.com`):

1. In your registrar, add these DNS records:
   - `A` records for the apex domain pointing to GitHub's IPs:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - `CNAME` for `www` → `<your-username>.github.io`
2. In your GitHub repo, go to **Settings → Pages → Custom domain**, enter `emergingmarketiq.com`, and save.
3. Create a file named `CNAME` (no extension) in the repo root containing only:
   ```
   emergingmarketiq.com
   ```
4. Tick **Enforce HTTPS** once GitHub finishes issuing the certificate (usually a few minutes).
5. Update every `https://yourusername.github.io/emergingmarketiq/` reference in `index.html` to your new domain.

---

## 8. Marketing share checklist

Before sharing on LinkedIn, Twitter/X, YouTube descriptions, or WhatsApp:

- [ ] Replace canonical URL and OG image URL with the live one
- [ ] Upload `assets/og-image.png` (1200 × 630)
- [ ] Test the LinkedIn preview: https://www.linkedin.com/post-inspector/
- [ ] Test the Twitter/X preview: https://cards-dev.twitter.com/validator (or post a draft)
- [ ] Add real Google Play URL
- [ ] Add real social profile URLs
- [ ] Add `assets/screens/*` real screenshots

---

## 9. SEO notes

- Page title, description, OpenGraph, Twitter card, and Schema.org `MobileApplication` JSON-LD are already in place.
- The page uses **semantic HTML** (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) — good for search engines and screen readers.
- After deploying, submit your site to Google Search Console (https://search.google.com/search-console) so it gets indexed quickly.

---

## 10. Accessibility & performance

- All interactive elements have `aria-label`s where needed.
- Honors `prefers-reduced-motion` — animations are disabled for users who request it.
- No external JS frameworks; only Google Fonts is loaded from CDN.
- Page weight is well under 200 KB before screenshots — ideal for first impressions on mobile.

---

## 11. Editing tips

- **Change colours:** the entire palette is defined as CSS variables at the top of `styles.css` (look for `:root { --navy-800: …; }`). Change one value and the whole site re-themes.
- **Change copy:** all marketing copy lives directly in `index.html`. There's no CMS — open the file, edit the text, save.
- **Add a section:** copy any `<section class="section">…</section>` block, give it a new `id`, and add a link to it in the navbar.

---

## 12. License

This landing page is provided for your own use with the EmergingMarketIQ application. Do whatever you like with it.

---

**Built for global founders, operators, and investors.**
