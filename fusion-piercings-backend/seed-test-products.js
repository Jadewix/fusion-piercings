// seed-test-products.js
// Inserts 30 test products to exercise pagination, sorting, and filters.
// Run:    node seed-test-products.js
// Remove: node seed-test-products.js --clean   (deletes only the seeded rows)
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
});

const NAME_PREFIX = 'Test Product';
const categories = ['ear', 'nose', 'belly'];
const metals     = ['gold', 'titanium', 'both'];
const sizePool   = ['16G', '18G', '20G', '6mm', '8mm', 'One Size'];

async function clean() {
    const { rowCount } = await pool.query(
        `DELETE FROM products WHERE name LIKE $1`,
        [`${NAME_PREFIX} %`]
    );
    console.log(`Removed ${rowCount} seeded test product(s).`);
}

async function seed() {
    // Reuse a real Supabase image if one exists so the cards render an image;
    // otherwise leave it null (the card shows a "No Image" placeholder).
    const existing = await pool.query(
        `SELECT image_url FROM products WHERE image_url IS NOT NULL LIMIT 1`
    );
    const sampleImage = existing.rows[0]?.image_url || null;

    let inserted = 0;
    for (let i = 1; i <= 30; i++) {
        const num      = String(i).padStart(2, '0');
        const category = categories[i % categories.length];
        const metal    = metals[i % metals.length];
        const price    = (20 + (i % 12) * 5).toFixed(2);            // $20–$75
        const sizes    = [sizePool[i % sizePool.length], sizePool[(i + 2) % sizePool.length]];
        const stock    = i % 10 === 0 ? 0 : 999;                    // every 10th is out of stock
        const minutesAgo = 30 - i;                                  // #30 newest, #01 oldest

        await pool.query(
            `INSERT INTO products (name, description, price, image_url, category, metal, sizes, stock_count, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 * interval '1 minute'))`,
            [
                `${NAME_PREFIX} ${num}`,
                `Seeded test product #${num} for pagination testing.`,
                price,
                sampleImage,
                category,
                metal,
                sizes,
                stock,
                minutesAgo,
            ]
        );
        inserted++;
    }
    console.log(`Inserted ${inserted} test products (newest: "${NAME_PREFIX} 30", oldest: "${NAME_PREFIX} 01").`);
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
