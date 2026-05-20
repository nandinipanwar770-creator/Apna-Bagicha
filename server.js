require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nunjucks = require('nunjucks');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const Razorpay = require('razorpay');
const multer = require('multer');

// ── Multer: images → images/products/, CSV → tmp/ ────────────────────────────
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'images') {
      cb(null, path.join(__dirname, 'images', 'products'));
    } else {
      cb(null, path.join(__dirname, 'tmp'));
    }
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage: uploadStorage });

const razorpay = (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('xxx'))
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET || '' })
  : null;

const app = express();
const PORT = process.env.PORT || 8080;

// ── Database ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'apna_bagicha',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// ── Templating ────────────────────────────────────────────────────────────────
const env = nunjucks.configure('templates', { autoescape: true, express: app, noCache: true });
env.addFilter('format_int', (n) => Math.round(n || 0).toLocaleString('en-IN'));
env.addFilter('truncdate', (s) => (s ? String(s).slice(0, 16) : ''));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SECRET_KEY || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 },
}));

// Static assets
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/css',    express.static(path.join(__dirname, 'css')));
app.use('/js',     express.static(path.join(__dirname, 'js')));
app.use('/images/products', express.static(path.join(__dirname, 'images', 'products')));

// ── DB Init ───────────────────────────────────────────────────────────────────
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id               SERIAL PRIMARY KEY,
      order_id         TEXT NOT NULL UNIQUE,
      product_name     TEXT NOT NULL,
      product_price    NUMERIC NOT NULL,
      quantity         INTEGER NOT NULL DEFAULT 1,
      total_amount     NUMERIC NOT NULL,
      customer_name    TEXT NOT NULL,
      customer_phone   TEXT NOT NULL,
      customer_email   TEXT DEFAULT '',
      customer_address TEXT NOT NULL,
      customer_city    TEXT NOT NULL,
      customer_state   TEXT NOT NULL,
      customer_pincode TEXT NOT NULL,
      payment_method   TEXT NOT NULL DEFAULT 'COD',
      status           TEXT NOT NULL DEFAULT 'Pending',
      notes            TEXT DEFAULT '',
      created_at       TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      phone      TEXT DEFAULT '',
      message    TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'New',
      created_at TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      phone         TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      address       TEXT DEFAULT '',
      city          TEXT DEFAULT '',
      state         TEXT DEFAULT '',
      pincode       TEXT DEFAULT '',
      created_at    TEXT NOT NULL
    )
  `);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_sessions (
      id         SERIAL PRIMARY KEY,
      phone      TEXT NOT NULL,
      otp        TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL,
      price       NUMERIC NOT NULL DEFAULT 0,
      emoji       TEXT DEFAULT '',
      image       TEXT DEFAULT '',
      description TEXT DEFAULT '',
      badge_text  TEXT DEFAULT '',
      seed_cat    TEXT DEFAULT '',
      in_stock    BOOLEAN NOT NULL DEFAULT TRUE,
      quantity    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    )
  `);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      email      TEXT DEFAULT '',
      category   TEXT DEFAULT '',
      quantity   TEXT DEFAULT '',
      state      TEXT DEFAULT '',
      message    TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      location   TEXT DEFAULT '',
      rating     INTEGER NOT NULL DEFAULT 5,
      review     TEXT NOT NULL,
      approved   BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // Seed 3 default reviews if table is empty
  const revCount = await pool.query('SELECT COUNT(*) FROM reviews');
  if (parseInt(revCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO reviews (name, location, rating, review) VALUES
      ($1,$2,$3,$4),($5,$6,$7,$8),($9,$10,$11,$12)
    `, [
      'Ramesh Kumar', 'Tomato Farmer, Punjab', 5,
      "With Apna Bagicha's hybrid tomato seeds, my yield increased by 40% this season. The quality is absolutely top-notch. I have been using their products for many years and trust them completely.",
      'Sunita Devi', 'Organic Farmer, Haryana', 5,
      "Using vermicompost and bio-pesticides together has greatly improved my soil health. Their team also guided me through the organic certification process. Excellent service all around.",
      'Mohan Singh', 'Agricultural Dealer, UP', 5,
      "The perfect place for bulk orders. Competitive pricing and always on-time delivery. Their free agronomist helpline is very helpful — an expert is always available whenever you need guidance.",
    ]);
  }
  // Seed password hash if not set
  const row = await pool.query("SELECT value FROM admin_config WHERE key='password_hash'");
  if (row.rows.length === 0) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin@123', 10);
    await pool.query("INSERT INTO admin_config (key, value) VALUES ('password_hash', $1)", [hash]);
  }
  console.log('✅ Database ready');
}

// ── Password helpers ──────────────────────────────────────────────────────────
async function checkAdminPwd(input) {
  const row = await pool.query("SELECT value FROM admin_config WHERE key='password_hash'");
  if (row.rows.length && await bcrypt.compare(input, row.rows[0].value)) return true;
  // Fallback: env password for recovery
  if (input === (process.env.ADMIN_PASSWORD || 'admin@123')) {
    await setAdminPwd(input);
    return true;
  }
  return false;
}

async function setAdminPwd(newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "INSERT INTO admin_config (key, value) VALUES ('password_hash', $1) ON CONFLICT (key) DO UPDATE SET value=$1",
    [hash]
  );
}

// ── Sidebar counts helper ─────────────────────────────────────────────────────
async function sidebarCounts() {
  const [o, m] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM orders WHERE status=$1', ['Pending']),
    pool.query('SELECT COUNT(*) FROM contact_messages WHERE status=$1', ['New']),
  ]);
  return {
    pending_orders: parseInt(o.rows[0].count),
    new_messages:   parseInt(m.rows[0].count),
  };
}

// ── Static pages ──────────────────────────────────────────────────────────────
const staticPages = ['index', 'products', 'about', 'contact', 'blog', 'faq', 'seeds'];
staticPages.forEach((page) => {
  app.get(['/' + (page === 'index' ? '' : page), '/' + page + '.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', page + '.html'));
  });
});
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'templates', 'index.html')));

// ── Contact form ──────────────────────────────────────────────────────────────
app.post('/send-message', async (req, res) => {
  const { name = '', email = '', phone = '', message = '' } = req.body;
  if (!name.trim() || !email.trim() || !message.trim())
    return res.json({ success: false, error: 'Please fill all required fields.' });
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.query(
    'INSERT INTO contact_messages (name, email, phone, message, created_at) VALUES ($1,$2,$3,$4,$5)',
    [name.trim(), email.trim(), phone.trim(), message.trim(), now]
  );
  res.json({ success: true });
});

// ── Checkout ──────────────────────────────────────────────────────────────────
app.get(['/checkout', '/checkout.html'], (req, res) => {
  if (!req.session.user) {
    const q = new URLSearchParams(req.query).toString();
    return res.redirect('/login?next=' + encodeURIComponent('/checkout' + (q ? '?' + q : '')));
  }
  res.sendFile(path.join(__dirname, 'templates', 'checkout.html'));
});

// ── Place Order ───────────────────────────────────────────────────────────────
app.post('/place-order', async (req, res) => {
  const f = req.body;
  const price = parseFloat(f.product_price) || 0;
  const qty   = Math.max(1, parseInt(f.quantity) || 1);
  const orderId = 'AB-' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const userId = req.session.user ? req.session.user.id : null;
  await pool.query(`
    INSERT INTO orders
      (order_id, product_name, product_price, quantity, total_amount,
       customer_name, customer_phone, customer_email,
       customer_address, customer_city, customer_state, customer_pincode,
       payment_method, notes, created_at, user_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [orderId, f.product_name || '', price, qty, price * qty,
     f.customer_name || '', f.customer_phone || '', f.customer_email || '',
     f.customer_address || '', f.customer_city || '',
     f.customer_state || '', f.customer_pincode || '',
     f.payment_method || 'COD', f.notes || '', now, userId]
  );
  res.redirect('/order-success/' + orderId);
});

