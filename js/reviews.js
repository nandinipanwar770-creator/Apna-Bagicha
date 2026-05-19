/* ── Gibberish detector (shared) ─────────────────────────────── */
function isGibberish(text) {
  var t = (text || '').trim();
  if (!t) return false;
  if (t.split(/\s+/).some(function(w){ return w.length > 30; })) return true;
  var clean = t.toLowerCase().replace(/\s/g, '');
  var unique = clean.split('').filter(function(c,i,a){ return a.indexOf(c)===i; }).length;
  if (clean.length > 20 && unique / clean.length < 0.10) return true;
  return false;
}

/* ── Home-page review cards + popup ──────────────────────────── */
var _reviewStore = [];

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\x22/g, '&quot;');
}

function renderReviewCard(r, idx) {
  var initial = (r.name || '?')[0].toUpperCase();
  var starsHtml = '';
  for (var i = 1; i <= 5; i++) {
    starsHtml += i <= r.rating ? '&#9733;' : '&#9734;';
  }
  var words = (r.review || '').split(/\s+/).filter(Boolean);
  var truncated = words.length > 20;
  var displayText = truncated ? words.slice(0, 20).join(' ') + '...' : (r.review || '');
  var viewBtn = truncated
    ? '<button onclick=\'openRevPopup(' + idx + ')\' style=\'background:none;border:none;cursor:pointer;color:#3a7032;font-size:13px;font-weight:600;padding:4px 0 0;display:block;text-decoration:underline;\'>View full review &#8594;</button>'
    : '';
  return (
    '<div style=\'background:white;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid #f3f4f6;overflow:hidden;\'>' +
      '<div style=\'color:#d4a843;font-size:2.5rem;line-height:1;margin-bottom:12px;\'>&#8220;</div>' +
      '<p style=\'font-size:14px;color:#4b5563;line-height:1.75;margin:0 0 4px;word-break:break-all;overflow-wrap:anywhere;\'>' + escHtml(displayText) + '</p>' +
      viewBtn +
      '<div style=\'display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid #f3f4f6;margin-top:16px;min-width:0;\'>' +
        '<div style=\'width:40px;height:40px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;color:#3a7032;font-weight:700;font-size:14px;flex-shrink:0;\'>' + escHtml(initial) + '</div>' +
        '<div style=\'min-width:0;flex:1;overflow:hidden;\'>' +
          '<div style=\'font-size:14px;font-weight:700;color:#1f2937;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\'>' + escHtml(r.name) + '</div>' +
          (r.location ? '<div style=\'font-size:12px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;\'>' + escHtml(r.location) + '</div>' : '') +
        '</div>' +
        '<div style=\'margin-left:auto;color:#d4a843;font-size:14px;flex-shrink:0;\'>' + starsHtml + '</div>' +
      '</div>' +
    '</div>'
  );
}

function openRevPopup(idx) {
  var r = _reviewStore[idx];
  if (!r) return;
  var starsHtml = '';
  for (var i = 1; i <= 5; i++) {
    starsHtml += '<span style=\'font-size:22px;color:' + (i <= r.rating ? '#d4a843' : '#e5e7eb') + ';\'>&#9733;</span>';
  }
  document.getElementById('revPopupTitle').textContent = r.name || '';
  document.getElementById('revPopupStars').innerHTML = starsHtml;
  document.getElementById('revPopupText').textContent = r.review || '';
  document.getElementById('revPopupInitial').textContent = (r.name || '?')[0].toUpperCase();
  document.getElementById('revPopupName').textContent = r.name || '';
  var locEl = document.getElementById('revPopupLocation');
  locEl.textContent = r.location || '';
  locEl.style.display = r.location ? '' : 'none';
  document.getElementById('revPopupModal').style.display = 'flex';
}

function closeRevPopup() {
  document.getElementById('revPopupModal').style.display = 'none';
}

function loadReviews() {
  fetch('/api/reviews')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var grid = document.getElementById('reviewsGrid');
      if (!data.success || !data.reviews.length) return;
      _reviewStore = data.reviews;
      var top3 = data.reviews.slice(0, 3);
      grid.innerHTML = top3.map(function(r, i) { return renderReviewCard(r, i); }).join('');
      var viewAllWrap = document.getElementById('viewAllReviewsWrap');
      if (viewAllWrap) {
        if (data.reviews.length > 3) {
          viewAllWrap.style.display = 'flex';
          var cnt = document.getElementById('revTotalCount');
          if (cnt) cnt.textContent = data.reviews.length;
        } else {
          viewAllWrap.style.display = 'none';
        }
      }
    })
    .catch(function() {});
}
