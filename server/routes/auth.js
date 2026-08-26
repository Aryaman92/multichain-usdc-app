import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { verifyMessage } from "viem";
import { Nonce } from "../models/Nonce.js";
import { User } from "../models/User.js";

const router = Router();

const SESSION_SECRET = process.env.SESSION_SECRET;
const COOKIE_NAME = "session";
const isProd = process.env.NODE_ENV === "production";

function requireSecret() {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not set.");
  }
}

router.post("/nonce", async (req, res) => {
  try {
    requireSecret();

    const { address } = req.body;

    if (!address || typeof address !== "string") {
      return res.status(400).json({
        error: "address is required",
      });
    }

    const nonce = crypto.randomBytes(16).toString("hex");

    const message =
      `Sign in to the ARM app.\n\n` +
      `Address: ${address}\n` +
      `Nonce: ${nonce}`;

    await Nonce.create({
      address: address.toLowerCase(),
      nonce,
      message,
    });

    res.json({ message });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.post("/verify", async (req, res) => {
  try {
    requireSecret();

    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({
        error: "address and signature are required",
      });
    }

    const record = await Nonce.findOne({
      address: address.toLowerCase(),
    }).sort({
      createdAt: -1,
    });

    if (!record) {
      return res.status(400).json({
        error: "No pending nonce for this address. Request a new one.",
      });
    }

    const isValid = await verifyMessage({
      address,
      message: record.message,
      signature,
    });

    if (!isValid) {
      return res.status(401).json({
        error: "Signature did not verify.",
      });
    }

    await Nonce.deleteOne({
      _id: record._id,
    });

    let user = await User.findOne({
      address: address.toLowerCase(),
    });

    if (!user) {
      user = await User.create({
        address: address.toLowerCase(),
        role: "user",
      });
    }

    const token = jwt.sign(
      {
        address: user.address,
        role: user.role,
      },
      SESSION_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/session", (req, res) => {
  try {
    requireSecret();

    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({
        user: null,
      });
    }

    const payload = jwt.verify(
      token,
      SESSION_SECRET
    );

    res.json({
      user: {
        address: payload.address,
        role: payload.role,
      },
    });
  } catch {
    res.status(401).json({
      user: null,
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });

  res.json({
    ok: true,
  });
});

export default router;