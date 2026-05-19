/* PAGE LOAD SPINNER */
(function () {
  var overlay = document.createElement('div');
  overlay.id = 'pageSpinner';
  overlay.style.cssText = [
    'position:fixed;inset:0;z-index:99999;',
    'background:linear-gradient(145deg,#f0faf0 0%,#fdf8f0 55%,#fff 100%);',
    'display:flex;align-items:center;justify-content:center;',
    'transition:opacity 0.5s ease,transform 0.5s ease;'
  ].join('');

  overlay.innerHTML = [
    '<style>',
      '@keyframes _abSpin  { to { transform:rotate(360deg);  } }',
      '@keyframes _abSpinR { to { transform:rotate(-360deg); } }',
      '@keyframes _abPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.18);opacity:.75} }',
      '@keyframes _abDot   { 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-9px);opacity:1} }',
      '@keyframes _abFadeUp{ from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }',
      '@keyframes _abRipple{ 0%{transform:scale(.6);opacity:.6} 100%{transform:scale(2.2);opacity:0} }',
    '</style>',
    '<div style="display:flex;flex-direction:column;align-items:center;gap:0;">',
      '<div style="position:relative;width:110px;height:110px;margin-bottom:28px;">',
        '<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(58,112,50,0.15);animation:_abRipple 2s 0.2s ease-out infinite;"></div>',
        '<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(58,112,50,0.1); animation:_abRipple 2s 0.8s ease-out infinite;"></div>',
        '<div style="position:absolute;inset:0;border-radius:50%;border:4px solid #e8f5e3;border-top-color:#3a7032;border-right-color:#3a7032;animation:_abSpin 1s linear infinite;"></div>',
        '<div style="position:absolute;inset:14px;border-radius:50%;border:3px solid #fdf3dc;border-bottom-color:#d4a843;border-left-color:#d4a843;animation:_abSpinR 1.5s linear infinite;"></div>',
        '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">',
          '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#3a7032" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="animation:_abPulse 2s ease-in-out infinite;">',
            '<line x1="12" y1="22" x2="12" y2="11"/>',
            '<path d="M12 12C10 9 7 7.5 5 8.5c0 3 3 6 7 5.5"/>',
            '<path d="M12 12C14 9 17 7.5 19 8.5c0 3-3 6-7 5.5"/>',
          '</svg>',
        '</div>',
      '</div>',
      '<div style="animation:_abFadeUp 0.55s 0.15s both;">',
        '<span style="font-size:30px;font-weight:800;color:#166534;font-family:Georgia,serif;letter-spacing:-0.5px;">Apna</span>',
        '<span style="font-size:30px;font-weight:800;color:#ea580c;font-family:Georgia,serif;letter-spacing:-0.5px;margin-left:7px;">Bagicha</span>',
      '</div>',
      '<p style="font-size:11.5px;color:#9ca3af;margin:5px 0 22px;letter-spacing:0.08em;text-transform:uppercase;animation:_abFadeUp 0.55s 0.3s both;">Your True Farming Partner</p>',
      '<div style="display:flex;gap:8px;animation:_abFadeUp 0.4s 0.45s both;">',
        '<span style="width:9px;height:9px;border-radius:50%;background:#3a7032;display:inline-block;animation:_abDot 1.3s 0.0s ease-in-out infinite;"></span>',
        '<span style="width:9px;height:9px;border-radius:50%;background:#3a7032;display:inline-block;animation:_abDot 1.3s 0.2s ease-in-out infinite;"></span>',
        '<span style="width:9px;height:9px;border-radius:50%;background:#3a7032;display:inline-block;animation:_abDot 1.3s 0.4s ease-in-out infinite;"></span>',
      '</div>',
    '</div>'
  ].join('');

  document.documentElement.appendChild(overlay);

  var _start = Date.now();
  var _path  = window.location.pathname;
  var _min   = (_path === '/products' || _path === '/') ? 800 : 500;

  window.addEventListener('load', function () {
    var elapsed = Date.now() - _start;
    var wait = Math.max(0, _min - elapsed);
    setTimeout(function () {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(1.04)';
      setTimeout(function () { overlay.remove(); }, 520);
    }, wait);
  });
})();

