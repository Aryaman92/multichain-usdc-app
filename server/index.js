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
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const isLocal =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      const isProductionFrontend =
        origin === CLIENT_ORIGIN;

      if (isLocal || isProductionFrontend) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/faucet", faucetRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/bridges", bridgeRoutes);
app.use("/api/reconciliation", reconciliationRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });