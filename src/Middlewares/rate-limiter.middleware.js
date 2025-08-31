import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import MongoStore from "rate-limit-mongo";

export const limit = rateLimit({
  windowMs: 5 * 60 * 1000, // open window for 5 min
  max: function (req) {
    if (req.path == "/users/confirm" || req.path == "/users/Reset-Password") return 15;
    if (req.path == "/users/update-password") return 10;
    return 100;
  },
  requestPropertyName: "rate_limit",
  handler: function (req, res) {
    res.status(429).json({ msg: `Too many requests from this IP, please try again after ${this.windowMs / (60 * 1000)} minutes` });
  },
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip);
    return `ip:${ip}_${req.path}`;
  },
  store: new MongoStore({
    uri: process.env.DATABASE_URL,
    collectionName: "rateLimiter",
    expireTimeMs: 5 * 60 * 1000,
  }),
});
