# CLAUDE.md

Marketing and inventory site for **786 Habibis Auto LLC**, a used/luxury car dealer. It is a small static site with no build step.

## Stack

- Plain HTML, CSS and vanilla JavaScript. No framework, bundler, package manager or tests.
- Each page is self-contained: its CSS sits in one `<style>` block in `<head>` and its JS in one `<script>` block at the end of `<body>`.
- Fonts come from Google Fonts: **Playfair Display** for headings and **DM Sans** for body text. There are no other external dependencies.
- **No backend.** Car inventory is kept in the browser's `localStorage` (see "Data model" below).

## Folder structure

Everything lives at the repo root:

| File | Purpose |
| --- | --- |
| `index.html` | Landing page served at the domain root. Has a hero, a 2-car inventory preview, an About section and a Contact section. |
| `habibi-auto.html` | **An exact copy of `index.html`.** Other pages link to this file (`admin.html` → `habibi-auto.html`, `inventory.html` → `habibi-auto.html#about` / `#contact`). |
| `inventory.html` | Full inventory grid, rendered from `localStorage`. |
| `admin.html` | Admin panel behind a password: add a car (with photo upload), list cars, delete cars. |
| `elantra.jpg`, `porsche.jpg` | Photos for the two default cars. |

## Running locally

There is nothing to install or build. Serve the folder over HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

Opening the files directly (`file://`) mostly works too. However, `localStorage` is scoped per origin, so inventory data you add through `file://` won't show up at `http://localhost`, and the other way round. To reset the inventory to the defaults, clear the `habibi_cars` key in DevTools → Application → Local Storage.

## Data model

All three pages read and write a single `localStorage` key, `habibi_cars`, which holds a JSON array of cars:

```js
{
  id: 1,                       // number; admin uses Date.now() for new cars
  photo: 'elantra.jpg',        // relative path OR a JPEG data URL (admin uploads)
  badge: 'Hot Deal 🔥',        // badge text
  badgeType: 'hot',            // 'hot' | 'perf' → .badge-hot / .badge-perf
  make: 'Hyundai',
  year: '2025',                // string
  name: 'Elantra SEL Sedan 4D',
  specs: [{ label: 'Mileage', value: '17,400 mi' }],  // up to 4 entries
  highlights: ['Smog Done'],   // string tags
  price: '15,500'              // preformatted string, no "$"
}
```

- When the key is missing, each page seeds it from its own `DEFAULT_CARS` array. **This array is copied into `index.html`, `habibi-auto.html`, `inventory.html` and `admin.html`.** If you change the defaults or the schema, update all four. (The copy in `index.html`/`habibi-auto.html` leaves `highlights` empty because the preview doesn't show them.)
- Admin photo uploads are shrunk on a canvas to at most 900×600 JPEG at quality 0.78 and stored inline as data URLs. `localStorage` has a limit of about 5 MB, so only a limited number of uploaded cars will fit.

## Key conventions

- **Keep `index.html` and `habibi-auto.html` identical.** Any edit to one goes into the other (e.g. `cp index.html habibi-auto.html`). You can also point the links at `index.html` and remove the duplicate, but that change needs to be made on purpose, not left half done.
- **Design tokens** are CSS custom properties on `:root` in each page (`--white`, `--cream`, `--black`, `--gold`, `--gold-light`, `--mid`, `--nav-h`). Each page defines its own copy, so keep them consistent between pages. Use the tokens instead of hard-coded colors.
- CSS sections begin with banner comments such as `/* ── SECTION NAME ── */`, and JS sections use `// ── Name ──`. Follow the same pattern.
- Cards are HTML built with template literals and assigned through `innerHTML`, with class names shared between pages (`car-card`, `card-img`, `card-badge`, `card-body`, `card-price`, `btn-inquire`, …).
- Responsive breakpoints: `768px` and `480px` on the public pages, `900px` and `480px` in admin. Mobile nav is a hamburger (`#hamburger` toggles `.open` on `#navLinks`).
- Contact details (phone `503-810-1552`, email `786habibis.autollc@gmail.com`) are hard-coded in the Contact section.

## Known limitations (read before changing behavior)

- **Inventory is stored per browser.** Cars added in `admin.html` exist only in the admin's own browser. Real visitors always see `DEFAULT_CARS`. To publish inventory to everyone, either edit `DEFAULT_CARS` in all four files or add a real backend/data file.
- **The admin password is not real security.** It is a plaintext constant (`PASSWORD`) in `admin.html`'s client-side JS, so anyone can read it with View Source. Don't treat the admin page as protected.
- **The contact form sends nothing.** `handleContact` only animates the button and resets the form. Wiring it up requires a form service or backend.
- Card fields are placed into `innerHTML` without escaping. That is acceptable only because the admin is the only one entering data.
