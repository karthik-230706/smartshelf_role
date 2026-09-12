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

// --------------------------------------------------------------------------
// Optional free persistence: MongoDB Atlas.
//
// Free hosts like Render's free tier wipe the local disk on every restart /
// spin-down, so the file above alone doesn't survive. If a MONGODB_URI env
// var is set (pointing at a free MongoDB Atlas cluster), this module treats
// Mongo as the durable backup: on startup it pulls the latest saved state
// down into the local file, and every writeDB() call pushes the latest state
// back up to Mongo in the background. readDB()/writeDB() themselves stay
// perfectly synchronous — server.js does not need to change how it calls them.
//
// If MONGODB_URI isn't set, everything behaves exactly as before (local file
// only, resets on hosts without a persistent disk).
const MONGODB_URI = process.env.MONGODB_URI || null;
let mongoCollection = null;

// Resolved once the initial Mongo -> local-file sync (if any) has finished.
// server.js awaits this once, before it starts listening, so the very first
// requests already see the latest saved data instead of a blank db.json.
let readyResolve;
const readyPromise = new Promise((res) => { readyResolve = res; });

if (MONGODB_URI) {
  (async () => {
    try {
      const { MongoClient } = require("mongodb");
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      mongoCollection = client.db("smartshelf").collection("state");
      const saved = await mongoCollection.findOne({ _id: "main" });
      if (saved) {
        const { _id, ...data } = saved;
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log("✅ Restored SmartShelf data from MongoDB Atlas.");
      } else {
        console.log("ℹ️  Connected to MongoDB Atlas — no saved data yet, starting fresh.");
      }
    } catch (err) {
      console.warn(`⚠️  Couldn't connect to MongoDB Atlas (${err.message}).`);
      console.warn(`   Continuing with local file storage only — data will NOT survive a restart on hosts without a persistent disk.`);
    } finally {
      readyResolve();
    }
  })();
} else {
  console.log("ℹ️  MONGODB_URI not set — using local file storage only.");
  console.log("   On hosts without a persistent disk (e.g. Render's free tier), data resets on every restart.");
  readyResolve();
}

// server.js calls this once at startup, before app.listen(), so the initial
// Mongo sync (if configured) has a chance to finish first.
function ready() {
  return readyPromise;
}

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
  // Fire-and-forget backup to MongoDB Atlas — doesn't block or slow down the
  // request. If it fails (network blip, etc.), the local file still has the
  // latest data; the next successful write will catch Mongo back up.
  if (mongoCollection) {
    mongoCollection
      .replaceOne({ _id: "main" }, { _id: "main", ...db }, { upsert: true })
      .catch((err) => console.warn("⚠️  Couldn't back up to MongoDB Atlas:", err.message));
  }
}

module.exports = { readDB, writeDB, ready };
