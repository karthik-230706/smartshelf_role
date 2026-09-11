# SmartShelf — Admin & Customer (v7)

Two completely separate logins, chosen up front on a role picker — both are full **dashboards**, not just a single screen. (Internally the two account types are still stored as `role: "sales" | "user"` — only the on-screen labels are Admin/Customer.)

- **🧑‍💼 Admin** — 📊 Overview dashboard (orders, revenue, money saved for customers, pending approvals, expiry-risk breakdown, low stock, top categories), 📦 Stock & Expiry (camera/barcode/manual add + the expiry alarm), 🏷️ Offer Approvals (accept or keep full price on each expiry discount before it goes live), 🧾 Orders (every order placed by every Customer), and 👤 Profile.
- **🛒 Customer** — 🛍️ Shop (search bar + category chips to browse by category like Fruits/Vegetables, the 🔥 Offer zone tab, cart with a live +/- quantity stepper right on each item card, and UPI/Card/COD checkout), 📊 Dashboard (your orders, spend, and savings), 👤 Profile, and 📍 Address (asked for at checkout time).

Registering/logging in as one account type only grants that account's access — an Admin account can't log into the Customer screen and vice versa (the backend checks this, not just the UI).

## What's new in v7

- **New logo** — the splash/role-picker screen now shows a shopping trolley/basket mark (built as a crisp SVG icon) instead of the old canned-food emoji.
- **Search + categories on the Shop dashboard** — Customers now get a search box (matches item name, brand, or category) plus a row of tappable category chips (Fruits, Vegetables, Dairy, Snacks, ...) above the item grid, so it's easy to jump straight to what you're looking for.
- **Fruits & Vegetables** — added as first-class categories (with their own icons 🍎🥦), plus sample catalog entries (bananas, apples, tomatoes, onions, etc.) an Admin can add stock for.
- **Configurable, persistent database path** — `backend/db.js` now honors a `DB_PATH` environment variable, so when you deploy to a host with a persistent disk/volume, accounts/items/orders survive restarts and redeploys. See "Deploying it somewhere that stays on" below — this is what makes an account created on the live website show the same data on both mobile and PC.

## What's new in v6

- **OTP login (two-factor)** — after your password is verified, a one-time code is required before you get in:
  - **Admin** — an OTP is required on **both** email and mobile number.
  - **Customer** — an OTP is required on the **mobile number** only.
  - This app has no real email/SMS gateway wired up, so it runs in **demo mode**: the OTP is shown right on the verification screen (clearly labeled "Demo mode") instead of actually being texted/emailed. Swap in a real SMS/email provider (Twilio, SES, etc.) before deploying this for real. OTPs expire after 5 minutes; a "Resend OTP" link is on the same screen.
  - Because of this, **registration now also collects a mobile number** (used for the OTP) alongside name, email, and password.
- **Renamed roles in the UI** — "Sales Executive" is now shown as **Admin**, and "User" is now shown as **Customer**, everywhere in the app (role picker, top bar, profile, empty states, etc).
- **Shop-grid quantity stepper** — adding an item to the cart now swaps its "Add to cart" button for an inline **+ / −** stepper directly on the product card, so you can bump the quantity without opening the cart drawer. It stays in sync with the cart drawer's own stepper.
- **Fixed a stacked-modal glitch on "Add address"** — opening "+ Add new address" (or editing an address) from inside checkout used to leave the checkout modal showing behind the address form at the same time. It now hides the checkout modal first and goes straight to the address form, then returns to the checkout address list once you save or close it.

## Everything from v5 (still included)