/* AUTH NAVBAR INJECTION — with localStorage cache for instant no-flash rendering */
(function () {
  var CACHE_KEY = 'abUserCache';
  var CACHE_TTL = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

  function buildAuthHTML(user) {
    var area = document.getElementById('navAuthArea');
    if (!area) return;
    area.style.opacity = '0';
    area.style.transition = 'opacity 0.25s ease';
    if (user) {
      var init  = user.name.trim().charAt(0).toUpperCase();
      var first = user.name.trim().split(' ')[0];
      area.innerHTML =
        '<div style="position:relative;display:inline-block" id="abDropWrap">'
        + '<button onclick="document.getElementById(\'abDrop\').classList.toggle(\'hidden\')" '
        + 'style="display:inline-flex;align-items:center;gap:7px;background:#f0faf0;border:1.5px solid #c3e6c3;color:#2d5a27;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;">'
        + '<span style="width:24px;height:24px;border-radius:50%;background:#3a7032;color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">' + init + '</span>'
        + first
        + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>'
        + '</button>'
        + '<div id="abDrop" class="hidden" style="position:absolute;right:0;top:calc(100% + 8px);width:200px;background:white;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.13);border:1px solid #f0f0f0;padding:6px 0;z-index:9999;">'
        + '<a href="/account?view=orders" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#374151;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>My Orders</a>'
        + '<a href="/account?view=profile" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#374151;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>My Profile</a>'
        + '<a href="/account?view=changepass" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#374151;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#f9fafb\'" onmouseout="this.style.background=\'\'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>Change Password</a>'
        + '<hr style="margin:5px 0;border:none;border-top:1px solid #f3f4f6;">'
        + '<a href="/user/logout" style="display:flex;align-items:center;gap:10px;padding:10px 16px;font-size:13px;font-weight:500;color:#dc2626;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#fef2f2\'" onmouseout="this.style.background=\'\'"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Logout</a>'
        + '</div></div>';
      document.addEventListener('click', function (e) {
        var wrap = document.getElementById('abDropWrap');
        if (wrap && !wrap.contains(e.target)) {
          var drop = document.getElementById('abDrop');
          if (drop) drop.classList.add('hidden');
        }
      });
    } else {
      area.innerHTML = '<a href="/login" style="display:inline-flex;align-items:center;gap:6px;border:1.5px solid #3a7032;color:#3a7032;padding:7px 16px;border-radius:999px;font-size:13px;font-weight:600;text-decoration:none;transition:all 0.2s;font-family:inherit;" onmouseover="this.style.background=\'#3a7032\';this.style.color=\'white\'" onmouseout="this.style.background=\'\';this.style.color=\'#3a7032\'">'
        + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        + 'Login / Sign Up</a>';
    }
    requestAnimationFrame(function() { area.style.opacity = '1'; });
  }

  var cachedUser = null;
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      var obj = JSON.parse(raw);
      if (obj && obj.ts && (Date.now() - obj.ts) < CACHE_TTL) cachedUser = obj.user;
    }
  } catch (e) {}

  function initAuth() {
    buildAuthHTML(cachedUser);
    fetch('/api/me')
      .then(function (r) { return r.json(); })
      .then(function (user) {
        try {
          if (user) { localStorage.setItem(CACHE_KEY, JSON.stringify({ user: user, ts: Date.now() })); }
          else { localStorage.removeItem(CACHE_KEY); }
        } catch (e) {}
        if (JSON.stringify(user) !== JSON.stringify(cachedUser)) buildAuthHTML(user);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();

/* ═══════════════ CART ═══════════════ */

function getCart() {
  try { return JSON.parse(localStorage.getItem('apnaBagichaCart') || '[]'); } catch(e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem('apnaBagichaCart', JSON.stringify(cart));
  updateCartBadge();
  renderCartItems();
}
function addToCart(name, price) {
  var cart = getCart();
  var existing = cart.find(function(i) { return i.name === name; });
  if (existing) { existing.qty++; } else { cart.push({ name: name, price: price, qty: 1 }); }
  saveCart(cart);
  showCartToast(name);
}
function showCartToast(name) {
  var toast = document.getElementById('cartToast');
  if (!toast) return;
  var nameEl = document.getElementById('cartToastName');
  if (nameEl) nameEl.textContent = name.length > 40 ? name.slice(0, 40) + '…' : name;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(16px)';
  }, 2500);
}
function removeFromCart(idx) {
  var cart = getCart(); cart.splice(idx, 1); saveCart(cart);
}
function updateCartItemQty(idx, delta) {
  var cart = getCart();
  cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
  saveCart(cart);
}
function updateCartBadge() {
  var cart = getCart();
  var count = cart.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
  var badge = document.getElementById('cartBadge');
  if (badge) { badge.textContent = count; badge.style.display = count === 0 ? 'none' : 'inline-flex'; }
}
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function renderCartItems() {
  var cart = getCart();
  var total = cart.reduce(function(s, i) { return s + i.price * (i.qty || 1); }, 0);
  var totalCount = cart.reduce(function(s, i) { return s + (i.qty || 1); }, 0);
  var header  = document.getElementById('cartCountHeader');
  var itemsEl = document.getElementById('cartItems');
  var footer  = document.getElementById('cartFooter');
  var empty   = document.getElementById('cartEmpty');
  var totalEl = document.getElementById('cartTotal');
  if (header)  header.textContent  = '(' + totalCount + ' item' + (totalCount !== 1 ? 's' : '') + ')';
  if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
  if (cart.length === 0) {
    if (itemsEl) itemsEl.innerHTML = '';
    if (footer)  footer.style.display = 'none';
    if (empty)   empty.style.display  = 'flex';
    return;
  }
  if (footer) footer.style.display = 'block';
  if (empty)  empty.style.display  = 'none';
  if (itemsEl) {
    itemsEl.innerHTML = cart.map(function(item, idx) {
      var lineTotal = (item.price * (item.qty || 1)).toLocaleString('en-IN');
      return '<div style="display:flex;align-items:flex-start;gap:12px;background:#f9fafb;border-radius:12px;padding:12px;">'
        + '<div style="font-size:22px;margin-top:2px;flex-shrink:0;">🌱</div>'
        + '<div style="flex:1;min-width:0;">'
          + '<p style="font-weight:600;font-size:13px;color:#1f2937;margin:0 0 4px;line-height:1.4;">' + escHtml(item.name) + '</p>'
          + '<p style="color:#3a7032;font-weight:700;font-size:13px;margin:0 0 8px;">₹' + item.price.toLocaleString('en-IN') + ' × ' + (item.qty || 1) + ' = ₹' + lineTotal + '</p>'
          + '<div style="display:flex;align-items:center;gap:6px;">'
            + '<button onclick="updateCartItemQty(' + idx + ',-1)" style="width:28px;height:28px;border-radius:50%;border:1px solid #d1d5db;background:white;color:#374151;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;">−</button>'
            + '<span style="width:24px;text-align:center;font-size:13px;font-weight:700;color:#1f2937;">' + (item.qty || 1) + '</span>'
            + '<button onclick="updateCartItemQty(' + idx + ',1)" style="width:28px;height:28px;border-radius:50%;border:1px solid #d1d5db;background:white;color:#374151;font-size:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;">+</button>'
            + '<button onclick="removeFromCart(' + idx + ')" style="width:28px;height:28px;border-radius:50%;border:1px solid #fecaca;background:white;color:#f87171;font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-left:4px;" title="Remove">🗑</button>'
          + '</div>'
        + '</div>'
      + '</div>';
    }).join('');
  }
}
function openCart() {
  renderCartItems();
  var s = document.getElementById('cartSidebar');
  var o = document.getElementById('cartOverlay');
  if (s) s.style.transform = 'translateX(0)';
  if (o) o.style.display = 'block';
}
function closeCart() {
  var s = document.getElementById('cartSidebar');
  var o = document.getElementById('cartOverlay');
  if (s) s.style.transform = 'translateX(100%)';
  if (o) o.style.display = 'none';
}
function proceedToCheckout() {
  if (!getCart().length) return;
  window.location.href = '/checkout?from=cart';
}

// Inject cart icon + sidebar into the page
(function () {
  function initCart() {
    if (!document.getElementById('cartIconBtn')) {
      var area = document.getElementById('navAuthArea');
      if (area) {
        var btn = document.createElement('button');
        btn.id = 'cartIconBtn';
        btn.title = 'Cart';
        btn.setAttribute('onclick', 'openCart()');
        btn.style.cssText = 'position:relative;display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:transparent;border:0;cursor:pointer;margin-right:4px;transition:background 0.2s;';
        btn.onmouseover = function() { this.style.background = '#f0faf0'; };
        btn.onmouseout  = function() { this.style.background = 'transparent'; };
        btn.innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3a7032" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
          + '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>'
          + '<path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L22 6H6"/>'
          + '</svg>'
          + '<span id="cartBadge" style="display:none;position:absolute;top:-2px;right:-2px;background:#ef4444;color:white;font-size:10px;font-weight:700;border-radius:999px;min-width:17px;height:17px;align-items:center;justify-content:center;line-height:1;">0</span>';
        area.parentNode.insertBefore(btn, area);
      }
    }

    if (!document.getElementById('cartSidebar')) {
      var wrap = document.createElement('div');
      wrap.innerHTML =
        '<div id="cartToast" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(16px);z-index:2500;display:flex;align-items:center;gap:12px;background:#111827;color:white;padding:12px 16px;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.25);opacity:0;transition:opacity 0.3s,transform 0.3s;pointer-events:none;min-width:260px;max-width:90vw;">'
          + '<span style="font-size:20px;flex-shrink:0;">🛒</span>'
          + '<div style="flex:1;min-width:0;"><p style="font-size:11px;color:#9ca3af;font-weight:500;margin:0;">Added to cart</p><p id="cartToastName" style="font-size:13px;font-weight:600;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></p></div>'
          + '<button onclick="openCart()" style="flex-shrink:0;font-size:12px;font-weight:700;color:#4ade80;background:transparent;border:0;cursor:pointer;pointer-events:auto;white-space:nowrap;">View Cart →</button>'
        + '</div>'
        + '<div id="cartOverlay" onclick="closeCart()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1800;"></div>'
        + '<div id="cartSidebar" style="position:fixed;top:0;right:0;height:100%;width:380px;max-width:95vw;background:white;z-index:1801;box-shadow:0 0 40px rgba(0,0,0,0.18);display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.3s;">'
          + '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(135deg,#2d5a27,#3a7032);flex-shrink:0;">'
            + '<div style="display:flex;align-items:center;gap:8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L22 6H6"/></svg>'
            + '<h2 style="font-weight:700;font-size:16px;color:white;margin:0;">My Cart <span id="cartCountHeader" style="color:rgba(255,255,255,0.7);font-weight:400;font-size:14px;">(0 items)</span></h2></div>'
            + '<button onclick="closeCart()" style="color:rgba(255,255,255,0.7);font-size:24px;line-height:1;background:transparent;border:0;cursor:pointer;">&times;</button>'
          + '</div>'
          + '<div id="cartItems" style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;"></div>'
          + '<div id="cartEmpty" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px;">'
            + '<div style="font-size:56px;margin-bottom:16px;">🛒</div>'
            + '<p style="font-weight:600;font-size:15px;color:#4b5563;margin:0;">Your cart is empty</p>'
            + '<p style="font-size:13px;color:#9ca3af;margin:4px 0 16px;">Add products to start shopping</p>'
            + '<button onclick="window.location.href=\'/products\'" style="padding:8px 20px;background:#3a7032;color:white;border-radius:999px;font-size:13px;font-weight:600;border:0;cursor:pointer;">Browse Products</button>'
          + '</div>'
          + '<div id="cartFooter" style="display:none;padding:16px;border-top:1px solid #f3f4f6;background:#f9fafb;flex-shrink:0;">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span style="font-size:13px;color:#6b7280;">Delivery</span><span style="font-weight:600;font-size:13px;color:#16a34a;">FREE</span></div>'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><span style="font-weight:700;color:#1f2937;font-size:15px;">Total Payable</span><span id="cartTotal" style="font-weight:700;color:#2d5a27;font-size:20px;">₹0</span></div>'
            + '<button onclick="proceedToCheckout()" style="width:100%;background:#3a7032;color:white;font-weight:700;padding:12px;border-radius:12px;border:0;cursor:pointer;font-size:15px;" onmouseover="this.style.background=\'#2d5a27\'" onmouseout="this.style.background=\'#3a7032\'">Proceed to Checkout →</button>'
            + '<button onclick="closeCart()" style="width:100%;margin-top:8px;font-size:13px;color:#9ca3af;background:transparent;border:0;cursor:pointer;padding:4px;">Continue Shopping</button>'
          + '</div>'
        + '</div>';
      document.body.appendChild(wrap);
    }

    updateCartBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
  } else {
    initCart();
  }
})();

/* MOBILE MENU */
$(document).ready(function () {
  $(".menu-toggle").click(function () {
    $(".menu").slideToggle();
  });

  /* NAVBAR SHADOW */
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
      $(".navbar").addClass("scrolled");
    } else {
      $(".navbar").removeClass("scrolled");
    }
  });

  /* AUTO ACTIVE MENU */
  var currentPage = window.location.pathname.split("/").pop();
  $(".menu a:not(.nav-cta)").each(function () {
    if ($(this).attr("href") === currentPage) {
      $(".menu a:not(.nav-cta)").removeClass("active");
      $(this).addClass("active");
    }
  });

  /* RIPPLE EFFECT */
  $(".menu a").click(function (e) {
    var x = e.pageX - $(this).offset().left;
    var y = e.pageY - $(this).offset().top;
    var ripple = $("<span class='ripple'></span>");
    ripple.css({ top: y, left: x });
    $(this).append(ripple);
    setTimeout(function() { ripple.remove(); }, 600);
  });
});

