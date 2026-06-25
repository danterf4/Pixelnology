(function () {
  const file = window.location.pathname.split('/').pop() || 'index.html';

  const NAV = [
    { href: 'index.html', label: 'Daily Challenge' },
    { href: 'blog.html',  label: 'Blog' },
    { href: 'about.html', label: 'About' }
  ];

  const navHtml = NAV.map(p =>
    `<a href="${p.href}" class="site-nav-link${file === p.href ? ' active' : ''}">${p.label}</a>`
  ).join('');

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="logo-wrap">
      <div class="logo">PIX<span>OLOGY</span></div>
      <div class="logo-sub">Video Game Timeline</div>
    </div>
    <nav class="site-nav">${navHtml}</nav>
  `;

  const placeholder = document.getElementById('site-header');
  if (placeholder) placeholder.replaceWith(header);
})();
