import { MongoClient } from "mongodb";
import { createApp } from "../server.js";

let appPromise;

function getApp() {
  if (!appPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing required environment variable: MONGODB_URI");
    }

    const client = new MongoClient(uri);
    appPromise = client.connect()
      .then(async () => {
        const database = client.db(process.env.MONGODB_DB || "verdant_ledger");
        const inquiries = database.collection("inquiries");
        await inquiries.createIndex({ createdAt: -1 });
        return createApp(inquiries);
      })
      .catch(async (error) => {
        appPromise = undefined;
        try {
          await client.close();
        } catch (closeError) {
          console.error("Could not close the MongoDB connection cleanly.", closeError);
        }
        throw error;
      });
  }

  return appPromise;
}

export default async function handler(request, response) {
  try {
    const app = await getApp();
    app(request, response);
  } catch (error) {
    console.error("Could not initialize the Vercel API function.", error);
    response.status(500).json({
      message: "The request could not be completed. Please try again later.",
    });
  }
}
