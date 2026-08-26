import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, unique: true, lowercase: true, index: true },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
