const fs = require("fs");
const path = require("path");

// All accounts/items/orders live in this one JSON file on the SERVER's disk —
// never in the browser. That's what makes data show up the same way whether
// a customer opens the site on their phone or their PC: both devices just
// talk to this same backend/API, not to anything stored locally in the browser.
//
// By default this file sits next to server.js. When deploying somewhere with
// a persistent disk/volume (Render persistent disk, Railway volume, Fly.io
// volume, a VPS, etc.), set the DB_PATH env var to a path inside that mounted
// volume so the file survives restarts and redeploys instead of resetting.
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "db.json");

// Make sure the parent folder exists (useful when DB_PATH points into a
// freshly-mounted, empty volume).
const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const EMPTY_DB = {
  nextUserId: 1,
  nextItemId: 1,
  nextOrderId: 1,
  nextAddressId: 1,
  users: [], // { id, name, email, passwordHash, token, role: 'sales'|'user', phone, addresses: [{id,label,line1,city,state,pincode,phone,isDefault}] }
  items: [], // { id, addedByUserId, addedByName, name, brand, category, barcode, mfd, expiry, price, quantity, source, photo, discountApproved, lastDecidedPct, addedAt }
  orders: [], // { id, userId, userName, items: [{itemId,name,category,qty,priceEach,originalPriceEach,lineTotal}], paymentMethod, paymentSummary, total, placedAt }
  otpSessions: [], // { otpToken, userId, emailOtp|null, phoneOtp, emailVerified, phoneVerified, expiresAt } — short-lived login OTP challenges
};

function readDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  // migrate older db.json files that predate orders/photo/profile/offer-approval/multi-address support
  if (!db.orders) db.orders = [];
  if (!db.nextOrderId) db.nextOrderId = 1;
  if (!db.nextAddressId) db.nextAddressId = 1;
  if (!Array.isArray(db.otpSessions)) db.otpSessions = [];
  db.users.forEach((u) => {
    if (u.phone === undefined) u.phone = "";
    if (!Array.isArray(u.addresses)) {
      // migrate the old single-address shape into the new addresses list
      u.addresses = u.address ? [{ id: db.nextAddressId++, label: "Home", ...u.address, isDefault: true }] : [];
    }
    delete u.address;
  });
  db.items.forEach((i) => {
    if (i.discountApproved === undefined) i.discountApproved = null;
    if (i.lastDecidedPct === undefined) i.lastDecidedPct = null;
  });
  return db;
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { readDB, writeDB };