// ── Order Success ─────────────────────────────────────────────────────────────
app.get('/order-success/:order_id', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'order_success.html'));
});

app.get('/api/orders/:order_id', async (req, res) => {
  try {
    const row = await pool.query('SELECT * FROM orders WHERE order_id=$1', [req.params.order_id]);
    if (!row.rows.length) return res.json({ success: false, error: 'Order not found' });
    const o = row.rows[0];
    res.json({ success: true, order: {
      order_id:         o.order_id,
      product_name:     o.product_name,
      quantity:         o.quantity,
      payment_method:   o.payment_method,
      customer_city:    o.customer_city,
      customer_state:   o.customer_state,
      customer_pincode: o.customer_pincode,
      total_amount:     o.total_amount,
    }});
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ── Razorpay: Create Order ────────────────────────────────────────────────────
app.post('/create-razorpay-order', async (req, res) => {
  if (!razorpay) return res.status(503).json({ error: 'Payment gateway not configured.' });
  const { amount } = req.body;
  if (!amount || isNaN(amount))
    return res.status(400).json({ error: 'Invalid amount' });
  try {
    const order = await razorpay.orders.create({
      amount:   Math.round(parseFloat(amount) * 100), // paise
      currency: 'INR',
      receipt:  'rcpt_' + uuidv4().slice(0, 8),
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency,
               keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ error: 'Payment gateway error. Please try again.' });
  }
});

// ── Razorpay: Verify & Save Order ─────────────────────────────────────────────
app.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, formData } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(body).digest('hex');

  if (expectedSig !== razorpay_signature)
    return res.status(400).json({ success: false, error: 'Payment verification failed.' });

  const f = formData;
  const price = parseFloat(f.product_price) || 0;
  const qty   = Math.max(1, parseInt(f.quantity) || 1);
  const orderId = 'AB-' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const userId = req.session.user ? req.session.user.id : null;
  await pool.query(`
    INSERT INTO orders
      (order_id, product_name, product_price, quantity, total_amount,
       customer_name, customer_phone, customer_email,
       customer_address, customer_city, customer_state, customer_pincode,
       payment_method, notes, created_at, user_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [orderId, f.product_name || '', price, qty, price * qty,
     f.customer_name || '', f.customer_phone || '', f.customer_email || '',
     f.customer_address || '', f.customer_city || '',
     f.customer_state || '', f.customer_pincode || '',
     'Online (Razorpay) · ' + razorpay_payment_id, f.notes || '', now, userId]
  );
  res.json({ success: true, orderId });
});

// ── Admin ─────────────────────────────────────────────────────────────────────
const VALID_STATUSES     = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const VALID_MSG_STATUSES = ['New', 'Read', 'Replied'];

app.get('/admin', (req, res) => {
  if (!req.session.admin)
    return res.render('admin.html', { logged_in: false, error: null });
  res.render('admin.html', { logged_in: true, view: req.query.view || 'orders' });
});

app.get('/api/admin/counts', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try { res.json({ success: true, ...(await sidebarCounts()) }); }
  catch (e) { res.json({ success: false, error: e.message }); }
});

app.get('/api/admin/orders', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const statusFilter = req.query.status || 'all';
    const search = (req.query.q || '').trim();
    const like = `%${search}%`;
    let ordersQ;
    if (statusFilter === 'all') {
      ordersQ = search
        ? pool.query('SELECT * FROM orders WHERE order_id ILIKE $1 OR customer_name ILIKE $1 ORDER BY created_at DESC', [like])
        : pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    } else {
      ordersQ = search
        ? pool.query('SELECT * FROM orders WHERE status=$1 AND (order_id ILIKE $2 OR customer_name ILIKE $2) ORDER BY created_at DESC', [statusFilter, like])
        : pool.query('SELECT * FROM orders WHERE status=$1 ORDER BY created_at DESC', [statusFilter]);
    }
    const [ordersRes, statsRes] = await Promise.all([
      ordersQ,
      pool.query(`SELECT COUNT(*) total,
        SUM(CASE WHEN status='Pending'   THEN 1 ELSE 0 END) pending,
        SUM(CASE WHEN status='Confirmed' THEN 1 ELSE 0 END) confirmed,
        SUM(CASE WHEN status='Shipped'   THEN 1 ELSE 0 END) shipped,
        SUM(CASE WHEN status='Delivered' THEN 1 ELSE 0 END) delivered,
        SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) cancelled,
        SUM(total_amount) revenue FROM orders`),
    ]);
    res.json({ success: true, orders: ordersRes.rows, stats: statsRes.rows[0], statusFilter, search });
  } catch (e) { res.json({ success: false, error: e.message }); }
});

app.get('/api/admin/messages', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const [messagesRes, statsRes] = await Promise.all([
      pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC'),
      pool.query(`SELECT COUNT(*) total,
        SUM(CASE WHEN status='New'     THEN 1 ELSE 0 END) new_count,
        SUM(CASE WHEN status='Read'    THEN 1 ELSE 0 END) read_count,
        SUM(CASE WHEN status='Replied' THEN 1 ELSE 0 END) replied_count
        FROM contact_messages`),
    ]);
    res.json({ success: true, messages: messagesRes.rows, msg_stats: statsRes.rows[0] });
  } catch (e) { res.json({ success: false, error: e.message }); }
});

app.get('/api/admin/products', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const rows = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, products: rows.rows });
  } catch (e) { res.json({ success: false, error: e.message }); }
});

app.post('/admin', async (req, res) => {
  const ok = await checkAdminPwd(req.body.password || '');
  if (ok) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.render('admin.html', { logged_in: false, error: 'Incorrect password. Please try again.' });
});

app.post('/admin/update-status', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  const { status, order_id, current_filter } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.redirect('/admin');
  await pool.query('UPDATE orders SET status=$1 WHERE order_id=$2', [status, order_id]);
  res.redirect(`/admin?view=orders&status=${current_filter || 'all'}`);
});

// ── Admin: partial order fulfillment ─────────────────────────────────────────
app.post('/admin/update-order-items', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  const { order_id, kept_items, removed_items, new_total } = req.body;
  if (!order_id) return res.status(400).json({ error: 'Missing order_id' });

  const keptArr  = Array.isArray(kept_items)    ? kept_items    : (kept_items    ? [kept_items]    : []);
  const removedArr = Array.isArray(removed_items) ? removed_items : (removed_items ? [removed_items] : []);

  const count = keptArr.length;
  const combinedName = count === 0
    ? 'Order Cancelled (all items unavailable)'
    : 'Cart Order (' + count + ' item' + (count > 1 ? 's' : '') + '): ' + keptArr.join(', ');

  const total = parseFloat(new_total) || 0;
  let note = '';
  if (removedArr.length) note = 'Items marked unavailable by admin: ' + removedArr.join('; ');

  await pool.query(
    `UPDATE orders SET product_name=$1, total_amount=$2, notes=COALESCE(NULLIF(notes,''),'')||$3 WHERE order_id=$4`,
    [combinedName, total, note ? '\n[Admin] ' + note : '', order_id]
  );
  res.json({ success: true });
});

app.post('/admin/messages/update-status', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  const { status, msg_id } = req.body;
  if (!VALID_MSG_STATUSES.includes(status)) return res.redirect('/admin?view=messages');
  await pool.query('UPDATE contact_messages SET status=$1 WHERE id=$2', [status, msg_id]);
  res.redirect('/admin?view=messages');
});

app.post('/admin/delete-orders', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  let ids = req.body.order_ids;
  if (!ids) return res.redirect('/admin?view=orders&status=Cancelled');
  if (!Array.isArray(ids)) ids = [ids];
  if (ids.length) {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    await pool.query(
      `DELETE FROM orders WHERE order_id IN (${placeholders}) AND status='Cancelled'`,
      ids
    );
  }
  res.redirect('/admin?view=orders&status=Cancelled');
});

app.post('/admin/change-password', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  const { current_password, new_password, confirm_password } = req.body;
  if (!await checkAdminPwd(current_password || ''))
    return res.redirect('/admin?view=changepass&error=wrong_current');
  if ((new_password || '').length < 6)
    return res.redirect('/admin?view=changepass&error=too_short');
  if (new_password !== confirm_password)
    return res.redirect('/admin?view=changepass&error=mismatch');
  await setAdminPwd(new_password);
  res.redirect('/admin?view=changepass&success=1');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin');
});

// ── User Auth ─────────────────────────────────────────────────────────────────
app.get('/api/me', (req, res) => {
  if (req.session.user)
    return res.json({ id: req.session.user.id, name: req.session.user.name, email: req.session.user.email, phone: req.session.user.phone || '' });
  res.json(null);
});

app.get('/api/user/profile', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, error: 'Not logged in' });
  try {
    const row = await pool.query('SELECT * FROM users WHERE id=$1', [req.session.user.id]);
    if (!row.rows.length) return res.json({ success: false, error: 'User not found' });
    const u = row.rows[0];
    res.json({ success: true, user: {
      name: u.name, email: u.email, phone: u.phone || '',
      address: u.address || '', city: u.city || '',
      state: u.state || '', pincode: u.pincode || '',
    }});
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/account/orders', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, error: 'Not logged in' });
  try {
    const PER_PAGE = 10;
    const reqPage = Math.max(1, parseInt(req.query.page) || 1);
    const [ordersRes, countRes] = await Promise.all([
      pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.session.user.id, PER_PAGE, (reqPage - 1) * PER_PAGE]),
      pool.query('SELECT COUNT(*) FROM orders WHERE user_id=$1', [req.session.user.id]),
    ]);
    const totalOrders = parseInt(countRes.rows[0].count);
    const totalPages  = Math.max(1, Math.ceil(totalOrders / PER_PAGE));
    const page        = Math.min(reqPage, totalPages);
    const orders = ordersRes.rows.map(o => {
      const m = (o.notes || '').match(/\[Admin\] Items marked unavailable by admin:\s*(.+)/);
      return { ...o, admin_removed: m ? m[1].trim() : null };
    });
    res.json({
      success: true, orders, page, totalPages, totalOrders,
      startItem: totalOrders === 0 ? 0 : (page - 1) * PER_PAGE + 1,
      endItem: Math.min(page * PER_PAGE, totalOrders),
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ── OTP Auth ──────────────────────────────────────────────────────────────────
app.post('/api/otp/send', async (req, res) => {
  const digits = (req.body.phone || '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10)
    return res.json({ success: false, error: 'Enter a valid 10-digit mobile number.' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await pool.query('UPDATE otp_sessions SET used=TRUE WHERE phone=$1 AND used=FALSE', [digits]);
  await pool.query('INSERT INTO otp_sessions (phone, otp, expires_at, used) VALUES ($1,$2,$3,FALSE)',
    [digits, otp, expires.toISOString()]);

  const isNew = (await pool.query('SELECT id FROM users WHERE phone=$1', [digits])).rows.length === 0;

  // ── Fast2SMS ──────────────────────────────────────────────────────────────
  const smsKey = (process.env.FAST2SMS_KEY || '').trim();
  if (smsKey) {
    try {
      const smsRes = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        headers: { authorization: smsKey, 'Cache-Control': 'no-cache' },
        params:  { route: 'otp', variables_values: otp, numbers: digits, flash: 0 },
        timeout: 8000,
      });
      if (!smsRes.data.return) {
        console.error('Fast2SMS error:', smsRes.data);
        return res.json({ success: false, error: 'Could not send OTP. Please try again.' });
      }
    } catch (err) {
      console.error('Fast2SMS exception:', err.message);
      return res.json({ success: false, error: 'SMS service unavailable. Please try again.' });
    }
  } else {
    console.warn(`[DEV] OTP for ${digits} → ${otp}`);
  }
  // ── End Fast2SMS ──────────────────────────────────────────────────────────

  const resp = { success: true, is_new: isNew };
  if (!smsKey) resp.otp = otp; // show on screen only when no SMS key configured
  res.json(resp);
});

app.post('/api/otp/verify', async (req, res) => {
  const digits = (req.body.phone || '').replace(/\D/g, '').slice(-10);
  const otp    = (req.body.otp  || '').trim();
  const name   = (req.body.name || '').trim();

  if (digits.length !== 10 || !otp)
    return res.json({ success: false, error: 'Invalid request.' });

  const row = await pool.query(
    'SELECT * FROM otp_sessions WHERE phone=$1 AND otp=$2 AND used=FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [digits, otp]
  );
  if (!row.rows.length)
    return res.json({ success: false, error: 'Invalid or expired OTP. Try again.' });

  await pool.query('UPDATE otp_sessions SET used=TRUE WHERE id=$1', [row.rows[0].id]);

  // Find or create user by phone
  let userRow = await pool.query('SELECT * FROM users WHERE phone=$1', [digits]);
  let user;
  if (userRow.rows.length) {
    user = userRow.rows[0];
    if (name && name !== user.name)
      await pool.query('UPDATE users SET name=$1 WHERE id=$2', [name, user.id]);
  } else {
    const displayName  = name || 'User';
    const syntheticEmail = `otp_${digits}@apnabagicha.local`;
    const dummyHash    = await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 10);
    const now          = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const ins = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [displayName, syntheticEmail, digits, dummyHash, now]
    );
    user = ins.rows[0];
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, phone: digits };
  res.json({ success: true, user: { id: user.id, name: user.name, phone: digits } });
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect(req.query.next || '/');
  res.render('login.html', {
    mode:    req.query.mode    || 'login',
    next:    req.query.next    || '/',
    error:   req.query.error   || null,
    success: req.query.success || null,
  });
});

app.post('/login', async (req, res) => {
  const { email = '', password = '', next = '/' } = req.body;
  const identifier = email.trim();
  // Allow login with email or phone number
  const row = await pool.query(
    'SELECT * FROM users WHERE email=$1 OR phone=$1',
    [identifier.toLowerCase()]
  );
  if (!row.rows.length || !row.rows[0].password_hash ||
      !await bcrypt.compare(password, row.rows[0].password_hash))
    return res.redirect('/login?error=' + encodeURIComponent('Invalid email/phone or password') + '&next=' + encodeURIComponent(next));
  const u = row.rows[0];
  req.session.user = { id: u.id, name: u.name, email: u.email, phone: u.phone };
  res.redirect(next);
});

app.post('/register', async (req, res) => {
  const { name = '', email = '', phone = '', password = '', confirm_password = '', next = '/' } = req.body;
  const redir = (err) => res.redirect('/login?mode=register&error=' + encodeURIComponent(err) + '&next=' + encodeURIComponent(next));
  if (!name.trim() || !email.trim() || !password) return redir('Please fill all required fields');
  if (password.length < 6) return redir('Password must be at least 6 characters');
  if (password !== confirm_password) return redir('Passwords do not match');
  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email.trim().toLowerCase()]);
  if (existing.rows.length) return redir('An account with this email already exists');
  const hash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const ins = await pool.query(
    'INSERT INTO users (name, email, phone, password_hash, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email',
    [name.trim(), email.trim().toLowerCase(), phone.trim(), hash, now]
  );
  req.session.user = { id: ins.rows[0].id, name: ins.rows[0].name, email: ins.rows[0].email };
  res.redirect(next);
});

app.get('/user/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/login?success=' + encodeURIComponent('You have been logged out successfully'));
});

// ── Account Dashboard ─────────────────────────────────────────────────────────
app.get('/account', (req, res) => {
  if (!req.session.user)
    return res.redirect('/login?next=/account&error=' + encodeURIComponent('Please log in to view your account'));
  res.sendFile(path.join(__dirname, 'templates', 'account.html'));
});

app.post('/account/update-profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { name = '', phone = '', address = '', city = '', state = '', pincode = '' } = req.body;
  if (!name.trim())
    return res.redirect('/account?view=profile&profile_error=' + encodeURIComponent('Name cannot be empty'));
  await pool.query(
    'UPDATE users SET name=$1, phone=$2, address=$3, city=$4, state=$5, pincode=$6 WHERE id=$7',
    [name.trim(), phone, address, city, state, pincode, req.session.user.id]
  );
  req.session.user.name = name.trim();
  res.redirect('/account?view=profile&profile_success=1');
});

app.post('/account/cancel-order', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { order_id } = req.body;
  const row = await pool.query(
    'SELECT status, user_id FROM orders WHERE order_id=$1', [order_id]
  );
  if (!row.rows.length) return res.redirect('/account?view=orders&cancel_error=Order+not+found');
  const order = row.rows[0];
  if (order.user_id !== req.session.user.id)
    return res.redirect('/account?view=orders&cancel_error=Unauthorized');
  if (order.status !== 'Pending')
    return res.redirect('/account?view=orders&cancel_error=Only+pending+orders+can+be+cancelled');
  await pool.query("UPDATE orders SET status='Cancelled' WHERE order_id=$1", [order_id]);
  res.redirect('/account?view=orders&cancel_success=1');
});

app.post('/account/change-password', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { current_password = '', new_password = '', confirm_password = '' } = req.body;
  const row = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.session.user.id]);
  if (!row.rows.length || !await bcrypt.compare(current_password, row.rows[0].password_hash))
    return res.redirect('/account?view=changepass&cp_error=' + encodeURIComponent('Current password is incorrect'));
  if (new_password.length < 6)
    return res.redirect('/account?view=changepass&cp_error=' + encodeURIComponent('Password must be at least 6 characters'));
  if (new_password !== confirm_password)
    return res.redirect('/account?view=changepass&cp_error=' + encodeURIComponent('Passwords do not match'));
  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.session.user.id]);
  res.redirect('/account?view=changepass&cp_success=1');
});

// ── Products API (public) ─────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  const rows = await pool.query('SELECT * FROM products ORDER BY created_at ASC');
  res.json(rows.rows);
});

app.get('/api/products/stock', async (req, res) => {
  const rows = await pool.query('SELECT name, in_stock, quantity FROM products');
  res.json(rows.rows);
});

// ── Products: CSV template download ──────────────────────────────────────────
app.get('/admin/products/template', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  const header = 'slug,name,category,price,emoji,image,description,badge_text,seed_cat,in_stock';
  const example = 'rose_new,New Rose Plant,garden,299,🌹,rose_new.png,Beautiful fragrant rose.,Garden Plant,,true';
  const example2 = 'tomato_seeds,Cherry Tomato Seeds,seeds,59,🍅,tomato_seeds.png,Fast-growing cherry tomato variety.,Seeds,vegetable,true';
  const csv = [header, example, example2].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products_template.csv"');
  res.send(csv);
});

// ── Products: Export all as CSV ───────────────────────────────────────────────
app.get('/admin/products/export', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  const rows = (await pool.query('SELECT * FROM products ORDER BY created_at ASC')).rows;
  const header = 'slug,name,category,price,emoji,image,description,badge_text,seed_cat,in_stock';
  const lines = rows.map(r =>
    [r.slug, r.name, r.category, r.price, r.emoji,
     r.image, `"${(r.description || '').replace(/"/g, '""')}"`,
     r.badge_text, r.seed_cat, r.in_stock].join(',')
  );
  const csv = [header, ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
  res.send(csv);
});

