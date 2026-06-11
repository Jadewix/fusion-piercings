// seed-test-gold-plated.js
// Inserts 5 test products into the 18k Gold Plated collection, one per placement
// (ear / nose / belly / nipple) plus one multi-placement product, so the placement
// filter on /collections/gold-plated-hoops can be exercised end-to-end.
//
//   Add test products:    node seed-test-gold-plated.js
//   Remove them again:    node seed-test-gold-plated.js --clean
//
// Every test product is named with the prefix "TEST GOLD " so removal is exact
// and can never affect real products.

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

const NAME_PREFIX = 'TEST GOLD';
const MATERIAL_TAG = 'gold-plated-hoops';

const PRODUCTS = [
  { suffix: 'Ear Hoop',      categories: ['ear'],          price: 22 },
  { suffix: 'Nose Stud',     categories: ['nose'],         price: 18 },
  { suffix: 'Belly Bar',     categories: ['belly'],        price: 28 },
  { suffix: 'Nipple Ring',   categories: ['nipple'],       price: 32 },
  { suffix: 'Ear & Nose Duo', categories: ['ear', 'nose'], price: 38 },
];

async function clean() {
  const { rowCount } = await pool.query(
    `DELETE FROM products WHERE name LIKE $1`,
    [`${NAME_PREFIX} %`]
  );
  console.log(`Removed ${rowCount} test gold-plated product(s).`);
}

async function seed() {
  const existing = await pool.query(
    `SELECT image_url FROM products WHERE image_url IS NOT NULL LIMIT 1`
  );
  const sampleImage = existing.rows[0]?.image_url || null;

  let inserted = 0;
  for (const p of PRODUCTS) {
    await pool.query(
      `INSERT INTO products
         (name, description, price, image_url, category, categories, color, colors,
          sizes, stock_count, material_tags)
       VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8::jsonb,
               $9::jsonb, 999, $10::text[])`,
      [
        `${NAME_PREFIX} ${p.suffix}`,
        `Test product for ${p.categories.join(' & ')} — exercises placement filtering on gold-plated collection.`,
        p.price.toFixed(2),
        sampleImage,
        p.categories[0],
        p.categories,
        'gold',
        JSON.stringify(['gold']),
        JSON.stringify(['One Size']),
        [MATERIAL_TAG],
      ]
    );
    inserted++;
  }
  console.log(`Inserted ${inserted} test gold-plated products.`);
  console.log(`Placements covered: ear, nose, belly, nipple, ear+nose (multi).`);
  console.log(`Remove with:  node seed-test-gold-plated.js --clean`);
}

(async () => {
  try {
    if (process.argv.includes('--clean')) {
      await clean();
    } else {
      await seed();
    }
  } catch (err) {
    console.error('Seed script error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
