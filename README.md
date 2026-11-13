# tanrikulu.dev

The studio board site: an infinite, Figma-like canvas with a scroll-driven tour. Built with Vite and vanilla JS/CSS.

- `index.html`, `src/main.js`, `src/style.css`: the English site (`/`)
- `scripts/make-tr.mjs`: generates the Turkish page (`/tr`) from `index.html` on every build. Edit the English page, then add or update the matching Turkish line in this script. The build fails if a translated string no longer exists.
- `public/`: favicon, icons, social images, `robots.txt`, `sitemap.xml`

```sh
npm install
npm run dev     # local dev server (EN at /, TR at /tr/)
npm run build   # generates tr/index.html, then builds to dist/
```

Pushing to `main` deploys to production on Vercel.
