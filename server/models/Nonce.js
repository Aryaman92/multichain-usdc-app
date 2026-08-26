import mongoose from "mongoose";

const nonceSchema = new mongoose.Schema({
  address: { type: String, required: true, lowercase: true, index: true },
  nonce: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-expire after 5 minutes
});

export const Nonce = mongoose.model("Nonce", nonceSchema);
