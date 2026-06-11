// seed-test-orders.js
// One-off helper to populate the orders table with 100 clearly-marked TEST orders
// so we can exercise the admin Orders pagination.
//
//   Add 100 test orders:   node seed-test-orders.js
//   Remove them again:     node seed-test-orders.js --remove
//
// Every test order is tagged with idempotency_key = 'TEST-SEED-<n>', so removal is
// exact and can never affect real orders. (Real orders have NULL or a UUID key.)
// Inserts go straight to the DB, bypassing the API — so no rate limiting and no emails.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const FIRST = ['Lina', 'Karim', 'Maya', 'Omar', 'Nour', 'Rami', 'Sara', 'Jad', 'Yara', 'Tarek', 'Dana', 'Fadi', 'Reem', 'Sami', 'Hala', 'Ziad', 'Lara', 'Bassel', 'Nada', 'Elie'];
const LAST  = ['Haddad', 'Khoury', 'Saad', 'Nassar', 'Aoun', 'Fares', 'Rizk', 'Gerges', 'Sleiman', 'Daher', 'Najjar', 'Karam', 'Chami', 'Younes', 'Mansour'];
const CITIES = ['Beirut', 'Tripoli', 'Saida', 'Jounieh', 'Byblos', 'Zahle', 'Tyre', 'Baabda', 'Aley', 'Batroun', 'Zgharta', 'Nabatieh'];
// Weighted so the status breakdown looks realistic in the admin view.
const STATUSES = ['pending', 'pending', 'confirmed', 'confirmed', 'shipped', 'delivered', 'delivered', 'cancelled'];
const PRODUCTS = [
  { name: 'Titanium Labret Stud',     price: 24 },
  { name: 'Surgical Steel Hoop',      price: 18 },
  { name: '18k Gold Plated Huggie',   price: 32 },
  { name: 'Titanium Nose Ring',       price: 20 },
  { name: 'Opal Cartilage Earring',   price: 28 },
  { name: 'Gold Plated Belly Bar',    price: 35 },
  { name: 'Steel Septum Clicker',     price: 26 },
  { name: 'Titanium Flat Back Stud',  price: 22 },
];
const COLORS = ['gold', 'silver', 'titanium'];
const SIZES  = ['6mm', '8mm', '10mm', 'One Size'];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed(count = 100) {
  let inserted = 0;
  for (let i = 1; i <= count; i++) {
    const itemCount = randInt(1, 3);
    const items = [];
    let subtotal = 0;
    for (let k = 0; k < itemCount; k++) {
      const p = pick(PRODUCTS);
      const qty = randInt(1, 2);
      subtotal += p.price * qty;
      items.push({ name: p.name, price: p.price, qty, size: pick(SIZES), color: pick(COLORS) });
    }
    const deliveryFee = subtotal >= 75 ? 0 : 3;
    const total = subtotal + deliveryFee;
    const building = randInt(0, 1) ? `Floor ${randInt(1, 8)}, Apt ${randInt(1, 20)}` : null;
    const daysAgo = randInt(0, 60); // spread created_at so the DESC ordering varies

    await pool.query(
      `INSERT INTO orders
        (first_name, last_name, email, phone, city, address, building, items,
         subtotal, delivery_fee, total_amount, status, idempotency_key, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, NOW() - ($14 || ' days')::interval)`,
      [
        pick(FIRST),
        pick(LAST),
        `test.order${i}@example.com`,
        `+9617${randInt(0, 9)} ${randInt(100, 999)} ${randInt(100, 999)}`,
        pick(CITIES),
        `Street ${randInt(1, 40)}, Building ${randInt(1, 20)}`,
        building,
        JSON.stringify(items),
        subtotal,
        deliveryFee,
        total,
        pick(STATUSES),
        `TEST-SEED-${i}`,
        String(daysAgo),
      ]
    );
    inserted++;
  }
  console.log(`✅ Inserted ${inserted} TEST orders (idempotency_key LIKE 'TEST-SEED-%').`);
}

async function remove() {
  const r = await pool.query(`DELETE FROM orders WHERE idempotency_key LIKE 'TEST-SEED-%'`);
  console.log(`🧹 Removed ${r.rowCount} TEST orders.`);
}

async function peek() {
  const top = await pool.query(
    `SELECT id, status, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created,
            (idempotency_key LIKE 'TEST-SEED-%') AS is_test
     FROM orders ORDER BY created_at DESC, id DESC LIMIT 12`
  );
  console.log('Top 12 by current sort (created_at DESC, id DESC):');
  console.table(top.rows);
  const real = await pool.query(
    `SELECT id, to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created
     FROM orders WHERE idempotency_key IS NULL OR idempotency_key NOT LIKE 'TEST-SEED-%'
     ORDER BY id`
  );
  console.log('Real (non-test) orders:');
  console.table(real.rows);
}

// Re-date the TEST orders so created_at is monotonic with id (newest id = newest
// date), ~6h apart, so they read cleanly newest→oldest in the admin.
async function redate() {
  const r = await pool.query(`
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY id DESC) AS rn
      FROM orders WHERE idempotency_key LIKE 'TEST-SEED-%'
    )
    UPDATE orders o
    SET created_at = NOW() - ((ranked.rn - 1) * INTERVAL '2 hours')
    FROM ranked WHERE o.id = ranked.id
  `);
  console.log(`Re-dated ${r.rowCount} test orders to read newest→oldest by order number.`);
}

async function count() {
  const total    = await pool.query(`SELECT COUNT(*)::int AS n FROM orders`);
  const test     = await pool.query(`SELECT COUNT(*)::int AS n FROM orders WHERE idempotency_key LIKE 'TEST-SEED-%'`);
  const byStatus = await pool.query(`SELECT status, COUNT(*)::int AS n FROM orders GROUP BY status ORDER BY n DESC`);
  const n = total.rows[0].n;
  console.log(`Total orders: ${n}  (test orders: ${test.rows[0].n})`);
  console.log('By status:', byStatus.rows.map(r => `${r.status}=${r.n}`).join(', '));
  console.log(`Pages at 20 per page: ${Math.ceil(n / 20)}`);
}

(async () => {
  try {
    if (process.argv.includes('--remove')) {
      await remove();
    } else if (process.argv.includes('--count')) {
      await count();
    } else if (process.argv.includes('--peek')) {
      await peek();
    } else if (process.argv.includes('--redate')) {
      await redate();
    } else {
      const countArg = process.argv.find(a => /^\d+$/.test(a));
      await seed(countArg ? parseInt(countArg, 10) : 100);
    }
  } catch (e) {
    console.error('Seed error:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
