# Verdant Ledger

Verdant Ledger is a Node.js/Express website for connecting businesses with ESG
and sustainability professionals. Contact-form inquiries are validated by the
server and stored as documents in MongoDB.

The homepage includes a supplied Spider-Man illustration suspended on a web.
The character gently swings and blinks while the page is open, and follows the
visitor's scroll position on an extending web; these animations are disabled
when reduced motion is requested.

## Requirements

- Node.js 20 or newer
- MongoDB 6 or newer, locally or through MongoDB Atlas

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your local or Atlas
   connection string and optionally set `MONGODB_DB` (defaults to
   `verdant_ledger`). Do not commit `.env`.

   For a local MongoDB server, the example connection string is
   `mongodb://127.0.0.1:27017`.

3. Start the app:

   ```sh
   npm start
   ```

4. Open <http://localhost:3000>. Submitting the contact form sends a validated
   document to the `inquiries` collection in the selected database.

The server creates a descending `createdAt` index for recent inquiry lookups.
Each inquiry document contains `name`, `email`, `company`, `requestType`,
`message`, and `createdAt`.

## Run checks

```sh
npm test
npm audit --omit=dev
```

The Express server serves the website, frontend assets, and the public hanging
Spider-Man cutout. Backend source and environment files are not exposed.

## Deploy to Vercel

1. Push this project to a Git provider and import the repository into Vercel.
   Vercel serves the site files from the project root and deploys
   `api/[...path].js` as a serverless function for the inquiry API.
2. Create a MongoDB Atlas database and configure its network access to allow
   connections from your Vercel deployment.
3. In the Vercel project settings, add `MONGODB_URI` with the Atlas connection
   string. Add `MONGODB_DB` if you want a database name other than
   `verdant_ledger`. Set these variables for each environment you deploy
   (Production, Preview, and Development, as applicable).
4. Redeploy after setting the environment variables. The homepage is served
   as static content, while `POST /api/inquiries` uses the Vercel function and
   stores validated submissions in MongoDB.

The MongoDB connection and Express app are reused across warm function
invocations. The local `npm start` workflow remains available for development.
