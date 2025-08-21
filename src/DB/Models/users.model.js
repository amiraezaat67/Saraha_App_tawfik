import mongoose from "mongoose";

const usersSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: 10,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: 10,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      index: { name: "idx_userEmail" },
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    gneder: {
      type: String,
      enum: ["male", "female"],
      default: "male",
    },
    otps: {
      confirm: {
        type: String,
      },
      recovery: {
        type: String,
      },
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    method: {
      getFullName() {
        return this.firstName + this.lastName;
      },
    },
    virtuals: {
      fullName: {
        get() {
          return this.firstName + " " + this.lastName;
        },
      },
    },
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    id: false,
  }
);

export const users = mongoose.model("users", usersSchema);
