(function () {
  var file = window.location.pathname.split('/').pop() || 'index.html';
  var isHistoryView = window.location.search.indexOf('view=history') !== -1;
  var current = (file === 'index.html' && isHistoryView) ? 'index.html?view=history' : file;
  var t = function (key) { return window.i18n ? window.i18n.t(key) : key; };
  var lang = window.i18n ? window.i18n.lang : 'en';

  // From rank.html, jump straight to the Rank 'Em tab of Previous Challenges
  // instead of always defaulting to the Daily Challenge tab.
  var historyHref = file === 'rank.html' ? 'index.html?view=history&tab=rank' : 'index.html?view=history';

  var NAV = [
    { href: 'index.html', key: 'nav.daily'   },
    { href: 'rank.html',  key: 'nav.rank'    },
    { href: historyHref,  key: 'nav.history' },
    { href: 'blog.html',  key: 'nav.blog'    },
    { href: 'about.html', key: 'nav.about'   }
  ];

  var navHtml = NAV.map(function (p) {
    // The history link's href varies by page (see historyHref above), so
    // match its active state on the view rather than the exact href string.
    var active = (p.key === 'nav.history' ? isHistoryView : current === p.href) ? ' active' : '';
    return '<a href="' + p.href + '" class="site-nav-link' + active + '" data-i18n="' + p.key + '">' + t(p.key) + '</a>';
  }).join('');

  var header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML =
    '<div class="logo-wrap">' +
      '<div class="logo">GAME<span>OLOGY</span></div>' +
      '<div class="logo-sub" data-i18n="logo.sub">' + t('logo.sub') + '</div>' +
    '</div>' +
    '<nav class="site-nav">' +
      navHtml +
      '<div class="lang-toggle">' +
        '<button class="lang-toggle-btn' + (lang === 'en' ? ' active' : '') + '" data-lang="en">EN</button>' +
        '<button class="lang-toggle-btn' + (lang === 'es' ? ' active' : '') + '" data-lang="es">ES</button>' +
      '</div>' +
      '<a href="https://ko-fi.com/gameologysupport" target="_blank" rel="noopener" class="kofi-nav-btn">Support</a>' +
    '</nav>';

  header.querySelectorAll('.lang-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.i18n) window.i18n.setLang(btn.dataset.lang);
    });
  });

  var placeholder = document.getElementById('site-header');
  if (placeholder) placeholder.replaceWith(header);
})();
