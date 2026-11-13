(function () {
  var CODE = 'Christmas25';

  /* ── Announcement bar ── */
  if (!sessionStorage.getItem('xb')) {
    var bar = document.createElement('div');
    bar.className = 'xmas-bar';
    bar.innerHTML =
      '<div class="xmas-bar-inner">' +
        '<span>🎄 Christmas Sale — use</span>' +
        '<span class="xmas-code" title="Click to copy">' + CODE + '</span>' +
        '<span>at checkout for a discount on all products</span>' +
      '</div>' +
      '<button class="xb-dismiss" aria-label="Dismiss">×</button>';
    document.body.prepend(bar);
    document.body.classList.add('has-xmas-bar');

    /* copy on click */
    bar.querySelector('.xmas-code').addEventListener('click', function () {
      var el = this;
      try { navigator.clipboard.writeText(CODE); } catch (e) {
        var t = document.createElement('textarea');
        t.value = CODE; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
      }
      el.classList.add('xmas-code-copied');
      var prev = el.textContent; el.textContent = 'Copied!';
      setTimeout(function () { el.classList.remove('xmas-code-copied'); el.textContent = prev; }, 2000);
    });

    bar.querySelector('.xb-dismiss').addEventListener('click', function () {
      bar.remove();
      document.body.classList.remove('has-xmas-bar');
      sessionStorage.setItem('xb', '1');
    });
  }

  /* ── Snowflakes ── */
  var wrap = document.createElement('div');
  wrap.id = 'xmas-snow';
  document.body.appendChild(wrap);

  var FLAKES = ['❄', '❅', '❆'];
  var DOT = ['·', '•'];
  var mobile = window.innerWidth < 700;
  var n = mobile ? 20 : 40;

  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    var big = Math.random() > 0.65;
    var tiny = !big && Math.random() > 0.5;
    s.className = 'sf' + (big ? ' lg' : tiny ? ' sm' : '');
    s.textContent = tiny ? DOT[Math.floor(Math.random() * DOT.length)] : FLAKES[Math.floor(Math.random() * FLAKES.length)];
    var size = big ? (Math.random() * 6 + 18) : tiny ? (Math.random() * 4 + 7) : (Math.random() * 6 + 11);
    var dur  = Math.random() * 16 + 10;
    var del  = -(Math.random() * 30);
    var drift = (Math.random() * 40 - 20).toFixed(1) + 'px';
    var spin  = (Math.random() * 500 + 200).toFixed(0) + 'deg';
    s.style.cssText =
      'left:' + (Math.random() * 102 - 1) + '%;' +
      'font-size:' + size + 'px;' +
      'animation-duration:' + dur + 's;' +
      'animation-delay:' + del + 's;' +
      '--drift:' + drift + ';' +
      '--spin:' + spin + ';';
    wrap.appendChild(s);
  }

  /* Nav logo: keep original transparent logo.png (no swap) */

  /* ── Nav top offset: JS inline override (most reliable) ── */
  function fixNavTop() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var h = 42;
    nav.style.setProperty('top', (window.innerWidth >= 1000 ? h + 14 : h) + 'px', 'important');
  }
  fixNavTop();
  setTimeout(fixNavTop, 200);
  window.addEventListener('resize', fixNavTop);

  /* ── Update hero promo chip to Christmas deal ── */
  function updateChip() {
    var chip = document.querySelector('#sale');
    if (!chip) return;
    var txt = chip.querySelector('span');
    var badge = chip.querySelector('code');
    if (txt) txt.textContent = '🎄 Christmas Sale — use code ' + CODE + ' on all products';
    if (badge) {
      badge.textContent = 'SALE';
      badge.style.cssText = 'background:rgba(220,50,50,.18);color:#ff7070;border:1px solid rgba(220,50,50,.4);padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.06em';
    }
    chip.href = '/blog-christmas-2024';
  }
  updateChip();
  setTimeout(updateChip, 300);
})();
