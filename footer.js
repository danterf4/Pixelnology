(function () {
  var t = function (key) { return window.i18n ? window.i18n.t(key) : key; };

  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML =
    '<img src="https://www.igdb.com/assets/logos/igdb_logo.png" alt="IGDB logo" onerror="this.style.display=\'none\'">' +
    '<p>' +
      '<span data-i18n="footer.credit">' + t('footer.credit') + '</span>' +
      ' <a href="https://www.igdb.com" target="_blank" rel="noopener">IGDB</a>' +
      ' &nbsp;·&nbsp; <a href="index.html" data-i18n="nav.daily">' + t('nav.daily') + '</a>' +
      ' &nbsp;·&nbsp; <a href="index.html?view=history" data-i18n="nav.history">' + t('nav.history') + '</a>' +
      ' &nbsp;·&nbsp; <a href="blog.html" data-i18n="nav.blog">' + t('nav.blog') + '</a>' +
      ' &nbsp;·&nbsp; <a href="about.html" data-i18n="nav.about">' + t('nav.about') + '</a>' +
    '</p>';

  var placeholder = document.getElementById('site-footer');
  if (placeholder) placeholder.replaceWith(footer);
})();