/* ═══════════════ GLOBAL REVIEW MODAL ═══════════════ */
(function () {
  var _revRating = 5;

  function injectReviewModal() {
    if (document.getElementById('globalRevModal')) return;

    var el = document.createElement('div');
    el.innerHTML =
      // Modal overlay only (no floating button)
      '<div id="globalRevModal" onclick="closeGlobalRevModal(event)" '
      + 'style="display:none;position:fixed;inset:0;z-index:2200;background:rgba(0,0,0,0.55);align-items:center;justify-content:center;padding:16px;">'
      + '<div onclick="event.stopPropagation()" style="background:white;border-radius:20px;padding:28px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.22);position:relative;max-height:90vh;overflow-y:auto;">'
      + '<button onclick="closeGlobalRevModal()" style="position:absolute;top:14px;right:16px;font-size:22px;line-height:1;background:transparent;border:0;color:#9ca3af;cursor:pointer;">&times;</button>'

      // Form wrapper
      + '<div id="gRevFormWrap">'
      + '<h3 style="font-size:20px;font-weight:700;color:#2d5a27;margin:0 0 4px;font-family:\'Playfair Display\',Georgia,serif;">Share Your Experience</h3>'
      + '<p style="font-size:13px;color:#6b7280;margin:0 0 20px;">Help other farmers with your honest feedback</p>'

      + '<div style="margin-bottom:14px;">'
      + '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Your Name <span style="color:#f87171">*</span></label>'
      + '<input id="gRevName" type="text" maxlength="80" placeholder="e.g. Ramesh Kumar" '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\'" onblur="this.style.borderColor=\'#e5e7eb\'">'
      + '</div>'

      + '<div style="margin-bottom:14px;">'
      + '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Location / Occupation</label>'
      + '<input id="gRevLocation" type="text" maxlength="100" placeholder="e.g. Tomato Farmer, Punjab" '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\'" onblur="this.style.borderColor=\'#e5e7eb\'">'
      + '</div>'

      + '<div style="margin-bottom:14px;">'
      + '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">Rating <span style="color:#f87171">*</span></label>'
      + '<div id="gRevStars" style="display:flex;gap:6px;">'
      + '<span class="g-star" data-v="1" style="font-size:28px;cursor:pointer;transition:transform 0.15s;color:#d4a843;">★</span>'
      + '<span class="g-star" data-v="2" style="font-size:28px;cursor:pointer;transition:transform 0.15s;color:#d4a843;">★</span>'
      + '<span class="g-star" data-v="3" style="font-size:28px;cursor:pointer;transition:transform 0.15s;color:#d4a843;">★</span>'
      + '<span class="g-star" data-v="4" style="font-size:28px;cursor:pointer;transition:transform 0.15s;color:#d4a843;">★</span>'
      + '<span class="g-star" data-v="5" style="font-size:28px;cursor:pointer;transition:transform 0.15s;color:#d4a843;">★</span>'
      + '</div>'
      + '<input type="hidden" id="gRevRating" value="5">'
      + '</div>'

      + '<div style="margin-bottom:18px;">'
      + '<label style="display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:5px;">Your Review <span style="color:#f87171">*</span></label>'
      + '<textarea id="gRevText" rows="4" maxlength="600" placeholder="Tell us about your experience with our products..." '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:9px 12px;font-size:13.5px;outline:none;box-sizing:border-box;resize:none;font-family:inherit;transition:border-color 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\'" onblur="this.style.borderColor=\'#e5e7eb\'"></textarea>'
      + '</div>'

      + '<div id="gRevErr" style="display:none;color:#ef4444;font-size:12px;margin-bottom:10px;"></div>'
      + '<button id="gRevBtn" onclick="submitGlobalReview()" '
      + 'style="width:100%;background:#3a7032;color:white;border:0;border-radius:12px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:background 0.2s;" '
      + 'onmouseover="this.style.background=\'#2d5a27\'" onmouseout="this.style.background=\'#3a7032\'">Submit Review</button>'
      + '</div>'

      // Success screen
      + '<div id="gRevSuccess" style="display:none;text-align:center;padding:32px 0;">'
      + '<div style="font-size:52px;margin-bottom:12px;">🌱</div>'
      + '<h4 style="font-size:20px;font-weight:700;color:#2d5a27;margin:0 0 8px;font-family:\'Playfair Display\',Georgia,serif;">Thank You!</h4>'
      + '<p style="font-size:13px;color:#6b7280;margin:0 0 20px;">Your review has been published successfully.</p>'
      + '<button onclick="closeGlobalRevModal()" style="background:#3a7032;color:white;border:0;border-radius:12px;padding:10px 28px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">Close</button>'
      + '</div>'

      + '</div></div>'; // end inner card + modal

    document.body.appendChild(el);

    // Star interaction
    document.querySelectorAll('.g-star').forEach(function(s) {
      s.addEventListener('click', function() { setGRevStars(parseInt(this.dataset.v)); });
      s.addEventListener('mouseenter', function() { highlightGStars(parseInt(this.dataset.v)); });
      s.addEventListener('mouseleave', function() { highlightGStars(_revRating); });
    });
    setGRevStars(5);
  }

  function setGRevStars(val) {
    _revRating = val;
    document.getElementById('gRevRating').value = val;
    highlightGStars(val);
  }

  function highlightGStars(val) {
    document.querySelectorAll('.g-star').forEach(function(s) {
      var v = parseInt(s.dataset.v);
      s.textContent = v <= val ? '★' : '☆';
      s.style.color = v <= val ? '#d4a843' : '#d1d5db';
      s.style.transform = v <= val ? 'scale(1.1)' : '';
    });
  }

  window.openGlobalReviewModal = function() {
    var modal = document.getElementById('globalRevModal');
    if (!modal) return;
    // reset
    document.getElementById('gRevFormWrap').style.display = '';
    document.getElementById('gRevSuccess').style.display = 'none';
    document.getElementById('gRevName').value = '';
    document.getElementById('gRevLocation').value = '';
    document.getElementById('gRevText').value = '';
    document.getElementById('gRevErr').style.display = 'none';
    var btn = document.getElementById('gRevBtn');
    btn.disabled = false; btn.textContent = 'Submit Review';
    setGRevStars(5);
    // close any user dropdown
    var drop = document.getElementById('abDrop');
    if (drop) drop.classList.add('hidden');
    modal.style.display = 'flex';
  };

  window.closeGlobalRevModal = function(e) {
    if (e && e.target !== document.getElementById('globalRevModal')) return;
    document.getElementById('globalRevModal').style.display = 'none';
  };

  window.submitGlobalReview = function() {
    var name   = (document.getElementById('gRevName').value || '').trim();
    var loc    = (document.getElementById('gRevLocation').value || '').trim();
    var rating = parseInt(document.getElementById('gRevRating').value) || 5;
    var review = (document.getElementById('gRevText').value || '').trim();
    var errEl  = document.getElementById('gRevErr');
    var btn    = document.getElementById('gRevBtn');

    if (!name || !review) {
      errEl.textContent = 'Please fill in your name and review.';
      errEl.style.display = 'block';
      return;
    }
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Submitting…';

    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, location: loc, rating: rating, review: review })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        document.getElementById('gRevFormWrap').style.display = 'none';
        document.getElementById('gRevSuccess').style.display = '';
        // refresh reviews grid on home page if present
        if (typeof loadReviews === 'function') loadReviews();
      } else {
        errEl.textContent = data.error || 'Something went wrong. Please try again.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Submit Review';
      }
    })
    .catch(function() {
      errEl.textContent = 'Network error. Please try again.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Submit Review';
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectReviewModal);
  } else {
    injectReviewModal();
  }
})();