- **Admin dashboard & profile** — a top nav (Overview / Stock & Expiry / Offer Approvals / Orders / Profile) turns the single stock screen into a full manager-style dashboard: live stat cards (total orders, revenue, money saved for customers, pending approvals), an expiry-risk breakdown (Safe / Expiring Soon / Urgent / Expires Today / Expired), a low-stock reorder table, and top-selling categories.
- **Offer approvals** — an expiry discount no longer reaches customers automatically. As soon as an item enters a new discount tier it shows up under 🏷️ Offer Approvals with **Accept** (make the discount live) or **Keep full price** buttons. If the tier changes again later (e.g. 10% → 20% as it gets closer to expiry), it needs a fresh decision.
- **Orders (Admin)** — every order placed by every Customer, with items, totals, and payment method, most recent first.
- **Customer dashboard, profile & address book** — Customers get their own 📊 Dashboard (orders placed, total spent, total saved via discounts + recent order history), a 👤 Profile they can edit, and a 📍 delivery address book (asked for at order time, not tucked away in a sidebar tab).
- **Expiry alarm (Admin)** — a pulsing banner + beep the moment items enter "Expiring soon"/"Urgent", muteable, with a live count badge next to the Stock & Expiry tab.
- **Camera access (Admin)** — live `getUserMedia` + ZXing barcode scan in the Add Item modal, with fallback to typed barcode / manual entry. Needs HTTPS or `localhost`.
- **Expiry-based discount pricing** — tiered 5%/10%/20%/30% discounts as expiry nears, shown as a red "% OFF" badge — gated behind Offer Approval (see above).
- **Manual-entry item photo** — optional photo upload on the Manual entry tab, used as the item's card image everywhere.
- **Cart & checkout (Customer)** — add to cart, quantity steppers (in the cart drawer and now on the shop grid card itself), and checkout via **UPI**, **Card**, or **Cash on Delivery**. Card/UPI details are validated client-side and never stored raw.
- **Offer zone taskbar (Customer)** — a separate "🔥 Offer zone" tab inside Shop that isolates every currently-discounted item.

## Run it

```bash
cd backend
npm install
npm start
```

That's it — **no extra setup, no manual certificate step.** On startup the server automatically:
- listens on **every network interface** (not just `localhost`), so it's reachable from any device;
- generates a fresh local **HTTPS certificate** covering your current WiFi IP, so the site can be opened securely too;
- prints every URL you can use, plus a **QR code** you can scan directly with your phone's camera.

It'll look like this:

```
SmartShelf backend is running — reachable from this computer AND from
any phone/tablet on the same WiFi network (no "localhost" needed on those):

  This computer only:   http://localhost:4000
  PC or phone (WiFi):    http://192.168.1.23:4000
  PC or phone, HTTPS:    https://192.168.1.23:4443  ← use this one for the camera scanner

  Your browser will warn the HTTPS certificate isn't "trusted" — that's
  expected for a self-signed one made just for your network. Tap
  Advanced → Proceed (wording varies by browser) to continue.

  Scan this on your phone to open it instantly:
  [QR code]
```

### Keep it running after closing the terminal

`npm start` runs in the foreground — closing that terminal window/tab stops the server. To keep it running in the background instead (works the same for either mode below):

```bash
npm run start:bg    # background, same-WiFi mode (Option A)
npm run tunnel:bg   # background, public-URL mode (Option B) — works on any network
npm run logs        # view the URLs/QR code that were printed, and watch new log output live
npm run stop        # stop whichever one is running
```

`start:bg`/`tunnel:bg` refuse to start a second copy if one's already running — run `npm run stop` first if you want to switch modes or restart. This works the same way on Windows, Mac, and Linux — no extra tools needed.

For something more permanent (auto-restart on crash, auto-start on computer boot), a process manager like [pm2](https://pm2.keymetrics.io/) (`npx pm2 start server.js --name smartshelf`) is a good next step, but isn't required for normal local/LAN use.

## Access it from your phone

There are two ways to open the app on your phone, depending on what you need:

### Option A — Same WiFi as your computer (faster, private)

`localhost` only ever means "this same device" — typing `localhost` into your phone's browser points at the phone itself, not your computer, which is why that never worked from mobile.

1. Make sure your phone and computer are on the **same WiFi network**.
2. Either scan the **QR code** `npm start` prints, or type the `https://<ip>:4443` address it prints into your phone's browser (works for PC too — open the same address there instead of `localhost`).
3. Your browser will warn the certificate isn't trusted (expected — it's self-signed, made just for your network). Tap **Advanced → Proceed** (wording varies by browser/OS) to continue.
4. If it still won't connect, either the phone and PC aren't actually on the same WiFi (e.g. different guest/5GHz networks), your firewall is blocking ports 4000/4443, or — common on **campus/office/public WiFi** — the network deliberately blocks devices from reaching each other ("AP/client isolation"). If none of that is fixable on your end, use Option B instead.

