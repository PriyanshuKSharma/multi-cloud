# Poster Site

This folder is a standalone static poster site.

## Local use

Open `index.html` in a browser.

## Export options on the page

- `Download PNG`: saves a poster screenshot
- `Download PDF`: generates an A0-style PDF
- `Print / Save PDF`: opens browser print preview

## Host on Vercel

1. Open a terminal in the `poster` folder.
2. Run `vercel`.
3. For production, run `vercel --prod`.

Because `poster/vercel.json` is included, Vercel will serve this folder as a static site.

## Notes

- The export buttons use CDN-loaded libraries, so the page needs internet access when those scripts load.
- If you want a fully offline version, local copies of those libraries can be added later.
