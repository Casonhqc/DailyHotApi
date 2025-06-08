import { Hono } from "hono";
import { handle } from "hono/vercel";
import app from "../src/app.js";

// Export the Hono app for Vercel
export default handle(app);
