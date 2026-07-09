// ═══════════════════════════════════════════════════════
// BLOG POSTS
// Add new posts at the top of the array (newest first).
// Fields:
//   id       — URL-safe slug, used in the hash: blog.html#my-post
//   title    — Post title
//   date     — ISO date string: 'YYYY-MM-DD'
//   tags     — Array of strings (optional)
//   excerpt  — Short summary shown in the post list
//   content  — Full post body as an HTML string
// ═══════════════════════════════════════════════════════
const POSTS = [
  {
    id: 'hello-world',
    title: 'Hello, world',
    date: '2026-06-24',
    tags: ['personal'],
    excerpt: 'First post. A few words on why I built Gameology and what this space is for.',
    content: `
      <p>
        I've been meaning to start writing for a while. Not because I have anything particularly
        important to say, but because putting thoughts into words has a way of making them clearer —
        at least to me.
      </p>
      <p>
        Gameology started as a weekend experiment. I wanted to see if I could build a daily puzzle
        game from scratch — no frameworks, just HTML, CSS, and JavaScript. It turned into something
        I actually wanted to share, which surprised me.
      </p>
      <p>
        This blog is the other side of that. A place for longer thoughts: things I'm building,
        games I'm playing, ideas that don't fit anywhere else. No schedule, no theme. Just writing.
      </p>
      <p>
        If you found this through Gameology — thanks for playing. Come back tomorrow.
      </p>
    `
  }
];
