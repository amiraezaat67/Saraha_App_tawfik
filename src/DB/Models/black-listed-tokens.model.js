import mongoose from "mongoose";

const blackListTokenSchema = mongoose.Schema({
  tokenId: { type: String, required: true }, // add unique index here for more security
  expirationDate: {
    type: Date,
    required: true,
  }
});

export const blackListTokens = mongoose.model("Black listed token", blackListTokenSchema);