Everything works from that one HTTPS address on both PC and phone — shopping/Customer side, Admin dashboard, OTP login, and the camera-based barcode scanner. Since your WiFi IP can change between networks, the certificate is regenerated fresh every time you run `npm start`, so it's always correct.

### Option B — Any network, WiFi or mobile data (works from anywhere)

This gives you a real public internet address, so it works even if your phone is on mobile data, a different WiFi network entirely, or a network that blocks device-to-device traffic (Option A's failure case above). No account/signup needed.

```bash
npm run tunnel         # foreground — prints a public https://…loca.lt URL + QR code
npm run tunnel:bg      # same, but detached (safe to close the terminal — npm run logs / npm run stop apply here too)
```

Open the printed `https://xxxxx.loca.lt` URL (or scan its QR code) on your phone — on WiFi or mobile data, doesn't matter, it's a normal public HTTPS URL so there's no certificate warning either. The very first time a new device opens it, the free tunnel service shows a plain "Friendly Reminder" interstitial page — just click through it once.

Use Option A when phone and PC do share WiFi (it's quicker and keeps everything on your local network); reach for Option B whenever they don't, or you just want a link that works anywhere.

## Camera barcode scanning

Uses [ZXing](https://github.com/zxing-js/library) (loaded from CDN) via `getUserMedia`. Click **Start camera** in the Add Item modal, grant camera permission, and hold a barcode in frame — it decodes automatically and looks up the product.

- Needs **HTTPS or localhost** — browsers block camera access on plain HTTP for any other host, which is exactly what the auto-generated HTTPS URL above solves. If camera access is unavailable for any reason (denied permission, unsupported browser, or an unrecognized barcode), the app clearly explains why in the Add Item modal and falls back to typed-barcode/manual entry — it never breaks the flow.
- If camera access is denied/unsupported, the modal has two fallbacks: **⌨️ Type barcode** (works with USB/Bluetooth scanners too — they just type digits + Enter) and **✏️ Manual entry**.
- Recognized barcodes (from your uploaded zips' real product data) auto-fill name/brand/category/price; unrecognized ones prompt you to switch to manual entry.

## Auth model

- Passwords are SHA-256 hashed, stored in `backend/db.json` (auto-created).
- Each user has a `role: "sales" | "user"` internally (shown as Admin/Customer in the UI), set at registration and enforced on **every** write route server-side (`requireRole("sales")`), not just hidden in the UI.
- **Login is two steps**: `/api/login` checks the password and issues a short-lived OTP challenge (`otpToken` + a demo OTP); `/api/verify-otp` checks the code(s) and only then returns the real session token.
- Token-based sessions via `Authorization: Bearer <token>`, kept in `localStorage`.
- **Demo-grade**, not production-hardened (no bcrypt, no HTTPS enforcement, no rate limiting, no real SMS/email delivery) — swap in a real auth library and messaging provider before deploying publicly.

## API

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/api/register` | — | Create account (`role: "sales"` or `"user"`); requires name, email, mobile number, password |
| POST | `/api/login` | — | Verify password; returns an OTP challenge (`otpToken`, demo OTP values) instead of a token |
| POST | `/api/verify-otp` | — | `{ otpToken, emailOtp?, phoneOtp }` — verify the OTP(s) and get a real session token |
| POST | `/api/resend-otp` | — | `{ otpToken }` — issue a fresh OTP pair for the same pending login |
| POST | `/api/logout` | any | Invalidate token |
| GET | `/api/barcode/:code` | sales (Admin) | Look up a product by barcode |
| GET | `/api/categories` | — | Category list |
| GET | `/api/items` | any | Shared item list, everyone sees the same stock |
| POST | `/api/items` | sales (Admin) | Add item (barcode or manual) |
| PUT | `/api/items/:id` | sales (Admin) | Edit item |
| DELETE | `/api/items/:id` | sales (Admin) | Remove item |
| GET | `/api/summary` | any | Counts by freshness status |
| GET | `/api/alerts` | sales (Admin) | Items currently "soon"/"urgent" — powers the expiry alarm |
| GET | `/api/offers/pending` | sales (Admin) | Items awaiting an offer decision for their current discount tier |
| POST | `/api/offers/:id/decision` | sales (Admin) | `{ approve: true\|false }` — accept the discount or keep full price |
| POST | `/api/checkout` | user (Customer) | Buy the items in your cart; body `{ items:[{id,qty}], paymentMethod:"upi"\|"card"\|"cod", paymentDetails, addressId }` |
| GET | `/api/orders` | user (Customer) | Your own past orders |
| GET | `/api/orders/all` | sales (Admin) | Every order placed by every Customer |
| GET | `/api/overview/sales` | sales (Admin) | Dashboard stats: orders, revenue, money saved, pending approvals, expiry risk, low stock, top categories |
| GET | `/api/overview/user` | user (Customer) | Dashboard stats: your orders, total spent, total saved, recent orders |
| PUT | `/api/profile` | any | Update your own name/mobile number |
| POST/PUT/DELETE | `/api/addresses[/:id]` | user (Customer) | Manage your delivery address book |

## Deploying it somewhere that stays on (e.g. Render)

Running it on your own computer (any of the modes above) only works while that computer is on. To make it reachable even when your PC is off — and to get one website where the same account/data shows up on both mobile and PC — deploy `backend/` to a host that runs 24/7, like [Render](https://render.com):

- **Root Directory:** `backend` (your repo needs both `frontend/` and `backend/` as sibling folders — the backend serves the frontend files from `../frontend`, so if only `backend/` got pushed/deployed, you'll see "Cannot GET /").
- **Build Command:** `npm install`
- **Start Command:** `npm start` (don't use `start:bg` or `tunnel:bg` here — those are only for running on your own PC; the host already keeps the process running for you)
- **Environment Variables:** none required to boot — the host sets `PORT` for you automatically, and `server.js` detects that to skip the LAN/self-signed-HTTPS logic above (the host already provides real HTTPS at its own edge).
- **Free tier note:** free instances spin down after inactivity and take ~10–30s to cold-start on the next visit — normal, not a bug.

### Making "my data stays there" actually true

Every account, item, and order is already stored **server-side** in `backend/db.json` — never in the browser. That's why, once this is deployed as one live website, logging in from a phone and logging in from a PC show the exact same data automatically: both devices are just talking to the same backend over the internet, the same way two people's phones both show the same Instagram data. Nothing about "mobile vs PC" needs special handling.

The one thing that *can* reset that data is the **hosting disk itself** — some free/starter tiers wipe local files on every restart or redeploy. To make it permanent:

1. On Render, add a **Persistent Disk** to the service (Render dashboard → your service → *Disks* → *Add Disk*), e.g. mounted at `/var/data`.
2. Set an environment variable **`DB_PATH=/var/data/db.json`** on the service. `db.js` reads this automatically and will create/read/write the database file on that persistent disk instead of the app's own folder, so it survives restarts and redeploys.
3. Redeploy. From then on, every account and item you add sticks around for good — open the site on your phone, your laptop, anyone's browser: same login, same data, because it all lives on the server.

(Railway/Fly.io/a VPS work the same way — mount a persistent volume and point `DB_PATH` at a file inside it.)

Once deployed, the server logs (visible in the host's dashboard) will clearly say `✅ Frontend found` or `⚠️ Frontend NOT found` right at startup — check that first if the site doesn't load.

## Extending it

- Add more barcodes in `backend/catalog.js`, or point `lookupBarcode` at Open Food Facts' public API for full coverage.
- Wire up a real SMS/email provider in place of the demo OTP values returned by `/api/login` and `/api/resend-otp`.
- Add a third role (e.g. "manager") by extending `requireRole` checks.
- Swap `db.json` for a real database by rewriting only `db.js`.
