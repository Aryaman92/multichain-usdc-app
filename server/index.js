import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";

import authRoutes from "./routes/auth.js";
import faucetRoutes from "./routes/faucet.js";
import transactionRoutes from "./routes/transactions.js";
import bridgeRoutes from "./routes/bridges.js";
import reconciliationRoutes from "./routes/reconciliation.js";

const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const allowed =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      if (allowed) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/faucet", faucetRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/bridges", bridgeRoutes);
app.use("/api/reconciliation", reconciliationRoutes);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

connectDB().catch((err) => {
  console.error("MongoDB connection failed:", err.message);
});