require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// --- NEW BREVO EMAIL SETUP ---
// We use native fetch to bypass Render's strict SMTP firewall.
async function sendBrevoEmail(toEmail, toName, subject, htmlContent) {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Fusion Piercings", email: process.env.EMAIL_USER },
                to: [{ email: toEmail, name: toName }],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Brevo API Error:", errText);
        }
    } catch (err) {
        console.error("Failed to connect to Brevo:", err);
    }
}

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000
});

// Catch background database connection drops
pool.on('error', (err, client) => {
    console.error('Idle database connection dropped by Supabase/Network:', err.message);
});

// 2. Initialize Supabase Storage Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 3. Configure Multer (Keeps the uploaded image in memory temporarily)
const upload = multer({ storage: multer.memoryStorage() });

// --- PUBLIC ROUTES (For the Storefront) ---

app.get('/api/products', async (req, res) => {
    // --- Parse & sanitize pagination params ---
    let page  = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(page)  || page  < 1) page  = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // safety cap so a client can't request the whole table

    const { metal, category } = req.query;

    // --- Build WHERE clause from optional filters ---
    const conditions = [];
    const params = [];

    if (metal && metal !== 'all') {
        // A product tagged 'both' should surface under either gold or titanium.
        params.push(metal);
        conditions.push(`(metal = $${params.length} OR metal = 'both')`);
    }
    if (category && category !== 'all') {
        params.push(category);
        conditions.push(`category = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        // 1. Total matching rows (for pagination metadata)
        const countResult = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        // Clamp the requested page into a valid range
        if (page > totalPages) page = totalPages;
        const offset = (page - 1) * limit;

        // 2. Page of rows — newest first (id as a stable tiebreaker for equal timestamps)
        const dataParams = [...params, limit, offset];
        const dataResult = await pool.query(
            `SELECT * FROM products
             ${whereClause}
             ORDER BY created_at DESC, id DESC
             LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
        );

        res.status(200).json({
            products: dataResult.rows,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching single product:", error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// --- ADMIN ROUTES (For the Owner's Dashboard) ---

app.post('/api/products', upload.single('image'), async (req, res) => {
    const { name, description, price, category, metal, sizes } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Image file is required" });

    let parsedSizes = ['One Size'];
    if (sizes) {
        try { parsedSizes = JSON.parse(sizes); }
        catch { parsedSizes = sizes.split(',').map(s => s.trim()); }
    }

    try {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        const { data, error: uploadError } = await supabase.storage.from('jewelry-images').upload(fileName, file.buffer, { contentType: file.mimetype });
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('jewelry-images').getPublicUrl(fileName);
        const imageUrl = publicUrlData.publicUrl;

        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_url, category, metal, sizes, stock_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 999) RETURNING *`,
            [name, description, price, imageUrl, category || 'ear', metal || 'gold', parsedSizes]
        );

        res.status(201).json({ message: "Product created!", product: result.rows[0] });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to upload product" });
    }
});

app.patch('/api/products/:id/stock', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let newStockCount = 999;
    if (status === 'out_of_stock') newStockCount = 0;
    if (status === 'low_stock') newStockCount = 5;

    try {
        const result = await pool.query(`UPDATE products SET stock_count = $1 WHERE id = $2 RETURNING *`, [newStockCount, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
        res.status(200).json({ message: "Stock updated", product: result.rows[0] });
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, metal, sizes } = req.body;
    const file = req.file;

    let parsedSizes = null;
    if (sizes) {
        try { parsedSizes = JSON.parse(sizes); }
        catch { parsedSizes = sizes.split(',').map(s => s.trim()); }
    }

    try {
        let imageUrl = null;
        if (file) {
            const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
            const { data, error: uploadError } = await supabase.storage.from('jewelry-images').upload(fileName, file.buffer, { contentType: file.mimetype });
            if (uploadError) throw uploadError;
            const { data: publicUrlData } = supabase.storage.from('jewelry-images').getPublicUrl(fileName);
            imageUrl = publicUrlData.publicUrl;
        }

        const result = await pool.query(
            `UPDATE products 
             SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price),
                 category = COALESCE($4, category), metal = COALESCE($5, metal), sizes = COALESCE($6, sizes), image_url = COALESCE($7, image_url)
             WHERE id = $8 RETURNING *`,
            [name, description, price, category, metal, parsedSizes, imageUrl, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: "Product not found" });
        res.status(200).json({ message: "Product updated", product: result.rows[0] });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await pool.query('SELECT image_url FROM products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) return res.status(404).json({ error: "Product not found" });

        const imageUrl = productResult.rows[0].image_url;
        const fileName = imageUrl.split('/').pop();
        await supabase.storage.from('jewelry-images').remove([fileName]);
        await pool.query('DELETE FROM products WHERE id = $1', [id]);

        res.status(200).json({ message: "Product and image deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});

app.get('/api/admin/inventory', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY stock_count ASC');
        const products = result.rows;
        const inventory = {
            active:   products.filter(p => p.stock_count === null || p.stock_count > 0),
            inactive: products.filter(p => p.stock_count === 0),
        };
        res.status(200).json(inventory);
    } catch (error) {
        console.error("Error fetching admin inventory:", error);
        res.status(500).json({ error: "Failed to load inventory dashboard" });
    }
});

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });
    try {
        await pool.query(`INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4)`, [name, email, phone || null, message]);

        // Send email to owner using Brevo
        await sendBrevoEmail(
            process.env.EMAIL_USER,
            'Fusion Owner',
            `New Contact Message from ${name}`,
            `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        );

        res.status(201).json({ ok: true });
    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

app.post('/api/admin/auth', (req, res) => {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Incorrect password' });
    res.status(200).json({ ok: true });
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.patch('/api/admin/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
        const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.status(200).json({ message: 'Status updated', order: result.rows[0] });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// --- THE ONE AND ONLY CHECKOUT ROUTE ---
app.post('/api/orders', async (req, res) => {
    const { firstName, lastName, email, phone, city, address, building, items, subtotal, deliveryFee, total } = req.body;

    try {
        // 1. Insert into database
        const result = await pool.query(
            `INSERT INTO orders 
             (first_name, last_name, email, phone, city, address, building, items, subtotal, delivery_fee, total_amount) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING *`,
            [firstName, lastName, email, phone, city, address, building, JSON.stringify(items), subtotal, deliveryFee, total]
        );

        const newOrder = result.rows[0];

        // --- STYLED EMAIL HTML GENERATOR ---
        const itemListHTML = items.map(item => `
            <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${item.name}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                        Qty: ${item.qty} &middot; ${item.size ? item.size + ' &middot; ' : ''}${item.metal}
                    </p>
                </td>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 14px; font-weight: 600; color: #1a1a1a;">
                    $${(item.price * item.qty).toFixed(2)}
                </td>
            </tr>
        `).join('');

        const emailWrapper = (content) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
                <div style="text-align: center; padding-bottom: 30px; border-bottom: 1px solid #1a1a1a; margin-bottom: 30px;">
                    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: normal; margin: 0; letter-spacing: 4px; color: #1a1a1a;">FUSION</h1>
                    <p style="font-size: 10px; letter-spacing: 3px; color: #666666; text-transform: uppercase; margin: 8px 0 0 0;">Piercings</p>
                </div>
                ${content}
                <div style="text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                    <p style="font-size: 11px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Fusion Piercings &copy; ${new Date().getFullYear()}</p>
                </div>
            </div>
        `;

        // 2. SEND THE SUCCESS RESPONSE INSTANTLY!
        res.status(201).json({ message: "Order placed successfully!", orderId: newOrder.id });

        // 3. Send Emails in the background

        // EMAIL 1: OWNER NOTIFICATION
        const ownerHTML = emailWrapper(`
            <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #d97706; margin-bottom: 20px;">🚨 New Order Received</h2>
            <p style="font-size: 14px; color: #1a1a1a; line-height: 1.6;"><strong>Order #${newOrder.id}</strong> has just been placed by <strong>${firstName} ${lastName}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666; margin: 0 0 10px 0;">Customer Details</h3>
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #1a1a1a;">📞 ${phone}</p>
                <p style="margin: 0 0 5px 0; font-size: 14px; color: #1a1a1a;">✉️ ${email || 'No email provided'}</p>
                <p style="margin: 0; font-size: 14px; color: #1a1a1a;">📍 ${building ? building + ', ' : ''}${address}, ${city}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                ${itemListHTML}
                <tr>
                    <td style="padding: 12px 0 4px 0; font-size: 13px; color: #666666;">Subtotal</td>
                    <td style="padding: 12px 0 4px 0; text-align: right; font-size: 13px; color: #1a1a1a;">$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0 12px 0; font-size: 13px; color: #666666;">Delivery Fee</td>
                    <td style="padding: 4px 0 12px 0; text-align: right; font-size: 13px; color: #1a1a1a;">${deliveryFee.toFixed(2)}</td>
                </tr>
                <tr>
                    <td style="padding: 20px 0; border-top: 2px solid #1a1a1a; font-size: 16px; font-weight: bold; color: #1a1a1a;">Total to Collect (COD)</td>
                    <td style="padding: 20px 0; border-top: 2px solid #1a1a1a; text-align: right; font-size: 18px; font-weight: bold; color: #1a1a1a;">$${total.toFixed(2)}</td>
                </tr>
            </table>
        `);

        sendBrevoEmail(
            process.env.EMAIL_USER,
            'Fusion Owner',
            `🚨 New Order #${newOrder.id} - ${firstName} ${lastName}`,
            ownerHTML
        );

        // EMAIL 2: CLIENT RECEIPT
        if (email) {
            const clientHTML = emailWrapper(`
                <h2 style="font-family: Georgia, serif; font-size: 22px; font-weight: normal; color: #1a1a1a; text-align: center; margin-bottom: 10px;">Thank you for your order, ${firstName}.</h2>
                <p style="text-align: center; font-size: 14px; color: #666666; line-height: 1.6; max-width: 400px; margin: 0 auto 40px auto;">
                    We are currently preparing your jewelry. Our team will contact you at <strong>${phone}</strong> shortly to arrange your delivery.
                </p>

                <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 0;">Order Summary &middot; #${newOrder.id}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${itemListHTML}
                    <tr>
                        <td style="padding: 16px 0 4px 0; font-size: 13px; color: #666666;">Subtotal</td>
                        <td style="padding: 16px 0 4px 0; text-align: right; font-size: 13px; color: #1a1a1a;">$${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0 16px 0; font-size: 13px; color: #666666;">Delivery Fee</td>
                        <td style="padding: 4px 0 16px 0; text-align: right; font-size: 13px; color: #1a1a1a;">$${deliveryFee === 0 ? 'Free' : '$' + deliveryFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 0; border-top: 1px solid #1a1a1a; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1a1a1a;">Total (Cash on Delivery)</td>
                        <td style="padding: 20px 0; border-top: 1px solid #1a1a1a; text-align: right; font-size: 18px; font-weight: bold; color: #1a1a1a;">$${total.toFixed(2)}</td>
                    </tr>
                </table>
            `);

            sendBrevoEmail(
                email,
                `${firstName} ${lastName}`,
                `Order Confirmation - Fusion Piercings #${newOrder.id}`,
                clientHTML
            );
        }

    } catch (error) {
        console.error("Critical Backend Error saving order:", error);
        res.status(500).json({ error: "Failed to process the order" });
    }
});

// Database Initialization
async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            id           SERIAL PRIMARY KEY,
            first_name   VARCHAR NOT NULL,
            last_name    VARCHAR NOT NULL,
            email        VARCHAR,
            phone        VARCHAR NOT NULL,
            city         VARCHAR NOT NULL,
            address      VARCHAR NOT NULL,
            building     VARCHAR,
            items        JSONB NOT NULL,
            subtotal     NUMERIC(10,2) NOT NULL,
            delivery_fee NUMERIC(10,2) NOT NULL,
            total_amount NUMERIC(10,2) NOT NULL,
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
    // Backfill any products that were inserted before stock_count was required.
    // Sets them to 999 (in stock) so they appear on the storefront.
    await pool.query(`
        UPDATE products SET stock_count = 999 WHERE stock_count IS NULL
    `);
    // Add status column to orders if it doesn't exist yet (safe for existing tables)
    await pool.query(`
        DO $$ BEGIN
            ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$
    `);
    console.log('Database ready');
}

const PORT = process.env.PORT || 5000;

async function startWithRetry(attemptsLeft = 5) {
    try {
        await initDB();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.error(`DB init failed (${attemptsLeft} attempts left):`, err.message);
        if (attemptsLeft <= 1) {
            console.error('Could not connect to database. Is the Supabase project paused?');
            process.exit(1);
        }
        console.log('Retrying in 5 seconds...');
        setTimeout(() => startWithRetry(attemptsLeft - 1), 5000);
    }
}

startWithRetry();