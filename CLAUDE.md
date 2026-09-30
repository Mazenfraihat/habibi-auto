# CLAUDE.md

Marketing and inventory site for **786 Habibis Auto LLC**, a used/luxury car dealer. It is a small static site with no build step.

## Stack

- Plain HTML, CSS and vanilla JavaScript. No framework, bundler, package manager or tests.
- Each page is self-contained: its CSS sits in one `<style>` block in `<head>` and its page JS in one `<script>` block at the end of `<body>`.
- **Supabase** is the backend: Postgres tables for cars and contact messages, Supabase Auth for the admin login, and Supabase Storage for car photos. `@supabase/supabase-js@2` is loaded from the jsDelivr CDN as a UMD script (global `supabase`).
- Fonts come from Google Fonts: **Playfair Display** for headings and **DM Sans** for body text.

## Folder structure

Everything lives at the repo root, apart from the SQL:

| File | Purpose |
| --- | --- |
| `index.html` | Landing page: hero, 2-car inventory preview, About, and Contact (the form saves to `contact_messages`). |
| `inventory.html` | Full inventory grid, loaded from the `cars` table. |
| `admin.html` | Admin panel. Sign in with Supabase Auth (email + password), then add cars (photo uploaded to Storage) or delete them. |
| `supabase-config.js` | `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Fill in per project. |
| `supabase-client.js` | Shared client (`sb`), `PHOTO_BUCKET`, `esc()` HTML escaping, `rowToCar()`, `fetchCars()`. |
| `supabase/schema.sql` | Tables, RLS policies, the `is_admin()` function, the `car-photos` bucket and its policies, and seed data. Idempotent. |
| `elantra.jpg`, `porsche.jpg` | Photos for the two seeded cars, referenced by relative path. |

Every page loads these scripts in this order: supabase-js CDN → `supabase-config.js` → `supabase-client.js` → the page's inline script. Top-level `const`s in those files (`sb`, `PHOTO_BUCKET`) are globals shared with the inline script.

## Running locally

There is nothing to install or build. Fill in `supabase-config.js`, then serve the folder over HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

The pages need a Supabase project set up as described in "Supabase setup" below. Serve over `http://`, not `file://`, so auth sessions and requests behave as they will in production.

## Supabase setup (one time per project)

1. Create a project. Copy the Project URL and the anon public key (Project Settings → API) into `supabase-config.js`.
2. In the SQL Editor, run `supabase/schema.sql`. This creates the tables, policies and `car-photos` bucket, and seeds the two original cars.
3. Under Authentication → Users → Add user, create the admin's email and password. Under Authentication → Sign In / Providers, turn off "Allow new users to sign up".
4. Make that user an admin:
   `insert into public.admin_users (user_id) select id from auth.users where email = 'admin@example.com';`
5. Under Authentication → URL Configuration, set the Site URL to the deployed domain.

## Data model

`public.cars` (read by everyone, written only by admins):

| Column | Notes |
| --- | --- |
| `id` | identity; lists are ordered by `id` |
| `make`, `year`, `name`, `price` | text; `price` is preformatted (`'15,500'`, no `$`) |
| `badge`, `badge_type` | `badge_type` is `'hot'` or `'perf'` → `.badge-hot` / `.badge-perf` |
| `specs` | jsonb `[{ "label": "Mileage", "value": "17,400 mi" }, …]`, up to 4 from the admin form |
| `highlights` | `text[]` |
| `photo_url` | public Storage URL, or a relative path for the bundled images |
| `photo_path` | object path in the `car-photos` bucket; null for bundled images. Used to delete the file along with the car. |

`rowToCar()` in `supabase-client.js` maps rows to the camelCase car objects that the page templates use (`photo`, `badgeType`, …). If you add a column, update `rowToCar()` too.

`public.contact_messages` holds `name`, `phone`, `car_interest` (the selected option's label), `message` and `created_at`. Anyone can insert. Only admins can read or delete, and for now they do that in the Supabase dashboard.

`public.admin_users (user_id)` decides who counts as an admin. `public.is_admin()` checks it and is used by every write policy. `admin.html` calls it after sign-in and signs out users who aren't on the list.

## Key conventions

- **Schema changes go in `supabase/schema.sql`** and must stay safe to re-run (`if not exists`, `drop policy if exists` before `create policy`, `on conflict do nothing`).
- **Security depends on RLS, not the client.** The anon key in `supabase-config.js` is public by design. Never commit the `service_role` key. Every new table needs RLS enabled plus explicit policies.
- **Escape before `innerHTML`.** Values from the database go through `esc()` when interpolated into template-literal HTML.
- **Design tokens** are CSS custom properties on `:root` in each page (`--white`, `--cream`, `--black`, `--gold`, `--gold-light`, `--mid`, `--nav-h`). Each page defines its own copy, so keep them consistent between pages. Use the tokens instead of hard-coded colors.
- CSS sections begin with banner comments such as `/* ── SECTION NAME ── */`, and JS sections use `// ── Name ──`. Follow the same pattern.
- Cards are HTML built with template literals and assigned through `innerHTML`, with class names shared between pages (`car-card`, `card-img`, `card-badge`, `card-body`, `card-price`, `btn-inquire`, …).
- Responsive breakpoints: `768px` and `480px` on the public pages, `900px` and `480px` in admin. Mobile nav is a hamburger (`#hamburger` toggles `.open` on `#navLinks`).
- Contact details (phone `503-810-1552`, email `786habibis.autollc@gmail.com`) are hard-coded in the Contact section.
- The home page is `index.html`. Link to `index.html#about` / `index.html#contact` from other pages.

## Known limitations

- Nothing notifies the dealer when a contact message arrives. Messages are only visible in the Supabase dashboard (Table Editor → `contact_messages`).
- There is no way to edit a car. The admin can add and delete, but the update policy exists already if an edit UI gets added.
- The hero stat "2+ Cars Available" is static text.
