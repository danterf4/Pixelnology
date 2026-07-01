(function () {
  var T = {
    en: {
      'logo.sub':       'Video Game Timeline',
      'nav.daily':      'Daily Challenge',
      'nav.history':    'History',
      'nav.blog':       'Blog',
      'nav.about':      'About',
      'footer.credit':  'Game information provided by',

      // How to play modal
      'how.title': 'HOW TO PLAY',
      'how.1': 'The timeline has <strong>3 anchor games</strong> pre-placed as reference points — oldest at the top, newest at the bottom.',
      'how.2': '<strong>Drag games</strong> from the pool into the right spot on the timeline. On mobile, press and hold to drag.',
      'how.3': 'Place every game on the timeline, then hit <strong>Check Timeline</strong>.',
      'how.4': 'Correct games <strong>lock in and turn green</strong>. Wrong ones turn <strong>red</strong> — move them and check again.',
      'how.5': 'You get <strong>3 checks</strong> total to get every game in the right spot.',

      // Index stats & UI
      'stat.attempts':  'Attempts left',
      'stat.placed':    'Games placed',
      'stat.remaining': 'Games left',
      'timeline.hint':  'Timeline — oldest at top, newest at bottom',
      'btn.check':      'Check timeline',
      'btn.clear':      'Clear all',
      'how.bar':        'How to play',
      'dock.label':     'Game pool — drag onto the timeline',
      'past.banner':    'You\'re playing a past puzzle &nbsp;·&nbsp; <a href="index.html">Today\'s puzzle →</a>',

      // Blog
      'blog.hero.title': "Max's <span>Blog</span>",
      'blog.hero.sub':   'Thoughts on games, building things, and everything else.',
      'blog.back':       '← All posts',
      'blog.empty':      'No posts yet.',
      'blog.loading':    'Loading…',
      'blog.error':      'Could not load post.',

      // About
      'about.hero.title': 'About<br><span>Gameology</span>',
      'about.hero.sub':   'A daily game timeline puzzle — place video games in chronological order and see how well you know gaming history.',
      'about.s1.h':   'What is Gameology?',
      'about.s1.p1':  'Gameology is a <strong>daily browser puzzle</strong> inspired by the love of video game history. Each day a new set of 15 games is drawn from across gaming\'s timeline — from the early 80s all the way to the modern era.',
      'about.s1.p2':  'The timeline has <strong>3 anchor games</strong> pre-placed as reference points. Your job is to drag the remaining games into the right chronological order.',
      'about.s1.p3':  'You get up to <strong>three checks</strong>. Correct games lock in and turn green immediately — wrong ones turn red, so you know exactly what to fix before checking again.',
      'about.s2.h':    'Who made it',
      'about.s2.role': 'Creator &amp; Developer',
      'about.s2.bio':  'Gameology is a personal project born from a curiosity about game history and a love of daily puzzle games. Built from scratch with vanilla HTML, CSS, and JavaScript — no frameworks, just code and a lot of game trivia.',
      'about.s3.h':    'Get in touch',
      'about.s3.p':    'Have a suggestion, found a bug, or just want to say hi? Reach out.',
    },

    es: {
      'logo.sub':       'Línea de Tiempo de Videojuegos',
      'nav.daily':      'Reto Diario',
      'nav.history':    'Historial',
      'nav.blog':       'Blog',
      'nav.about':      'Acerca de',
      'footer.credit':  'Información de juegos proporcionada por',

      // How to play modal
      'how.title': 'CÓMO JUGAR',
      'how.1': 'La línea de tiempo tiene <strong>3 juegos ancla</strong> precolocados como puntos de referencia — los más antiguos arriba, los más recientes abajo.',
      'how.2': '<strong>Arrastra juegos</strong> de la lista al lugar correcto en la línea de tiempo. En móvil, mantén presionado para arrastrar.',
      'how.3': 'Coloca todos los juegos en la línea de tiempo y luego pulsa <strong>Verificar línea</strong>.',
      'how.4': 'Los juegos correctos se <strong>bloquean y se vuelven verdes</strong>. Los incorrectos se ponen en <strong>rojo</strong> — muévelos y vuelve a verificar.',
      'how.5': 'Tienes <strong>3 verificaciones</strong> en total para colocar todos los juegos en su lugar.',

      // Index stats & UI
      'stat.attempts':  'Intentos restantes',
      'stat.placed':    'Juegos colocados',
      'stat.remaining': 'Juegos restantes',
      'timeline.hint':  'Línea de tiempo — más antiguos arriba, más recientes abajo',
      'btn.check':      'Verificar línea',
      'btn.clear':      'Limpiar todo',
      'how.bar':        'Cómo jugar',
      'dock.label':     'Juegos disponibles — arrastra a la línea de tiempo',
      'past.banner':    'Estás jugando un puzzle pasado &nbsp;·&nbsp; <a href="index.html">Puzzle de hoy →</a>',

      // Blog
      'blog.hero.title': 'Blog <span>de Max</span>',
      'blog.hero.sub':   'Reflexiones sobre videojuegos, proyectos y todo lo demás.',
      'blog.back':       '← Todas las entradas',
      'blog.empty':      'Aún no hay entradas.',
      'blog.loading':    'Cargando…',
      'blog.error':      'No se pudo cargar la entrada.',

      // About
      'about.hero.title': 'Acerca de<br><span>Gameology</span>',
      'about.hero.sub':   'Un puzzle diario de línea de tiempo — coloca videojuegos en orden cronológico y descubre cuánto sabes de la historia de los videojuegos.',
      'about.s1.h':   '¿Qué es Gameology?',
      'about.s1.p1':  'Gameology es un <strong>puzzle diario en el navegador</strong> inspirado en el amor por la historia de los videojuegos. Cada día se selecciona un nuevo conjunto de 15 juegos de toda la historia del gaming — desde los primeros años 80 hasta la era moderna.',
      'about.s1.p2':  'La línea de tiempo tiene <strong>3 juegos ancla</strong> precolocados como puntos de referencia. Tu trabajo es arrastrar los juegos restantes al orden cronológico correcto.',
      'about.s1.p3':  'Tienes hasta <strong>tres verificaciones</strong>. Los juegos correctos se bloquean y se vuelven verdes al instante — los incorrectos se ponen en rojo, así sabrás exactamente qué corregir antes de volver a verificar.',
      'about.s2.h':    'Quién lo hizo',
      'about.s2.role': 'Creador y Desarrollador',
      'about.s2.bio':  'Gameology es un proyecto personal nacido de la curiosidad por la historia del gaming y el amor por los puzzles diarios. Construido desde cero con HTML, CSS y JavaScript — sin frameworks, solo código y mucha trivia de videojuegos.',
      'about.s3.h':    'Contacto',
      'about.s3.p':    '¿Tienes una sugerencia, encontraste un error o simplemente quieres saludar? Escríbeme.',
    }
  };

  window.i18n = {
    lang: localStorage.getItem('pixelnology_lang') || 'en',

    t: function (key) {
      return (T[this.lang] || T.en)[key] || T.en[key] || key;
    },

    setLang: function (lang) {
      this.lang = lang;
      localStorage.setItem('pixelnology_lang', lang);
      this.apply();
      window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
    },

    apply: function () {
      document.documentElement.lang = this.lang;

      // Plain text elements
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var val = window.i18n.t(el.dataset.i18n);
        if (val) el.textContent = val;
      });

      // HTML elements (contains <strong> etc.)
      document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        var val = window.i18n.t(el.dataset.i18nHtml);
        if (val) el.innerHTML = val;
      });

      // Blog post language sections
      document.querySelectorAll('.post-body [lang]').forEach(function (el) {
        el.style.display = el.getAttribute('lang') === window.i18n.lang ? '' : 'none';
      });

      // Sync toggle button active state
      document.querySelectorAll('.lang-toggle-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.lang === window.i18n.lang);
      });
    },

    init: function () {
      var self = this;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { self.apply(); });
      } else {
        this.apply();
      }
    }
  };

  window.i18n.init();
})();
