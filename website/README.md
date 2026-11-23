# FlixView website

The download site for FlixView. Plain HTML, CSS and JavaScript: no build step.

## Structure

```
index.html            The page
404.html              Not-found page (Cloudflare Pages serves it automatically)
privacy.html          Privacy policy, served at /privacy
terms.html            Terms and conditions, served at /terms
js/legal.js           Nav, menu and contents list for the legal pages
css/styles.css        All styles
js/main.js            Smooth scrolling, hero, poster wall, How it works,
                      feature tile demos, reveals, live download links
js/tmdb.js            Fetches trending artwork from TMDB (cached 6 hours)
js/vendor/lenis.min.js  Lenis 1.3.27 smooth scrolling (MIT, see lenis.LICENSE.txt)
fonts/                Outfit, self-hosted (SIL Open Font License, see README.txt)
assets/               Icons, the link-preview image (og-image.png) and
                      assets/shots/ (app screenshots, 1000 and 2000 px wide)
_headers              Cloudflare Pages security and cache headers
site.webmanifest      Web app manifest
robots.txt
```

## Download links update themselves

`js/main.js` asks the GitHub API for the latest release of `jumakrk/FlixView`
and points each button at that release's `.exe`, `.dmg` and `.AppImage`, with
the version, file size and release date. Publishing a new GitHub release is
enough: the site does not need to change. If the API cannot be reached, the
buttons keep the direct v0.1.19 links written into the page.

The visitor's operating system is detected so the main button reads
"Download for Windows" (or macOS, or Linux) and the download area opens on
that system's tab.

## Artwork

The hero slideshow, poster wall and closing mosaic use this week's trending
titles from TMDB (`js/tmdb.js`). Without TMDB the page shows generated
gradient artwork instead. The app screenshots in `assets/shots/` are static;
re-capture them when the app's look changes.

## Deploying on Cloudflare Pages

1. Push this folder to a GitHub repository (as the repository root, or as a
   folder inside one).
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, and
   pick the repository.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** leave empty
   - **Build output directory:** `/` if this folder is the repository root,
     otherwise the folder's path (`website` in the FlixView repository)
   - **Build watch paths** (optional): include only `website/*`, so commits
     that only touch the app do not redeploy the site
4. Save and deploy. Every push to the production branch redeploys the site.

## Previewing locally

Any static server works, for example:

```
npx serve .
```

Open the address it prints. Opening `index.html` straight from disk also
works, but root-relative paths (`/css/...`) need a server.

## Legal pages

`privacy.html` and `terms.html` were approved on 18 November 2026 (the
"Last updated" date on each page). Contact requests currently go to GitHub
Issues; add a contact email address there if you set one up. When either page
changes, update its "Last updated" date.
