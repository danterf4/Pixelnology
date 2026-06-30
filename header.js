(function () {
  var file = window.location.pathname.split('/').pop() || 'index.html';
  var isHistoryView = window.location.search.indexOf('view=history') !== -1;
  var current = (file === 'index.html' && isHistoryView) ? 'index.html?view=history' : file;
  var t = function (key) { return window.i18n ? window.i18n.t(key) : key; };
  var lang = window.i18n ? window.i18n.lang : 'en';

  var NAV = [
    { href: 'index.html',              key: 'nav.daily'   },
    { href: 'index.html?view=history', key: 'nav.history' },
    { href: 'blog.html',               key: 'nav.blog'    },
    { href: 'about.html',              key: 'nav.about'   }
  ];

  var navHtml = NAV.map(function (p) {
    var active = current === p.href ? ' active' : '';
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
    '</nav>';

  header.querySelectorAll('.lang-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.i18n) window.i18n.setLang(btn.dataset.lang);
    });
  });

  var placeholder = document.getElementById('site-header');
  if (placeholder) placeholder.replaceWith(header);
})();