// ── Products: Import CSV + images ─────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (line[i] === ',' && !inQ) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += line[i];
    }
  }
  result.push(cur.trim());
  return result;
}

app.post('/admin/products/import',
  upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'images', maxCount: 100 }]),
  async (req, res) => {
    if (!req.session.admin) return res.redirect('/admin');
    const csvFile = req.files && req.files['csv'] && req.files['csv'][0];
    if (!csvFile) return res.redirect('/admin?view=products&import_error=No+CSV+file+uploaded');
    try {
      const text = fs.readFileSync(csvFile.path, 'utf8');
      fs.unlinkSync(csvFile.path);
      const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
      if (lines.length < 2) return res.redirect('/admin?view=products&import_error=CSV+has+no+data+rows');
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      let inserted = 0;
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        if (!row.slug || !row.name || !row.category) continue;
        const price = parseFloat(row.price) || 0;
        const inStock = (row.in_stock || 'true').toLowerCase() !== 'false';
        await pool.query(`
          INSERT INTO products (slug, name, category, price, emoji, image, description, badge_text, seed_cat, in_stock, created_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (slug) DO UPDATE SET
            name=$2, category=$3, price=$4, emoji=$5, image=$6,
            description=$7, badge_text=$8, seed_cat=$9, in_stock=$10`,
          [row.slug, row.name, row.category, price, row.emoji || '',
           row.image || '', row.description || '', row.badge_text || '',
           row.seed_cat || '', inStock, now]
        );
        inserted++;
      }
      res.redirect(`/admin?view=products&import_success=${inserted}+products+imported`);
    } catch (err) {
      console.error('Import error:', err.message);
      res.redirect('/admin?view=products&import_error=' + encodeURIComponent(err.message));
    }
  }
);

