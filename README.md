# Verdant Ledger

Verdant Ledger is a Node.js/Express website for connecting businesses with ESG
and sustainability professionals. Visitors can contact the team by email.

The homepage includes a supplied Spider-Man illustration suspended on a web.
The character gently swings and blinks while the page is open, and follows the
visitor's scroll position on an extending web; these animations are disabled
when reduced motion is requested.

## Requirements

- Node.js 20 or newer

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Start the app:

   ```sh
   npm start
   ```

3. Open <http://localhost:3000>. Contact links open an email to
   `hello@verdantledger.com`.

## Run checks

```sh
npm test
npm audit --omit=dev
```

The Express server serves the website and its frontend assets. No database or
server-side inquiry endpoint is required.

## Deploy to Vercel

1. Push this project to a Git provider and import it into Vercel.
2. Deploy the project root as a static site. The website has no serverless API
   or database configuration.
