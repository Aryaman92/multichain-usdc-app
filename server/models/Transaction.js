import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    hash: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    sender: {
      type: String,
      required: true,
      lowercase: true,
    },

    recipient: {
      type: String,
      required: true,
      lowercase: true,
    },

    amount: {
      type: String,
      required: true,
    },

    chainId: {
      type: Number,
      required: true,
    },

    symbol: {
      type: String,
      default: "USDC",
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    verifiedOnChain: {
      type: Boolean,
      default: false,
    },

    blockNumber: {
      type: String,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);