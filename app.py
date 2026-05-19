from flask import Flask, render_template, request, redirect, url_for, session, send_from_directory, jsonify
import sqlite3, uuid, os, random, logging, requests as http_requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__, template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin@123')
DB_PATH = 'orders.db'
VALID_STATUSES = ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')
VALID_MSG_STATUSES = ('New', 'Read', 'Replied')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id        TEXT NOT NULL UNIQUE,
        product_name    TEXT NOT NULL,
        product_price   REAL NOT NULL,
        quantity        INTEGER NOT NULL DEFAULT 1,
        total_amount    REAL NOT NULL,
        customer_name   TEXT NOT NULL,
        customer_phone  TEXT NOT NULL,
        customer_email  TEXT DEFAULT '',
        customer_address TEXT NOT NULL,
        customer_city   TEXT NOT NULL,
        customer_state  TEXT NOT NULL,
        customer_pincode TEXT NOT NULL,
        payment_method  TEXT NOT NULL DEFAULT 'COD',
        status          TEXT NOT NULL DEFAULT 'Pending',
        notes           TEXT DEFAULT '',
        created_at      TEXT NOT NULL
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS contact_messages (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL,
        phone      TEXT DEFAULT '',
        message    TEXT NOT NULL,
        status     TEXT NOT NULL DEFAULT 'New',
        created_at TEXT NOT NULL
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS admin_config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL DEFAULT '',
        phone      TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS otp_sessions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        phone      TEXT NOT NULL,
        otp        TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used       INTEGER NOT NULL DEFAULT 0
    )''')
    conn.commit()
    # Seed initial password hash if not set yet
    row = conn.execute("SELECT value FROM admin_config WHERE key='password_hash'").fetchone()
    if not row:
        conn.execute("INSERT INTO admin_config (key, value) VALUES ('password_hash', ?)",
                     (generate_password_hash(ADMIN_PASSWORD),))
        conn.commit()
    conn.close()


def _set_admin_pwd(new_password):
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO admin_config (key, value) VALUES ('password_hash', ?)",
                 (generate_password_hash(new_password),))
    conn.commit()
    conn.close()


def _check_admin_pwd(input_password):
    conn = get_db()
    row = conn.execute("SELECT value FROM admin_config WHERE key='password_hash'").fetchone()
    conn.close()
    if row and check_password_hash(row['value'], input_password):
        return True
    # Fallback: allows recovery by updating ADMIN_PASSWORD in .env and restarting
    if input_password == ADMIN_PASSWORD:
        _set_admin_pwd(input_password)
        return True
    return False


init_db()


# ── Static asset routes ──────────────────────────────────────────────────────

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('images', filename)


@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)


@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)


# ── Existing page routes ──────────────────────────────────────────────────────

@app.route('/')
@app.route('/index.html')
def index():
    return send_from_directory('templates', 'index.html')


@app.route('/products')
@app.route('/products.html')
def products():
    return send_from_directory('templates', 'products.html')


@app.route('/about')
@app.route('/about.html')
def about():
    return send_from_directory('templates', 'about.html')


@app.route('/contact')
@app.route('/contact.html')
def contact():
    return send_from_directory('templates', 'contact.html')


@app.route('/blog')
@app.route('/blog.html')
def blog():
    return send_from_directory('templates', 'blog.html')


@app.route('/faq')
@app.route('/faq.html')
def faq():
    return send_from_directory('templates', 'faq.html')


@app.route('/seeds')
@app.route('/seeds.html')
def seeds():
    return send_from_directory('templates', 'seeds.html')


# ── Contact Message ───────────────────────────────────────────────────────────

@app.route('/send-message', methods=['POST'])
def send_message():
    data = request.get_json() or {}
    name    = data.get('name', '').strip()
    email   = data.get('email', '').strip()
    phone   = data.get('phone', '').strip()
    message = data.get('message', '').strip()

    if not name or not email or not message:
        return jsonify(success=False, error='Please fill all required fields.')

    conn = get_db()
    conn.execute(
        'INSERT INTO contact_messages (name, email, phone, message, created_at) VALUES (?,?,?,?,?)',
        (name, email, phone, message, datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    conn.commit()
    conn.close()
    return jsonify(success=True)


# ── Checkout ──────────────────────────────────────────────────────────────────

@app.route('/checkout')
@app.route('/checkout.html')
def checkout():
    return render_template('checkout.html',
        product_name=request.args.get('name', ''),
        product_price=request.args.get('price', '0'),
        product_img=request.args.get('img', ''),
    )


# ── Place Order ───────────────────────────────────────────────────────────────

@app.route('/place-order', methods=['POST'])
def place_order():
    f = request.form
    try:
        price = float(f.get('product_price') or 0)
        qty = max(1, int(f.get('quantity') or 1))
    except ValueError:
        return redirect(url_for('products'))

    order_id = 'AB-' + uuid.uuid4().hex[:8].upper()
    conn = get_db()
    conn.execute('''INSERT INTO orders
        (order_id, product_name, product_price, quantity, total_amount,
         customer_name, customer_phone, customer_email,
         customer_address, customer_city, customer_state, customer_pincode,
         payment_method, notes, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (order_id,
         f.get('product_name', ''), price, qty, price * qty,
         f.get('customer_name', ''), f.get('customer_phone', ''), f.get('customer_email', ''),
         f.get('customer_address', ''), f.get('customer_city', ''),
         f.get('customer_state', ''), f.get('customer_pincode', ''),
         f.get('payment_method', 'COD'), f.get('notes', ''),
         datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    conn.commit()
    conn.close()
    return redirect(url_for('order_success', order_id=order_id))


# ── Order Success ─────────────────────────────────────────────────────────────

@app.route('/order-success/<order_id>')
def order_success(order_id):
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE order_id=?', (order_id,)).fetchone()
    conn.close()
    return render_template('order_success.html', order=order)


# ── Admin Panel ───────────────────────────────────────────────────────────────

def _sidebar_counts(conn):
    pending_orders = conn.execute(
        'SELECT COUNT(*) FROM orders WHERE status="Pending"').fetchone()[0]
    new_messages = conn.execute(
        'SELECT COUNT(*) FROM contact_messages WHERE status="New"').fetchone()[0]
    return pending_orders, new_messages


@app.route('/admin', methods=['GET', 'POST'])
def admin():
    error = None
    if request.method == 'POST':
        if _check_admin_pwd(request.form.get('password', '')):
            session['admin'] = True
        else:
            error = 'Incorrect password. Please try again.'

    if not session.get('admin'):
        return render_template('admin.html', logged_in=False, error=error)

    view = request.args.get('view', 'orders')
    conn = get_db()
    pending_orders, new_messages = _sidebar_counts(conn)

    if view == 'changepass':
        error_map = {
            'wrong_current': 'Current password is incorrect.',
            'too_short':     'New password must be at least 6 characters.',
            'mismatch':      'New password and confirmation do not match.',
        }
        cp_error   = error_map.get(request.args.get('error', ''))
        cp_success = bool(request.args.get('success'))
        conn.close()
        return render_template('admin.html', logged_in=True, view='changepass',
            cp_error=cp_error, cp_success=cp_success,
            pending_orders=pending_orders, new_messages=new_messages)

    if view == 'messages':
        messages = conn.execute(
            'SELECT * FROM contact_messages ORDER BY created_at DESC').fetchall()
        msg_stats = conn.execute('''SELECT
            COUNT(*) total,
            COALESCE(SUM(CASE WHEN status="New"     THEN 1 ELSE 0 END), 0) new_count,
            COALESCE(SUM(CASE WHEN status="Read"    THEN 1 ELSE 0 END), 0) read_count,
            COALESCE(SUM(CASE WHEN status="Replied" THEN 1 ELSE 0 END), 0) replied_count
        FROM contact_messages''').fetchone()
        conn.close()
        return render_template('admin.html', logged_in=True, view='messages',
            messages=messages, msg_stats=msg_stats,
            pending_orders=pending_orders, new_messages=new_messages)

    # Orders view
    status_filter = request.args.get('status', 'all')
    search = request.args.get('q', '').strip()
    like = f'%{search}%'

    if status_filter == 'all':
        if search:
            orders = conn.execute(
                'SELECT * FROM orders WHERE order_id LIKE ? OR customer_name LIKE ? ORDER BY created_at DESC',
                (like, like)).fetchall()
        else:
            orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    else:
        if search:
            orders = conn.execute(
                'SELECT * FROM orders WHERE status=? AND (order_id LIKE ? OR customer_name LIKE ?) ORDER BY created_at DESC',
                (status_filter, like, like)).fetchall()
        else:
            orders = conn.execute(
                'SELECT * FROM orders WHERE status=? ORDER BY created_at DESC',
                (status_filter,)).fetchall()

    stats = conn.execute('''SELECT
        COUNT(*) total,
        COALESCE(SUM(CASE WHEN status="Pending"   THEN 1 ELSE 0 END), 0) pending,
        COALESCE(SUM(CASE WHEN status="Confirmed" THEN 1 ELSE 0 END), 0) confirmed,
        COALESCE(SUM(CASE WHEN status="Shipped"   THEN 1 ELSE 0 END), 0) shipped,
        COALESCE(SUM(CASE WHEN status="Delivered" THEN 1 ELSE 0 END), 0) delivered,
        COALESCE(SUM(CASE WHEN status="Cancelled" THEN 1 ELSE 0 END), 0) cancelled,
        COALESCE(SUM(total_amount), 0) revenue
    FROM orders''').fetchone()
    conn.close()

    return render_template('admin.html', logged_in=True, view='orders',
        orders=orders, stats=stats, status_filter=status_filter,
        search=search, pending_orders=pending_orders, new_messages=new_messages)


@app.route('/admin/update-status', methods=['POST'])
def admin_update_status():
    if not session.get('admin'):
        return redirect(url_for('admin'))
    status = request.form.get('status')
    if status not in VALID_STATUSES:
        return redirect(url_for('admin'))
    conn = get_db()
    conn.execute('UPDATE orders SET status=? WHERE order_id=?',
        (status, request.form.get('order_id')))
    conn.commit()
    conn.close()
    return redirect(url_for('admin',
        view='orders', status=request.form.get('current_filter', 'all')))


@app.route('/admin/messages/update-status', methods=['POST'])
def admin_message_status():
    if not session.get('admin'):
        return redirect(url_for('admin'))
    status = request.form.get('status')
    if status not in VALID_MSG_STATUSES:
        return redirect(url_for('admin', view='messages'))
    conn = get_db()
    conn.execute('UPDATE contact_messages SET status=? WHERE id=?',
        (status, request.form.get('msg_id')))
    conn.commit()
    conn.close()
    return redirect(url_for('admin', view='messages'))


@app.route('/admin/change-password', methods=['POST'])
def admin_change_password():
    if not session.get('admin'):
        return redirect(url_for('admin'))
    current  = request.form.get('current_password', '')
    new_pass = request.form.get('new_password', '')
    confirm  = request.form.get('confirm_password', '')
    if not _check_admin_pwd(current):
        return redirect(url_for('admin', view='changepass', error='wrong_current'))
    if len(new_pass) < 6:
        return redirect(url_for('admin', view='changepass', error='too_short'))
    if new_pass != confirm:
        return redirect(url_for('admin', view='changepass', error='mismatch'))
    _set_admin_pwd(new_pass)
    return redirect(url_for('admin', view='changepass', success='1'))


@app.route('/admin/delete-orders', methods=['POST'])
def admin_delete_orders():
    if not session.get('admin'):
        return redirect(url_for('admin'))
    order_ids = request.form.getlist('order_ids')
    if order_ids:
        conn = get_db()
        placeholders = ','.join('?' * len(order_ids))
        conn.execute(
            f'DELETE FROM orders WHERE order_id IN ({placeholders}) AND status="Cancelled"',
            order_ids)
        conn.commit()
        conn.close()
    return redirect(url_for('admin', view='orders', status='Cancelled'))


@app.route('/admin/logout')
def admin_logout():
    session.pop('admin', None)
    return redirect(url_for('admin'))


# ── User Login / OTP ──────────────────────────────────────────────────────────

@app.route('/login')
def login_page():
    if session.get('user_id'):
        return redirect(url_for('account_page'))
    next_url = request.args.get('next', '/')
    return render_template('login.html', next=next_url)


@app.route('/api/otp/send', methods=['POST'])
def otp_send():
    data  = request.get_json() or {}
    phone = data.get('phone', '').strip()

    # Normalise: keep only digits, expect 10-digit Indian number
    digits = ''.join(c for c in phone if c.isdigit())
    if len(digits) != 10:
        return jsonify(success=False, error='Enter a valid 10-digit mobile number.')

    otp        = str(random.randint(100000, 999999))
    expires_at = (datetime.now() + timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db()
    # Invalidate any previous unused OTPs for this number
    conn.execute("UPDATE otp_sessions SET used=1 WHERE phone=? AND used=0", (digits,))
    conn.execute("INSERT INTO otp_sessions (phone, otp, expires_at, used) VALUES (?,?,?,0)",
                 (digits, otp, expires_at))
    is_new = conn.execute("SELECT id FROM users WHERE phone=?", (digits,)).fetchone() is None
    conn.commit()
    conn.close()

    # ── Send OTP via Fast2SMS ──────────────────────────────────────────────
    sms_key = os.environ.get('FAST2SMS_KEY', '').strip()
    if sms_key:
        try:
            sms_resp = http_requests.get(
                'https://www.fast2sms.com/dev/bulkV2',
                headers={'authorization': sms_key, 'Cache-Control': 'no-cache'},
                params={
                    'route':            'otp',
                    'variables_values': otp,
                    'numbers':          digits,
                    'flash':            0,
                },
                timeout=8,
            )
            sms_data = sms_resp.json()
            if not sms_data.get('return'):
                logging.error("Fast2SMS error: %s", sms_data)
                return jsonify(success=False, error='Could not send OTP. Please try again.')
        except Exception as exc:
            logging.error("Fast2SMS exception: %s", exc)
            return jsonify(success=False, error='SMS service unavailable. Please try again.')
    else:
        # No API key set — log OTP to console for local development
        logging.warning("FAST2SMS_KEY not set. OTP for %s → %s", digits, otp)
    # ── End SMS block ──────────────────────────────────────────────────────

    resp = {'success': True, 'is_new': is_new}
    if app.debug and not sms_key:
        resp['otp'] = otp   # show OTP on screen only when no SMS key is configured
    return jsonify(**resp)


@app.route('/api/otp/verify', methods=['POST'])
def otp_verify():
    data  = request.get_json() or {}
    phone = ''.join(c for c in data.get('phone', '') if c.isdigit())
    otp   = data.get('otp', '').strip()
    name  = data.get('name', '').strip()

    if len(phone) != 10 or not otp:
        return jsonify(success=False, error='Invalid request.')

    now  = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db()
    row  = conn.execute(
        "SELECT * FROM otp_sessions WHERE phone=? AND otp=? AND used=0 AND expires_at>? ORDER BY id DESC LIMIT 1",
        (phone, otp, now)
    ).fetchone()

    if not row:
        conn.close()
        return jsonify(success=False, error='Invalid or expired OTP. Try again.')

    conn.execute("UPDATE otp_sessions SET used=1 WHERE id=?", (row['id'],))

    user = conn.execute("SELECT * FROM users WHERE phone=?", (phone,)).fetchone()
    if user:
        user_id   = user['id']
        user_name = user['name'] or name or 'User'
        if name and name != user['name']:
            conn.execute("UPDATE users SET name=? WHERE id=?", (name, user_id))
            user_name = name
    else:
        user_name = name or 'User'
        conn.execute("INSERT INTO users (name, phone, created_at) VALUES (?,?,?)",
                     (user_name, phone, now))
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

    conn.commit()
    conn.close()

    session['user_id']    = user_id
    session['user_name']  = user_name
    session['user_phone'] = phone
    return jsonify(success=True, user={'id': user_id, 'name': user_name, 'phone': phone})


@app.route('/api/me')
def api_me():
    uid = session.get('user_id')
    if not uid:
        return jsonify(None)
    return jsonify({'id': uid, 'name': session.get('user_name', ''), 'phone': session.get('user_phone', '')})


@app.route('/user/logout')
def user_logout():
    session.pop('user_id',    None)
    session.pop('user_name',  None)
    session.pop('user_phone', None)
    return redirect(request.referrer or '/')


@app.route('/account')
def account_page():
    if not session.get('user_id'):
        return redirect(url_for('login_page', next=request.url))
    return render_template('account.html',
        user_name=session.get('user_name', ''),
        user_phone=session.get('user_phone', ''),
        view=request.args.get('view', 'orders'))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
