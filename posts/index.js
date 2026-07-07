// Blog post index — metadata only.
// To add a new post: create posts/your-post-id.html, then add an entry here.
// title and excerpt can be plain strings (single language) or { en: '...', es: '...' } objects.
const POST_INDEX = [
  {
    id: 'hello-world',
    title: {
      en: 'Hello, world',
      es: 'Hola, mundo'
    },
    date: '2026-06-24',
    tags: ['personal'],
    excerpt: {
      en: 'First post. A few words on why I built Gameology and what I want to do with this space',
      es: 'Primer post. Unas palabras sobre por qué construí Gameology y qué quiero hacer con este espacio.'
    }
  },
  {
    id: 'physical-media-death',
    title: {
      en: 'Death of the Physical Game',
      es: 'Muerte del Juego Fisico'
    },
    date: '2026-07-06',
    tags: ['personal'],
    excerpt: {
      en: 'Sony hits us with the news that they will no longer support physical games, this along with the GTA only digital release, paints a grim future for the industry',
      es: 'Sony nos golpea con la noticia de que no van a seguir produciendo discos para juegos digitales, esto junto al lanzamiento exclusivamente digital de GTA, pinta un oscuro futuro para la industria'
    }
  }
];
