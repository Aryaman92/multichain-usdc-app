import { Router } from "express";
import { Bridge } from "../models/Bridge.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const {
      wallet,
      amount,
      token = "USDC",
      sourceChain,
      sourceChainId,
      destinationChain,
      destinationChainId,
      status = "pending",
    } = req.body;

    if (
      !wallet ||
      !amount ||
      !sourceChain ||
      !sourceChainId ||
      !destinationChain ||
      !destinationChainId
    ) {
      return res.status(400).json({
        error: "Missing bridge fields.",
      });
    }

    const bridge = await Bridge.create({
      wallet: wallet.toLowerCase(),
      amount,
      token,
      sourceChain,
      sourceChainId,
      destinationChain,
      destinationChainId,
      status,
    });

    res.json({ bridge });
  } catch (err) {
    console.error("Bridge save failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const {
      status,
      sourceTxHash,
      destinationTxHash,
      steps,
      reconciled,
    } = req.body;

    const bridge = await Bridge.findByIdAndUpdate(
      req.params.id,
      {
        ...(status !== undefined && { status }),
        ...(sourceTxHash !== undefined && { sourceTxHash }),
        ...(destinationTxHash !== undefined && { destinationTxHash }),
        ...(steps !== undefined && { steps }),
        ...(reconciled !== undefined && { reconciled }),
      },
      {
        new: true,
      }
    );

    if (!bridge) {
      return res.status(404).json({
        error: "Bridge record not found.",
      });
    }

    res.json({ bridge });
  } catch (err) {
    console.error("Bridge update failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/:wallet", async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();

    const bridges = await Bridge.find({
      wallet,
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ bridges });
  } catch (err) {
    console.error("Bridge fetch failed:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;