/* ═══════════════ GET QUOTE MODAL ═══════════════ */
(function () {

  function injectQuoteModal() {
    if (document.getElementById('quoteModal')) return;

    var el = document.createElement('div');
    el.innerHTML =
      '<div id="quoteModal" onclick="closeQuoteModal(event)" '
      + 'style="display:none;position:fixed;inset:0;z-index:2300;background:rgba(0,0,0,0.55);align-items:center;justify-content:center;padding:16px;overflow-y:auto;">'
      + '<div onclick="event.stopPropagation()" style="background:white;border-radius:24px;max-width:520px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.2);position:relative;overflow:hidden;margin:auto;">'

      // Header
      + '<div style="background:linear-gradient(135deg,#2d5a27 0%,#3a7032 60%,#4a8a3a 100%);padding:24px 28px 20px;position:relative;">'
      + '<button onclick="closeQuoteModal()" style="position:absolute;top:14px;right:16px;font-size:24px;line-height:1;background:transparent;border:0;color:rgba(255,255,255,0.6);cursor:pointer;">&times;</button>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">'
      + '<div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div>'
      + '<h3 style="font-size:20px;font-weight:700;color:white;margin:0;font-family:\'Playfair Display\',Georgia,serif;">Get a Free Quote</h3>'
      + '</div>'
      + '<p style="font-size:13px;color:rgba(255,255,255,0.65);margin:0;">Fill in your details — our team will respond within 24 hours.</p>'
      + '<div style="display:flex;gap:16px;margin-top:14px;">'
      + '<span style="font-size:11.5px;color:rgba(255,255,255,0.55);display:flex;align-items:center;gap:4px;">✓ No commitment</span>'
      + '<span style="font-size:11.5px;color:rgba(255,255,255,0.55);display:flex;align-items:center;gap:4px;">✓ Bulk pricing available</span>'
      + '<span style="font-size:11.5px;color:rgba(255,255,255,0.55);display:flex;align-items:center;gap:4px;">✓ Expert advice</span>'
      + '</div>'
      + '</div>'

      // Form
      + '<div id="quoteFormWrap" style="padding:24px 28px 28px;">'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
      + '<div>'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">Full Name <span style="color:#f87171;">*</span></label>'
      + '<input id="qName" type="text" maxlength="80" placeholder="e.g. Ramesh Kumar" '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;background:#fafafa;transition:border-color 0.2s,background 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'#e5e7eb\';this.style.background=\'#fafafa\'">'
      + '</div>'
      + '<div>'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">Phone Number <span style="color:#f87171;">*</span></label>'
      + '<input id="qPhone" type="tel" maxlength="15" placeholder="+91 98765 43210" '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;background:#fafafa;transition:border-color 0.2s,background 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'#e5e7eb\';this.style.background=\'#fafafa\'">'
      + '</div>'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
      + '<div>'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">Email Address</label>'
      + '<input id="qEmail" type="email" maxlength="120" placeholder="you@example.com" '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;background:#fafafa;transition:border-color 0.2s,background 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'#e5e7eb\';this.style.background=\'#fafafa\'">'
      + '</div>'
      + '<div>'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">State / City</label>'
      + '<input id="qState" type="text" maxlength="80" placeholder="e.g. Punjab, Delhi" '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;background:#fafafa;transition:border-color 0.2s,background 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'#e5e7eb\';this.style.background=\'#fafafa\'">'
      + '</div>'
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">'
      + '<div>'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">Product Category</label>'
      + '<select id="qCategory" style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;background:#fafafa;color:#374151;cursor:pointer;transition:border-color 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\'" onblur="this.style.borderColor=\'#e5e7eb\'">'
      + '<option value="">Select category...</option>'
      + '<option>Seeds &amp; Planting Material</option>'
      + '<option>Organic Fertilizers</option>'
      + '<option>Grow Bags &amp; Containers</option>'
      + '<option>Pest &amp; Disease Control</option>'
      + '<option>Soil Amendments</option>'
      + '<option>Gardening Tools</option>'
      + '<option>Multiple Products</option>'
      + '<option>Other</option>'
      + '</select>'
      + '</div>'
      + '<div>'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">Quantity Needed</label>'
      + '<select id="qQuantity" style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;font-family:inherit;background:#fafafa;color:#374151;cursor:pointer;transition:border-color 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\'" onblur="this.style.borderColor=\'#e5e7eb\'">'
      + '<option value="">Select quantity...</option>'
      + '<option>Small – 1 to 10 units</option>'
      + '<option>Medium – 11 to 50 units</option>'
      + '<option>Bulk – 51 to 200 units</option>'
      + '<option>Wholesale – 200+ units</option>'
      + '</select>'
      + '</div>'
      + '</div>'

      + '<div style="margin-bottom:16px;">'
      + '<label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;">Requirements / Message <span style="font-weight:400;color:#9ca3af;">(optional)</span></label>'
      + '<textarea id="qMessage" rows="3" maxlength="600" placeholder="e.g. I need organic fertilizers for 2 acres of tomato farming in Punjab. Looking for bulk pricing..." '
      + 'style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:13.5px;outline:none;box-sizing:border-box;resize:none;font-family:inherit;background:#fafafa;transition:border-color 0.2s,background 0.2s;" '
      + 'onfocus="this.style.borderColor=\'#3a7032\';this.style.background=\'#fff\'" onblur="this.style.borderColor=\'#e5e7eb\';this.style.background=\'#fafafa\'"></textarea>'
      + '</div>'

      + '<div id="quoteErr" style="display:none;color:#ef4444;font-size:12.5px;margin-bottom:12px;padding:8px 12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;"></div>'

      + '<button id="quoteBtn" onclick="submitQuoteForm()" '
      + 'style="width:100%;background:linear-gradient(135deg,#3a7032,#4a8a3a);color:white;border:0;border-radius:12px;padding:13px;font-size:14.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity 0.2s,transform 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;" '
      + 'onmouseover="this.style.opacity=\'0.92\'" onmouseout="this.style.opacity=\'1\'">'
      + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>'
      + 'Get My Free Quote'
      + '</button>'

      + '<p style="font-size:11.5px;color:#9ca3af;text-align:center;margin:10px 0 0;">🔒 Your information is secure. No spam, ever.</p>'
      + '</div>'

      // Success screen
      + '<div id="quoteSuccess" style="display:none;text-align:center;padding:48px 32px;">'
      + '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#3a7032,#5aaa4a);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">'
      + '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      + '</div>'
      + '<h4 style="font-size:22px;font-weight:700;color:#2d5a27;margin:0 0 8px;font-family:\'Playfair Display\',Georgia,serif;">Quote Request Sent!</h4>'
      + '<p style="font-size:14px;color:#6b7280;margin:0 0 6px;line-height:1.7;">Thank you! Our team will review your requirements<br>and get back to you <strong style="color:#3a7032;">within 24 hours.</strong></p>'
      + '<p style="font-size:13px;color:#9ca3af;margin:0 0 24px;">We may also reach out via WhatsApp for faster communication.</p>'
      + '<div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">'
      + '<button onclick="closeQuoteModal()" style="background:#3a7032;color:white;border:0;border-radius:12px;padding:10px 24px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;">Done</button>'
      + '<a href="/products" style="background:#f0fdf4;color:#3a7032;border:1.5px solid #bbf7d0;border-radius:12px;padding:10px 24px;font-size:13.5px;font-weight:600;text-decoration:none;display:inline-block;">Browse Products</a>'
      + '</div>'
      + '</div>'

      + '</div></div>'; // end card + modal

    document.body.appendChild(el);
  }

  window.openQuoteModal = function () {
    var modal = document.getElementById('quoteModal');
    if (!modal) return;
    document.getElementById('quoteFormWrap').style.display = '';
    document.getElementById('quoteSuccess').style.display = 'none';
    var ids = ['qName','qPhone','qEmail','qState','qMessage'];
    ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('qCategory').value = '';
    document.getElementById('qQuantity').value = '';
    document.getElementById('quoteErr').style.display = 'none';
    var btn = document.getElementById('quoteBtn');
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Get My Free Quote';
    var drop = document.getElementById('abDrop');
    if (drop) drop.classList.add('hidden');
    modal.style.display = 'flex';
    setTimeout(function() { var n = document.getElementById('qName'); if (n) n.focus(); }, 100);
  };

  window.closeQuoteModal = function (e) {
    if (e && e.target !== document.getElementById('quoteModal')) return;
    var modal = document.getElementById('quoteModal');
    if (modal) modal.style.display = 'none';
  };

  window.submitQuoteForm = function () {
    var name     = (document.getElementById('qName').value    || '').trim();
    var phone    = (document.getElementById('qPhone').value   || '').trim();
    var email    = (document.getElementById('qEmail').value   || '').trim();
    var state    = (document.getElementById('qState').value   || '').trim();
    var category = (document.getElementById('qCategory').value|| '').trim();
    var quantity = (document.getElementById('qQuantity').value|| '').trim();
    var message  = (document.getElementById('qMessage').value || '').trim();
    var errEl    = document.getElementById('quoteErr');
    var btn      = document.getElementById('quoteBtn');

    if (!name) {
      errEl.textContent = 'Please enter your full name.';
      errEl.style.display = 'block';
      document.getElementById('qName').focus();
      return;
    }
    if (!phone || phone.replace(/\D/g,'').length < 10) {
      errEl.textContent = 'Please enter a valid phone number.';
      errEl.style.display = 'block';
      document.getElementById('qPhone').focus();
      return;
    }
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Sending…';

    fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, email: email, category: category, quantity: quantity, state: state, message: message })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        document.getElementById('quoteFormWrap').style.display = 'none';
        document.getElementById('quoteSuccess').style.display = '';
      } else {
        errEl.textContent = data.error || 'Something went wrong. Please try again.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Get My Free Quote';
      }
    })
    .catch(function() {
      errEl.textContent = 'Network error. Please check your connection and try again.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg> Get My Free Quote';
    });
  };

  function interceptQuoteLinks() {
    document.addEventListener('click', function(e) {
      var t = e.target.closest('a.nav-cta');
      if (t && (t.textContent.trim() === 'Get Quote' || t.getAttribute('href') === '#get-quote')) {
        e.preventDefault();
        openQuoteModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { injectQuoteModal(); interceptQuoteLinks(); });
  } else {
    injectQuoteModal();
    interceptQuoteLinks();
  }
})();