// ── Products: Delete one ──────────────────────────────────────────────────────
app.post('/admin/products/delete/:id', async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin');
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.redirect('/admin?view=products');
});

app.post('/api/admin/products/update/:id', async (req, res) => {
  if (!req.session.admin) return res.status(403).json({ error: 'Unauthorized' });
  try {
    const { name, price, in_stock, quantity, badge_text, description } = req.body;
    if (!name || !name.trim()) return res.json({ success: false, error: 'Name is required' });
    const priceVal    = parseFloat(price) || 0;
    const qtyVal      = Math.max(0, parseInt(quantity) || 0);
    const inStockVal  = in_stock === 'true' || in_stock === true || in_stock === '1';
    await pool.query(
      'UPDATE products SET name=$1, price=$2, in_stock=$3, quantity=$4, badge_text=$5, description=$6 WHERE id=$7',
      [name.trim(), priceVal, inStockVal, qtyVal, (badge_text || '').trim(), (description || '').trim(), req.params.id]
    );
    const row = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    res.json({ success: true, product: row.rows[0] });
  } catch (e) { res.json({ success: false, error: e.message }); }
});

// ── Update order delivery address ─────────────────────────────────────────────
app.post('/account/update-order-address', async (req, res) => {
  if (!req.session.user) return res.json({ success: false, error: 'Not logged in' });
  const { order_id, customer_name, customer_phone, customer_address, customer_city, customer_state, customer_pincode } = req.body;
  if (!order_id) return res.json({ success: false, error: 'Missing order ID' });

  const row = await pool.query('SELECT status, user_id FROM orders WHERE order_id=$1', [order_id]);
  if (!row.rows.length) return res.json({ success: false, error: 'Order not found' });
  const order = row.rows[0];

  if (order.user_id !== req.session.user.id) return res.json({ success: false, error: 'Unauthorized' });
  if (order.status !== 'Pending')
    return res.json({ success: false, error: 'Address can only be changed for Pending orders' });

  if (!customer_name || !customer_address || !customer_city || !customer_state || !customer_pincode)
    return res.json({ success: false, error: 'Please fill all required fields' });

  await pool.query(
    `UPDATE orders SET customer_name=$1, customer_phone=$2, customer_address=$3,
     customer_city=$4, customer_state=$5, customer_pincode=$6 WHERE order_id=$7`,
    [customer_name.trim(), (customer_phone || '').trim(), customer_address.trim(),
     customer_city.trim(), customer_state.trim(), customer_pincode.trim(), order_id]
  );
  res.json({ success: true });
});

