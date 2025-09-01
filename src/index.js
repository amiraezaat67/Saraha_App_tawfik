import "./config.js";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cron from "node-cron";
import { dbConnection } from "./DB/db.connection.js";
import { userRouter, authRouter, messagesRouter } from "./Modules/controllers.index.js";
import { limit } from "./Middlewares/index.js";
import { blackListTokens, users } from "./DB/Models/index.js";

const app = express();
dbConnection();

const whitelist = process.env.WHITELIST;
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// cron.schedule("*/15 * * * *", async () => {
//   // check every 15 min if there are any otps that has been expired
//   await users.deleteMany({ "otps.expiration": { $lt: Date.now() } });
// });

cron.schedule("* */24 * * *", async () => {
  // check every 24 hours if there are any revoked token that has been expired
  await blackListTokens.deleteMany({ expirationDate: { $lt: Date.now() } });
});

app.use(express.json());
app.use(
  cors(corsOptions),
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "'unsafe-inline'"],
      },
    },
  }),
  limit
);

app.use("/users", userRouter, authRouter);
app.use("/messages", messagesRouter);

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

app.use((err, req, res, next) => {
  if (req.session?.inTransaction()) {
    req.session.abortTransaction();
    req.session.endSession();
    res.status(500).json({ msg: `transaction has aborted`, error: err });
  }
  res.status(500).json({ msg: `Server Error`, error: err });
});

app.listen(process.env.PORT, () => {
  console.log(`Server connect at port ${process.env.PORT}`);
});
