import mongoose from "mongoose";

const bridgeSchema = new mongoose.Schema(
  {
    wallet: {
      type: String,
      required: true,
      lowercase: true,
    },

    amount: {
      type: String,
      required: true,
    },

    token: {
      type: String,
      default: "USDC",
    },

    sourceChain: {
      type: String,
      required: true,
    },

    sourceChainId: {
      type: Number,
      required: true,
    },

    destinationChain: {
      type: String,
      required: true,
    },

    destinationChainId: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    sourceTxHash: {
      type: String,
      default: null,
    },

    destinationTxHash: {
      type: String,
      default: null,
    },

    steps: {
      type: Array,
      default: [],
    },

    reconciled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Bridge = mongoose.model("Bridge", bridgeSchema);