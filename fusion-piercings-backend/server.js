require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 2. Initialize Supabase Storage Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 3. Configure Multer (Keeps the uploaded image in memory temporarily)
const upload = multer({ storage: multer.memoryStorage() });

// --- PUBLIC ROUTES (For the Storefront) ---

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get a single product by ID
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching single product:", error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// --- ADMIN ROUTES (For the Owner's Dashboard) ---

// Create a new product (Handles the image upload + database entry)
// Create a new product (Upgraded with Category, Metal, and Sizes)
app.post('/api/products', upload.single('image'), async (req, res) => {
    // 1. Extract the new fields from the incoming request
    const { name, description, price, category, metal, sizes } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Image file is required" });

    // 2. Safely parse the sizes array (FormData sends arrays as strings)
    let parsedSizes = ['One Size'];
    if (sizes) {
        try {
            // Try to parse it if the frontend sent it as a JSON string: '["6mm", "8mm"]'
            parsedSizes = JSON.parse(sizes);
        } catch {
            // If it fails, assume it's a comma-separated string: "6mm, 8mm"
            parsedSizes = sizes.split(',').map(s => s.trim());
        }
    }

    try {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

        const { data, error: uploadError } = await supabase.storage
            .from('jewelry-images')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype
            });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('jewelry-images')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        // 3. Insert the new fields into PostgreSQL
        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_url, category, metal, sizes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, description, price, imageUrl, category || 'ear', metal || 'gold', parsedSizes]
        );

        res.status(201).json({ message: "Product created!", product: result.rows[0] });

    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to upload product" });
    }
});

// Update Stock Status (3-Tier System)
app.patch('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expects: 'in_stock', 'low_stock', or 'out_of_stock'

    // Translate the label into an inventory number
    let newStockCount = 999; // Default to in_stock
    if (status === 'out_of_stock') newStockCount = 0;
    if (status === 'low_stock') newStockCount = 5;

    try {
        const result = await pool.query(
            `UPDATE products SET stock_count = $1 WHERE id = $2 RETURNING *`,
            [newStockCount, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.status(200).json({ message: "Stock updated", product: result.rows[0] });
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update Product Details (Text Only)
// Update Product Details (Upgraded with Category, Metal, and Sizes)
// Update Product Details (Now handles FormData and optional image uploads)
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, metal, sizes } = req.body;
    const file = req.file; // This will exist if they uploaded a new image

    // Safely parse the sizes array
    let parsedSizes = null;
    if (sizes) {
        try { parsedSizes = JSON.parse(sizes); }
        catch { parsedSizes = sizes.split(',').map(s => s.trim()); }
    }

    try {
        let imageUrl = null;

        // 1. If they attached a new image during the edit, upload it to Supabase
        if (file) {
            const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
            const { data, error: uploadError } = await supabase.storage
                .from('jewelry-images')
                .upload(fileName, file.buffer, { contentType: file.mimetype });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('jewelry-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrlData.publicUrl;
        }

        // 2. Update PostgreSQL (Notice COALESCE($7, image_url) keeps the old image if no new one is provided)
        const result = await pool.query(
            `UPDATE products 
             SET name = COALESCE($1, name), 
                 description = COALESCE($2, description), 
                 price = COALESCE($3, price),
                 category = COALESCE($4, category),
                 metal = COALESCE($5, metal),
                 sizes = COALESCE($6, sizes),
                 image_url = COALESCE($7, image_url)
             WHERE id = $8 RETURNING *`,
            [name, description, price, category, metal, parsedSizes, imageUrl, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.status(200).json({ message: "Product updated", product: result.rows[0] });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
});
// Delete a product (and its image)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Step 1: Find the product so we know which image to delete
        const productResult = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        const imageUrl = productResult.rows[0].image_url;

        // Step 2: Extract the filename from the URL and delete it from the bucket
        const fileName = imageUrl.split('/').pop();
        await supabase.storage.from('jewelry-images').remove([fileName]);

        // Step 3: Delete the row from the PostgreSQL database
        await pool.query('DELETE FROM products WHERE id = $1', [id]);

        res.status(200).json({ message: "Product and image deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// GET Admin Inventory (Sorted by Stock Status)
app.get('/api/admin/inventory', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY stock_count ASC');
        const products = result.rows;

        const inventory = {
            active:   products.filter(p => p.stock_count > 0),
            inactive: products.filter(p => p.stock_count === 0),
        };

        res.status(200).json(inventory);
    } catch (error) {
        console.error("Error fetching admin inventory:", error);
        res.status(500).json({ error: "Failed to load inventory dashboard" });
    }
});

// POST /api/contact — Save an incoming contact message
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
    }
    try {
        await pool.query(
            `INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4)`,
            [name, email, phone || null, message]
        );
        res.status(201).json({ ok: true });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// POST /api/admin/auth — Verify the admin password
app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Incorrect password' });
    }
    res.status(200).json({ ok: true });
});

// POST /api/orders — Place a new order
app.post('/api/orders', async (req, res) => {
    const { firstName, lastName, phone, city, address, building, items, subtotal, deliveryFee, total } = req.body;

    if (!firstName || !lastName || !phone || !city || !address || !items?.length) {
        return res.status(400).json({ error: 'Missing required order fields' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO orders (first_name, last_name, phone, city, address, building, items, subtotal, delivery_fee, total)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at`,
            [firstName, lastName, phone, city, address, building || null, JSON.stringify(items), subtotal, deliveryFee, total]
        );

        res.status(201).json({ orderId: result.rows[0].id, createdAt: result.rows[0].created_at });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

// GET Admin Orders
app.get('/api/admin/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id           SERIAL PRIMARY KEY,
            first_name   VARCHAR NOT NULL,
            last_name    VARCHAR NOT NULL,
            phone        VARCHAR NOT NULL,
            city         VARCHAR NOT NULL,
            address      VARCHAR NOT NULL,
            building     VARCHAR,
            items        JSONB NOT NULL,
            subtotal     NUMERIC(10,2) NOT NULL,
            delivery_fee NUMERIC(10,2) NOT NULL,
            total        NUMERIC(10,2) NOT NULL,
            status       VARCHAR DEFAULT 'pending',
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id         SERIAL PRIMARY KEY,
            name       VARCHAR NOT NULL,
            email      VARCHAR NOT NULL,
            phone      VARCHAR,
            message    TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('Database ready');
}

const PORT = process.env.PORT || 5000;
initDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
});