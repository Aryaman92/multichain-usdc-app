import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

const faucetRequestSchema = new mongoose.Schema({
  address: { type: String, required: true, lowercase: true, index: true },
  chainId: { type: Number, required: true },
  requestedAt: { type: Date, default: Date.now },
});
faucetRequestSchema.index({ address: 1, chainId: 1 });

const FaucetRequest =
  mongoose.models.FaucetRequest || mongoose.model("FaucetRequest", faucetRequestSchema);

const RATE_LIMIT_MS = 60 * 60 * 1000; // one request per address+chain per hour

// This does not call Circle's faucet directly (that requires a dev account
// and API key you should hold yourself, per the task's own rules). It only
// enforces our own rate limit and tells the client whether it's clear to
// send the user to faucet.circle.com.
router.post("/check", async (req, res) => {
  try {
    const { address, chainId } = req.body;
    if (!address || !chainId) {
      return res.status(400).json({ error: "address and chainId are required" });
    }

    const last = await FaucetRequest.findOne({
      address: address.toLowerCase(),
      chainId,
    }).sort({ requestedAt: -1 });

    if (last && Date.now() - last.requestedAt.getTime() < RATE_LIMIT_MS) {
      const retryAt = new Date(last.requestedAt.getTime() + RATE_LIMIT_MS);
      return res.status(429).json({
        allowed: false,
        retryAt,
        message: "You've already requested funds on this network recently.",
      });
    }

    await FaucetRequest.create({ address: address.toLowerCase(), chainId });
    res.json({ allowed: true, faucetUrl: "https://faucet.circle.com/" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
