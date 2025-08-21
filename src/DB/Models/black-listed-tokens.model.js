import mongoose from "mongoose";

const blackListTokenSchema = mongoose.Schema({
  tokenId: { type: String, required: true },
  expirationDate: { type: Date, required: true, index: { name: "idx_expireDate", expireAfterSeconds: 0 } },
});

export const blackListTokens = mongoose.model("Black listed token", blackListTokenSchema);
