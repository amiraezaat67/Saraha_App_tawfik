import mongoose from "mongoose";
import { genderEnum, providerEnum } from "../../common/Enums/user.enum.js";
import { type } from "node:os";

const usersSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: 10,
    },
    lastName: {
      type: String,
      required: true,
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: 10,
    },
    email: {
      type: String,
      required: true,
      index: { name: "idx_userEmail" },
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    gneder: {
      type: String,
      enum: Object.values(genderEnum),
      default: genderEnum.MALE,
    },
    profilePic: {
      type: String,
    },
    otps: {
      confirm: {
        type: String,
      },
      recovery: {
        type: String,
      },
      expiration: {
        type: Date,
      },
      attemptNumber: {
        type: Number,
      },
      lastEmailAttempt: {
        type: Date,
      },
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    googleSub: String,
    providers: {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.LOCAL,
    },
    devicesConnected: [
      {
        jti: { type: String },
        exp: { type: Date },
      },
    ],
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
