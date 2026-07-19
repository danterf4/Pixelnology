(function () {
  var T = {
    en: {
      'logo.sub':       'Video Game Timeline',
      'nav.daily':      'Daily Challenge',
      'nav.rank':       'Rank \'Em',
      'nav.history':    'Previous Challenges',
      'nav.blog':       'Blog',
      'nav.about':      'About',
      'footer.credit':  'Game information provided by',

      // How to play modal
      'how.title': 'HOW TO PLAY',
      'how.1': 'The timeline has <strong>2 anchor games</strong> pre-placed as reference points. Oldest at the top, newest at the bottom.',
      'how.2': '<strong>Drag games</strong> from the pool into the right spot on the timeline. On mobile, press and hold to drag.',
      'how.3': 'Place every game on the timeline, then hit <strong>Check Timeline</strong>.',
      'how.4': 'Correct games <strong>lock in and turn green</strong>. Wrong ones turn <strong>red</strong>. Move them and check again.',
      'how.5': 'You get <strong>3 checks</strong> total to get every game in the right spot.',

      // Index stats & UI
      'stat.attempts':  'Attempts left',
      'stat.placed':    'Games placed',
      'stat.remaining': 'Games left',
      'timeline.hint':  'Timeline. Oldest at top, newest at bottom',
      'btn.check':      'Check timeline',
      'btn.clear':      'Clear all',
      'how.bar':        'How to play',
      'dock.label':     'Game pool, drag onto the timeline',
      'past.banner':    'You\'re playing a past puzzle &nbsp;·&nbsp; <a href="index.html">Today\'s puzzle →</a>',

      // Previous Challenges (history) view
      'history.hero.title': 'Previous <span>Challenges</span>',
      'history.hero.sub':   'Every daily puzzle since launch. Play any one you missed, or review your past scores.',

      // Rank 'Em stats & UI
      'stat.ranked':    'Games ranked',
      'rank.hint':      'Ranking. Best average score at top, worst at bottom',
      'btn.checkRank':  'Check ranking',
      'dock.rankLabel': 'Game pool, drag onto the ranking',
      'how.rank.title': 'HOW TO PLAY',
      'how.rank.1': 'The ranking has <strong>2 anchor games</strong> pre-placed as reference points. Highest average score at the top, lowest at the bottom.',
      'how.rank.2': 'The score is the <strong>average of each game\'s Metacritic Metascore (critics) and User Score</strong>, critics and players don\'t always agree!',
      'how.rank.3': '<strong>Drag games</strong> from the pool into the right spot in the ranking. On mobile, press and hold to drag.',
      'how.rank.4': 'Rank every game, then hit <strong>Check ranking</strong>. Correct spots <strong>lock in and turn green</strong>, wrong ones turn <strong>red</strong>, move them and check again.',
      'how.rank.5': 'You get <strong>3 checks</strong> total to get every remaining game in its correct spot.',

      // Blog
      'blog.hero.title': "Max's <span>Blog</span>",
      'blog.hero.sub':   'Thoughts on games, building things, and everything else.',
      'blog.back':       '← All posts',
      'blog.empty':      'No posts yet.',
      'blog.loading':    'Loading…',
      'blog.error':      'Could not load post.',

      // About
      'about.hero.title': 'About<br><span>Gameology</span>',
      'about.hero.sub':   'A daily game timeline puzzle. Place video games in chronological order and see how well you know gaming history.',
      'about.s1.h':   'What is Gameology?',
      'about.s1.p1':  'Gameology is a <strong>daily browser puzzle</strong> inspired by the love of video game history. Each day a new set of 10 games is drawn from across gaming\'s timeline, from the early 80s all the way to the modern era.',
      'about.s1.p2':  'The timeline has <strong>2 anchor games</strong> pre-placed as reference points. Your job is to drag the remaining games into the right chronological order.',
      'about.s1.p3':  'You get up to <strong>three checks</strong>. Correct games lock in and turn green immediately. Wrong ones turn red, so you know exactly what to fix before checking again.',
      'about.s2.h':    'Who made it',
      'about.s2.role': 'Creator',
      'about.s2.bio':  'Gameology is a personal project born from a curiosity about game history and a love of daily puzzle games. Built from scratch with vanilla HTML, CSS, and JavaScript. No frameworks, just code and a lot of game trivia.',
      'about.s3.role': 'UI/UX Designer, also a better developer',
      'about.s3.bio':  'She is one of the selected few people in this world that can make the CSS behave like she wants to, without needing to add 400 tags and classes. She helped me make the site look way better and also has helped me fix a lot of issues.',
      'about.s4.h':    'Get in touch',
      'about.s4.p':    'Have a suggestion, found a bug, or just want to say hi? Reach out.',
    },

    es: {
      'logo.sub':       'Línea de Tiempo de Videojuegos',
      'nav.daily':      'Reto Diario',
      'nav.rank':       'Ranking',
      'nav.history':    'Retos Anteriores',
      'nav.blog':       'Blog',
      'nav.about':      'Acerca de',
      'footer.credit':  'Información de juegos proporcionada por',

      // How to play modal
      'how.title': 'CÓMO JUGAR',
      'how.1': 'La línea de tiempo tiene <strong>2 juegos ancla</strong> precolocados como puntos de referencia. Los más antiguos arriba, los más recientes abajo.',
      'how.2': '<strong>Arrastra juegos</strong> de la lista al lugar correcto en la línea de tiempo. En móvil, mantén presionado para arrastrar.',
      'how.3': 'Coloca todos los juegos en la línea de tiempo y luego pulsa <strong>Verificar línea</strong>.',
      'how.4': 'Los juegos correctos se <strong>bloquean y se vuelven verdes</strong>. Los incorrectos se ponen en <strong>rojo</strong>, muévelos y vuelve a verificar.',
      'how.5': 'Tienes <strong>3 verificaciones</strong> en total para colocar todos los juegos en su lugar.',

      // Index stats & UI
      'stat.attempts':  'Intentos restantes',
      'stat.placed':    'Juegos colocados',
      'stat.remaining': 'Juegos restantes',
      'timeline.hint':  'Línea de tiempo. Más antiguos arriba, más recientes abajo',
      'btn.check':      'Verificar línea',
      'btn.clear':      'Limpiar todo',
      'how.bar':        'Cómo jugar',
      'dock.label':     'Juegos disponibles, arrastra a la línea de tiempo',
      'past.banner':    'Estás jugando un puzzle pasado &nbsp;·&nbsp; <a href="index.html">Puzzle de hoy →</a>',

      // Vista de Retos Anteriores (historial)
      'history.hero.title': 'Retos <span>Anteriores</span>',
      'history.hero.sub':   'Todos los puzzles diarios desde el lanzamiento. Juega el que te falte o revisa tus puntajes anteriores.',

      // Ranking (Rank 'Em) stats & UI
      'stat.ranked':    'Juegos clasificados',
      'rank.hint':      'Ranking. Mejor puntaje promedio arriba, el peor abajo',
      'btn.checkRank':  'Verificar ranking',
      'dock.rankLabel': 'Juegos disponibles, arrastra al ranking',
      'how.rank.title': 'CÓMO JUGAR',
      'how.rank.1': 'El ranking tiene <strong>2 juegos ancla</strong> precolocados como puntos de referencia. El mejor puntaje promedio arriba, el más bajo abajo.',
      'how.rank.2': 'El puntaje es el <strong>promedio del Metascore de Metacritic (críticos) y el User Score</strong>, ¡la crítica y los jugadores no siempre coinciden!',
      'how.rank.3': '<strong>Arrastra juegos</strong> de la lista al lugar correcto en el ranking. En móvil, mantén presionado para arrastrar.',
      'how.rank.4': 'Clasifica todos los juegos y luego pulsa <strong>Verificar ranking</strong>. Los correctos se <strong>bloquean y se vuelven verdes</strong>, los incorrectos se ponen en <strong>rojo</strong>, muévelos y vuelve a verificar.',
      'how.rank.5': 'Tienes <strong>3 verificaciones</strong> en total para colocar cada juego restante en su lugar correcto.',

      // Blog
      'blog.hero.title': 'Blog <span>de Max</span>',
      'blog.hero.sub':   'Reflexiones sobre videojuegos, proyectos y todo lo demás.',
      'blog.back':       '← Todas las entradas',
      'blog.empty':      'Aún no hay entradas.',
      'blog.loading':    'Cargando…',
      'blog.error':      'No se pudo cargar la entrada.',

      // About
      'about.hero.title': 'Acerca de<br><span>Gameology</span>',
      'about.hero.sub':   'Un puzzle diario de línea de tiempo. Coloca videojuegos en orden cronológico y descubre cuánto sabes de la historia de los videojuegos.',
      'about.s1.h':   '¿Qué es Gameology?',
      'about.s1.p1':  'Gameology es un <strong>puzzle diario en el navegador</strong> inspirado en el amor por la historia de los videojuegos. Cada día se selecciona un nuevo conjunto de 10 juegos de toda la historia del gaming, desde los primeros años 80 hasta la era moderna.',
      'about.s1.p2':  'La línea de tiempo tiene <strong>2 juegos ancla</strong> precolocados como puntos de referencia. Tu trabajo es arrastrar los juegos restantes al orden cronológico correcto.',
      'about.s1.p3':  'Tienes hasta <strong>tres verificaciones</strong>. Los juegos correctos se bloquean y se vuelven verdes al instante, los incorrectos se ponen en rojo, así sabrás exactamente qué corregir antes de volver a verificar.',
      'about.s2.h':    'Quién lo hizo',
      'about.s2.role': 'Creador',
      'about.s2.bio':  'Gameology es un proyecto personal nacido de la curiosidad por la historia del gaming y el amor por los puzzles diarios. Construido desde cero con HTML, CSS y JavaScript. Sin frameworks, solo código y mucha trivia de videojuegos.',
      'about.s3.role': 'Diseñadora UI/UX, Mejor Desarrolladora que yo',
      'about.s3.bio':  'Una de las pocas capas de manipular el CSS a su voluntad, sin necesidad de usar 400 tags y clases. Me ayudó a hacer el sitio verse mejor y me ha ayudado a arreglar varios errores.',
      'about.s4.h':    'Contacto',
      'about.s4.p':    '¿Tienes una sugerencia, encontraste un error o simplemente quieres saludar? Escríbeme.',
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
