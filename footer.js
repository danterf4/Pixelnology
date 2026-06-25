(function () {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <img src="https://www.igdb.com/assets/logos/igdb_logo.png" alt="IGDB logo" onerror="this.style.display='none'">
    <p>
      Game information provided by <a href="https://www.igdb.com" target="_blank" rel="noopener">IGDB</a>
      &nbsp;·&nbsp; <a href="index.html">Daily Challenge</a>
      &nbsp;·&nbsp; <a href="blog.html">Blog</a>
      &nbsp;·&nbsp; <a href="about.html">About</a>
    </p>
  `;

  const placeholder = document.getElementById('site-footer');
  if (placeholder) placeholder.replaceWith(footer);
})();