// ── Reviews ───────────────────────────────────────────────────────────────────
app.get('/reviews', (req, res) => {
  res.render('reviews.html', {});
});

app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, location, rating, review, created_at FROM reviews WHERE approved=TRUE ORDER BY created_at DESC'
    );
    const allReviews = result.rows;
    const total = allReviews.length;
    const PER_PAGE = 9;
    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const page = Math.min(Math.max(1, parseInt(req.query.page) || 1), totalPages);
    const reviews = allReviews.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const avgRating = total
      ? (allReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
      : '0.0';
    const fiveStarPct = total
      ? Math.round((allReviews.filter(r => r.rating === 5).length / total) * 100)
      : 0;
    const ratingCounts = [5,4,3,2,1].map(star => ({
      star,
      count: allReviews.filter(r => r.rating === star).length
    }));
    res.json({ success: true, reviews, total, avgRating, fiveStarPct, ratingCounts, page, totalPages });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

function isGibberish(text) {
  const t = text.trim();
  if (!t) return false;
  // Reject if any single word exceeds 30 characters
  if (t.split(/\s+/).some(w => w.length > 30)) return true;
  // Reject if unique characters make up less than 10% of total length (very low diversity)
  const unique = new Set(t.toLowerCase().replace(/\s/g, '')).size;
  const total  = t.replace(/\s/g, '').length;
  if (total > 20 && unique / total < 0.10) return true;
  return false;
}

app.post('/api/reviews', async (req, res) => {
  try {
    const { name, location, rating, review } = req.body;
    if (!name || !review) return res.json({ success: false, error: 'Name and review are required.' });
    if (isGibberish(name))   return res.json({ success: false, error: 'Please enter a valid name.' });
    if (isGibberish(review)) return res.json({ success: false, error: 'Please write a meaningful review.' });
    const rat = Math.min(5, Math.max(1, parseInt(rating) || 5));
    await pool.query(
      'INSERT INTO reviews (name, location, rating, review) VALUES ($1, $2, $3, $4)',
      [name.trim(), (location || '').trim(), rat, review.trim()]
    );
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/quote', async (req, res) => {
  try {
    const { name, phone, email, category, quantity, state, message } = req.body;
    if (!name || !phone) return res.json({ success: false, error: 'Name and phone number are required.' });
    await pool.query(
      'INSERT INTO quotes (name, phone, email, category, quantity, state, message) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [name.trim(), phone.trim(), (email||'').trim(), (category||'').trim(), (quantity||'').trim(), (state||'').trim(), (message||'').trim()]
    );
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 Apna Bagicha running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('❌ DB connection failed:', err.message);
  console.error('Make sure PostgreSQL is running and .env credentials are correct.');
  process.exit(1);
});
