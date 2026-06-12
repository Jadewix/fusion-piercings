require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');

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

// Render (and most PaaS) run the app behind a reverse proxy. Trust the first
// proxy hop so express-rate-limit sees the real client IP via X-Forwarded-For.
app.set('trust proxy', 1);

// --- Rate limiters for abuse-prone POST endpoints. These intentionally do NOT
//     touch GET browsing / server-side rendering traffic. ---
const orderLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 8,                   // max order placements per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many orders from this device. Please wait a few minutes and try again.' },
});

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 10,                  // slow down admin-password brute force
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const contactLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,                   // limit contact-form spam
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many messages from this device. Please try again later.' },
});

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

// Multer wrapper: emits clean JSON on file-count overflow and other multer errors.
const _imagesMulter = upload.array('images', 5);
function uploadImages(req, res, next) {
    _imagesMulter(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: "A product can have at most 5 images" });
        }
        return res.status(400).json({ error: err.message || "Upload failed" });
    });
}

// --- PUBLIC ROUTES (For the Storefront) ---

app.get('/api/products', async (req, res) => {
    // --- Parse & sanitize pagination params ---
    let page  = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(page)  || page  < 1) page  = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // safety cap so a client can't request the whole table

    // CHANGED: Extract 'color' instead of 'metal'
    const { color, category, material_tag } = req.query;

    // --- Build WHERE clause from optional filters ---
    const conditions = [];
    const params = [];

    if (color && color !== 'all') {
        params.push(color);
        conditions.push(`(color = $${params.length} OR color = 'both')`);
    }
    if (category && category !== 'all') {
        params.push(category);
        // Match products tagged with this placement either in the new categories[]
        // array, or in the legacy single-value `category` column for any rows that
        // haven't been backfilled yet.
        conditions.push(`($${params.length} = ANY(categories) OR category = $${params.length})`);
    }
    if (material_tag) {
        params.push(material_tag);
        conditions.push(`$${params.length} = ANY(material_tags)`);
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

app.get('/api/collections', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, slug, name, sort_order FROM collections ORDER BY sort_order, name'
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
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

// Normalise an incoming colors payload to [{color, in_stock}].
// Accepts JSON like `[{"color":"gold","in_stock":true}, ...]` from the admin form,
// or a legacy single-value 'color' string ('gold' | 'silver' | 'titanium' | 'both').
function normaliseColors(raw, legacyColor) {
    let parsed = null;
    if (raw) {
        try {
            const j = JSON.parse(raw);
            if (Array.isArray(j)) parsed = j;
        } catch { /* fall through */ }
    }
    if (parsed && parsed.length > 0) {
        const seen = new Set();
        return parsed.map(c => {
            if (typeof c === 'string') return { color: c, in_stock: true };
            return { color: String(c.color), in_stock: c.in_stock !== false };
        }).filter(c => {
            if (seen.has(c.color)) return false;
            seen.add(c.color);
            return true;
        });
    }
    // Fallback: decode the legacy single 'color' value.
    const c = legacyColor;
    if (c === 'both')     return [{ color: 'gold', in_stock: true }, { color: 'silver', in_stock: true }];
    if (c === 'silver' || c === 'titanium') return [{ color: 'silver', in_stock: true }];
    if (c === 'gold')     return [{ color: 'gold',   in_stock: true }];
    return [];
}

// Derive the legacy single `color` VARCHAR from a colors[] array so the
// storefront filter (which still queries `color = 'gold' OR 'both'`) keeps
// working without a separate join.
function deriveColorString(colorsArr) {
    if (!Array.isArray(colorsArr) || colorsArr.length === 0) return 'gold';
    const slugs = colorsArr.map(c => c.color);
    const hasGold   = slugs.includes('gold');
    const hasSilver = slugs.includes('silver');
    if (hasGold && hasSilver) return 'both';
    if (hasSilver) return 'silver';
    return 'gold';
}

// Normalise an incoming sizes payload to [{size, in_stock, price}]
// price is optional; null/undefined means "use the product's base price".
function normaliseSizes(raw) {
    if (!raw) return [{ size: 'One Size', in_stock: true, price: null }];
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { parsed = String(raw).split(',').map(s => s.trim()).filter(Boolean); }
    if (!Array.isArray(parsed) || parsed.length === 0) return [{ size: 'One Size', in_stock: true, price: null }];
    return parsed.map(s => {
        if (typeof s === 'string') return { size: s, in_stock: true, price: null };
        const rawPrice = s.price;
        let price = null;
        if (rawPrice != null && rawPrice !== '') {
            const n = Number(rawPrice);
            if (Number.isFinite(n) && n >= 0) price = n;
        }
        return {
            size: String(s.size),
            in_stock: s.in_stock !== false,
            price,
        };
    });
}

// Normalise an incoming gem_sizes payload to [{gem_size, in_stock, price}].
// gem_size is a size in mm (stored as a string label, e.g. "2.5").
// Unlike sizes, gem sizes are optional — an empty array means the product
// simply has no gem-size variants.
function normaliseGemSizes(raw) {
    if (!raw) return [];
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { parsed = String(raw).split(',').map(s => s.trim()).filter(Boolean); }
    if (!Array.isArray(parsed)) return [];
    return parsed
        .map(g => {
            if (typeof g === 'string') return { gem_size: g, in_stock: true, price: null };
            if (!g || g.gem_size == null) return null;
            const rawPrice = g.price;
            let price = null;
            if (rawPrice != null && rawPrice !== '') {
                const n = Number(rawPrice);
                if (Number.isFinite(n) && n >= 0) price = n;
            }
            return {
                gem_size: String(g.gem_size),
                in_stock: g.in_stock !== false,
                price,
            };
        })
        .filter(Boolean);
}

// Upload one in-memory file to Supabase and return its public URL.
// Upload one in-memory file to Supabase, auto-compressing it first.
async function uploadOne(file) {
    // 1. Process the image buffer using Sharp
    const compressedBuffer = await sharp(file.buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px (keeps it crisp but not massive)
        .webp({ quality: 80 }) // Convert to WebP format at 80% quality
        .toBuffer();

    // 2. Build the filename (swap the old extension for .webp)
    const originalNameNoExt = file.originalname.split('.').slice(0, -1).join('.');
    const cleanName = originalNameNoExt.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${cleanName}.webp`;

    // 3. Upload the compressed WebP buffer to Supabase
    const { error: uploadError } = await supabase.storage.from('jewelry-images').upload(fileName, compressedBuffer, {
        contentType: 'image/webp'
    });

    if (uploadError) throw uploadError;

    // 4. Return the public URL
    const { data } = supabase.storage.from('jewelry-images').getPublicUrl(fileName);
    return data.publicUrl;
}

// Parse a categories payload (JSON array of slugs) into a clean string[].
// Falls back to [singleCategory] when the multi field is missing/invalid.
function parseCategories(raw, fallbackSingle) {
    let parsed = null;
    if (raw) {
        try {
            const j = JSON.parse(raw);
            if (Array.isArray(j)) parsed = j.map(String).map(s => s.trim()).filter(Boolean);
        } catch { /* fall through */ }
    }
    if (!parsed || parsed.length === 0) {
        return fallbackSingle ? [String(fallbackSingle)] : ['ear'];
    }
    return Array.from(new Set(parsed));
}

app.post('/api/products', uploadImages, async (req, res) => {
    const { name, description, price, category, color, sizes, gem_sizes, material_tags, categories, colors } = req.body;
    const files = req.files || [];

    if (files.length === 0) return res.status(400).json({ error: "At least one image is required" });
    if (files.length > 5)   return res.status(400).json({ error: "A product can have at most 5 images" });

    const parsedSizes    = normaliseSizes(sizes);
    const parsedGemSizes = normaliseGemSizes(gem_sizes);

    let parsedMaterialTags = [];
    if (material_tags) {
        try { parsedMaterialTags = JSON.parse(material_tags); }
        catch { parsedMaterialTags = []; }
    }

    const parsedCategories = parseCategories(categories, category);
    const primaryCategory  = parsedCategories[0];

    const parsedColors  = normaliseColors(colors, color);
    const derivedColor  = deriveColorString(parsedColors);

    try {
        const urls = [];
        for (const f of files) urls.push(await uploadOne(f));

        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_url, image_urls, category, categories, color, colors, sizes, gem_sizes, stock_count, material_tags)
             VALUES ($1, $2, $3, $4, $5::text[], $6, $7::text[], $8, $9::jsonb, $10::jsonb, $11::jsonb, 999, $12::text[]) RETURNING *`,
            [
                name, description, price, urls[0], urls,
                primaryCategory, parsedCategories,
                derivedColor, JSON.stringify(parsedColors),
                JSON.stringify(parsedSizes),
                JSON.stringify(parsedGemSizes),
                parsedMaterialTags,
            ]
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

app.put('/api/products/:id', uploadImages, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category, color, sizes, gem_sizes, material_tags, existing_image_urls, categories, colors } = req.body;
    const files = req.files || [];

    const parsedSizes    = sizes !== undefined ? JSON.stringify(normaliseSizes(sizes)) : null;
    const parsedGemSizes = gem_sizes !== undefined ? JSON.stringify(normaliseGemSizes(gem_sizes)) : null;

    let parsedMaterialTags = null;
    if (material_tags) {
        try { parsedMaterialTags = JSON.parse(material_tags); }
        catch { parsedMaterialTags = null; }
    }

    // categories is optional on PUT; if present, parse to array, else leave null so COALESCE keeps existing
    let parsedCategories = null;
    let primaryCategory  = null;
    if (categories !== undefined) {
        parsedCategories = parseCategories(categories, category);
        primaryCategory  = parsedCategories[0];
    } else if (category) {
        // Caller sent only legacy single category — keep both fields in sync
        primaryCategory  = category;
        parsedCategories = [category];
    }

    // colors is optional on PUT; if present, normalise and derive a single
    // `color` value so the legacy column tracks. If absent, leave null and let
    // COALESCE keep the existing values for both columns.
    let parsedColorsJson = null;
    let derivedColorStr  = null;
    if (colors !== undefined) {
        const arr = normaliseColors(colors, color);
        parsedColorsJson = JSON.stringify(arr);
        derivedColorStr  = deriveColorString(arr);
    } else if (color !== undefined) {
        // Caller sent only legacy single color — sync the array form too.
        const arr = normaliseColors(null, color);
        parsedColorsJson = JSON.stringify(arr);
        derivedColorStr  = color;
    }

    let keptExisting = null;
    if (existing_image_urls) {
        try {
            const parsed = JSON.parse(existing_image_urls);
            if (Array.isArray(parsed)) keptExisting = parsed.filter(u => typeof u === 'string');
        } catch { keptExisting = null; }
    }

    // Enforce the 5-image cap on the combined set (kept + newly uploaded).
    const projectedCount = (keptExisting?.length ?? 0) + files.length;
    if (projectedCount > 5) {
        return res.status(400).json({ error: "A product can have at most 5 images" });
    }

    try {
        const uploadedUrls = [];
        for (const f of files) uploadedUrls.push(await uploadOne(f));

        let newImageUrls = null;
        if (keptExisting !== null || uploadedUrls.length > 0) {
            newImageUrls = [...(keptExisting || []), ...uploadedUrls];
        }
        const newPrimaryUrl = newImageUrls && newImageUrls.length > 0 ? newImageUrls[0] : null;

        const result = await pool.query(
            `UPDATE products
             SET name = COALESCE($1, name), description = COALESCE($2, description), price = COALESCE($3, price),
                 category = COALESCE($4, category),
                 categories = COALESCE($5::text[], categories),
                 color = COALESCE($6, color),
                 colors = COALESCE($7::jsonb, colors),
                 sizes = COALESCE($8::jsonb, sizes),
                 gem_sizes = COALESCE($9::jsonb, gem_sizes),
                 image_url = COALESCE($10, image_url),
                 image_urls = COALESCE($11::text[], image_urls),
                 material_tags = COALESCE($12::text[], material_tags)
             WHERE id = $13 RETURNING *`,
            [
                name, description, price,
                primaryCategory, parsedCategories,
                derivedColorStr, parsedColorsJson,
                parsedSizes, parsedGemSizes, newPrimaryUrl, newImageUrls, parsedMaterialTags,
                id,
            ]
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
        const productResult = await pool.query('SELECT image_url, image_urls FROM products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) return res.status(404).json({ error: "Product not found" });

        const { image_url, image_urls } = productResult.rows[0];
        const allUrls = (image_urls && image_urls.length > 0) ? image_urls : (image_url ? [image_url] : []);
        const fileNames = allUrls.map(u => u.split('/').pop()).filter(Boolean);
        if (fileNames.length > 0) await supabase.storage.from('jewelry-images').remove(fileNames);
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

app.post('/api/contact', contactLimiter, async (req, res) => {
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

app.post('/api/admin/auth', authLimiter, (req, res) => {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Incorrect password' });
    res.status(200).json({ ok: true });
});

app.get('/api/admin/orders', async (req, res) => {
    // --- Parse & sanitize pagination params (mirrors /api/products) ---
    let page  = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isFinite(page)  || page  < 1) page  = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // safety cap so a client can't request the whole table

    try {
        // 1. Total rows (for pagination metadata)
        const countResult = await pool.query('SELECT COUNT(*) FROM orders');
        const total = parseInt(countResult.rows[0].count, 10);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        // Clamp the requested page into a valid range
        if (page > totalPages) page = totalPages;
        const offset = (page - 1) * limit;

        // 2. Page of rows — newest first (id as a stable tiebreaker for equal timestamps)
        const dataResult = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.status(200).json({
            orders: dataResult.rows,
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        });
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
app.post('/api/orders', orderLimiter, async (req, res) => {
    const { firstName, lastName, email, phone, city, address, building, items, subtotal, deliveryFee, total } = req.body;
    const idempotencyKey = req.get('Idempotency-Key') || null;

    // --- Basic validation ---
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty.' });
    }
    if (!firstName || !lastName || !phone || !city || !address) {
        return res.status(400).json({ error: 'Missing required delivery information.' });
    }

    try {
        // 1a. Idempotency: if this exact submission was already saved, return it (no duplicate).
        if (idempotencyKey) {
            const seen = await pool.query('SELECT id FROM orders WHERE idempotency_key = $1', [idempotencyKey]);
            if (seen.rows.length > 0) {
                return res.status(200).json({ message: 'Order already placed', orderId: seen.rows[0].id });
            }
        }

        // 1b. Content-window dedup: same phone + total within 90s catches accidental
        //     re-submits (e.g. two browser tabs) where the idempotency key differs.
        const recent = await pool.query(
            `SELECT id FROM orders
             WHERE phone = $1 AND total_amount = $2 AND created_at > NOW() - INTERVAL '90 seconds'
             ORDER BY created_at DESC LIMIT 1`,
            [phone, total]
        );
        if (recent.rows.length > 0) {
            return res.status(200).json({ message: 'Order already placed', orderId: recent.rows[0].id });
        }

        // 1c. Insert. ON CONFLICT guards against a race between two requests sharing a key.
        const result = await pool.query(
            `INSERT INTO orders
             (first_name, last_name, email, phone, city, address, building, items, subtotal, delivery_fee, total_amount, idempotency_key)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (idempotency_key) DO NOTHING
             RETURNING *`,
            [firstName, lastName, email, phone, city, address, building, JSON.stringify(items), subtotal, deliveryFee, total, idempotencyKey]
        );

        // ON CONFLICT skipped the insert → a concurrent request already used this key.
        if (result.rows.length === 0) {
            const seen = await pool.query('SELECT id FROM orders WHERE idempotency_key = $1', [idempotencyKey]);
            return res.status(200).json({ message: 'Order already placed', orderId: seen.rows[0]?.id });
        }

        const newOrder = result.rows[0];

        // --- STYLED EMAIL HTML GENERATOR ---
        const itemListHTML = items.map(item => `
            <tr>
                <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${item.name}</p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
                        Qty: ${item.qty} &middot; ${item.size ? item.size + ' &middot; ' : ''}${item.color || item.metal || ''}
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
    // Idempotency support for duplicate-order prevention (safe to run repeatedly).
    // Wrapped so this enhancement can never block the server from starting.
    try {
        await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT`);
        await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uniq ON orders (idempotency_key)`);
    } catch (e) {
        console.error('Idempotency migration skipped (non-fatal):', e.message);
    }
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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS collections (
            id         SERIAL PRIMARY KEY,
            slug       VARCHAR UNIQUE NOT NULL,
            name       VARCHAR NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    // Seed canonical collections — idempotent.
    await pool.query(`
        INSERT INTO collections (slug, name, sort_order) VALUES
            ('titanium',          'Titanium',          10),
            ('surgical-steel',    'Surgical Steel',    20),
            ('gold-plated-hoops', '18k Gold Plated',   30)
        ON CONFLICT (slug) DO NOTHING
    `);
    // Rename: old "Gold Plated Hoops" label → "18k Gold Plated" for any DB
    // that was seeded before this change. Slug stays stable.
    await pool.query(`
        UPDATE collections SET name = '18k Gold Plated'
        WHERE slug = 'gold-plated-hoops' AND name <> '18k Gold Plated'
    `);

    // Create products table if it doesn't exist yet
    await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id            SERIAL PRIMARY KEY,
            name          VARCHAR NOT NULL,
            description   TEXT,
            price         NUMERIC(10,2) NOT NULL,
            image_url     TEXT,
            image_urls    TEXT[] DEFAULT '{}',
            category      VARCHAR DEFAULT 'ear',
            categories    TEXT[] DEFAULT '{}',
            color         VARCHAR DEFAULT 'gold',
            colors        JSONB  DEFAULT '[]'::jsonb,
            sizes         JSONB  DEFAULT '[]'::jsonb,
            stock_count   INTEGER DEFAULT 999,
            material_tags TEXT[] DEFAULT '{}',
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // AUTO-RENAME metal to color so you don't lose data!
    await pool.query(`
        DO $$ BEGIN
            ALTER TABLE products RENAME COLUMN metal TO color;
        EXCEPTION WHEN undefined_column THEN NULL;
        END $$
    `);

    const ensureColumn = async (col, type) => {
        await pool.query(`
            DO $$ BEGIN
                ALTER TABLE products ADD COLUMN ${col} ${type};
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$
        `);
    };
    await ensureColumn('description',   "TEXT");
    await ensureColumn('image_url',     "TEXT");
    await ensureColumn('image_urls',    "TEXT[] DEFAULT '{}'");
    await ensureColumn('category',      "VARCHAR DEFAULT 'ear'");
    await ensureColumn('categories',    "TEXT[] DEFAULT '{}'");
    await ensureColumn('color',         "VARCHAR DEFAULT 'gold'"); // <-- Ensures it exists if table was made without it
    await ensureColumn('colors',        "JSONB DEFAULT '[]'::jsonb");
    await ensureColumn('sizes',         "TEXT[] DEFAULT '{}'");
    await ensureColumn('gem_sizes',     "JSONB DEFAULT '[]'::jsonb");
    await ensureColumn('stock_count',   "INTEGER DEFAULT 999");
    await ensureColumn('material_tags', "TEXT[] DEFAULT '{}'");

    // Backfill: any row that already has a legacy single `category` but an empty
    // `categories` array gets seeded so new multi-select filtering finds it.
    await pool.query(`
        UPDATE products
        SET categories = ARRAY[category]
        WHERE (categories IS NULL OR cardinality(categories) = 0)
          AND category IS NOT NULL
    `);

    // Backfill: derive the colors[] array from the legacy single `color` for rows
    // that haven't been edited since this migration.
    await pool.query(`
        UPDATE products
        SET colors = CASE
            WHEN color = 'both'     THEN '[{"color":"gold","in_stock":true},{"color":"silver","in_stock":true}]'::jsonb
            WHEN color = 'silver'   THEN '[{"color":"silver","in_stock":true}]'::jsonb
            WHEN color = 'titanium' THEN '[{"color":"silver","in_stock":true}]'::jsonb
            WHEN color = 'gold'     THEN '[{"color":"gold","in_stock":true}]'::jsonb
            ELSE '[]'::jsonb
        END
        WHERE colors IS NULL OR jsonb_array_length(COALESCE(colors, '[]'::jsonb)) = 0
    `);

    await pool.query(`UPDATE products SET stock_count = 999 WHERE stock_count IS NULL`);

    // Drop the legacy NOT NULL on `old_image_url` (deprecated — superseded by image_url
    // and image_urls). Without this, new INSERTs fail because we no longer write the column.
    await pool.query(`
        DO $$ BEGIN
            ALTER TABLE products ALTER COLUMN old_image_url DROP NOT NULL;
        EXCEPTION WHEN undefined_column THEN NULL;
        END $$
    `);

    await pool.query(`
        DO $$ BEGIN
            ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending';
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$
    `);

    await pool.query(`
        DO $$ BEGIN
            UPDATE products SET image_url = old_image_url
            WHERE image_url IS NULL AND old_image_url IS NOT NULL;
        EXCEPTION WHEN undefined_column THEN NULL;
        END $$
    `);

    await pool.query(`
        UPDATE products
        SET image_urls = ARRAY[image_url]
        WHERE (image_urls IS NULL OR cardinality(image_urls) = 0)
          AND image_url IS NOT NULL
    `);

    await pool.query(`
        DO $$
        DECLARE
            current_type TEXT;
        BEGIN
            SELECT data_type INTO current_type
            FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'sizes';

            IF current_type = 'ARRAY' THEN
                ALTER TABLE products DROP COLUMN IF EXISTS sizes_new;
                ALTER TABLE products ADD COLUMN sizes_new JSONB DEFAULT '[]'::jsonb;
                UPDATE products SET sizes_new = COALESCE(
                    (SELECT jsonb_agg(jsonb_build_object('size', s, 'in_stock', true))
                     FROM unnest(sizes) AS s),
                    '[]'::jsonb
                );
                ALTER TABLE products DROP COLUMN sizes;
                ALTER TABLE products RENAME COLUMN sizes_new TO sizes;
            END IF;
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