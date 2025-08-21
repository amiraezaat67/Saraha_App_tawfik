import mongoose from "mongoose";

const messagesSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      enmu: ["public", "private"],
      default: "private",
    },
  },
  {
    timestamps: true,
  }
);

export const messages = mongoose.model("messages", messagesSchema);
