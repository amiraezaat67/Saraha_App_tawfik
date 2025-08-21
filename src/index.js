import "./config.js";
import express from "express";
import { dbConnection } from "./DB/db.connection.js";
import userRouter from "./Modules/Users/users.controller.js";
import messagesRouter from "./Modules/Messages/messages.controller.js";

const app = express();
dbConnection();

app.use(express.json());
app.use("/users", userRouter);
app.use("/messages", messagesRouter);

app.use((err, req, res, next) => {
  res.status(500).json({ msg: `Server Error`, error: err });
});

app.listen(process.env.PORT, () => {
  console.log(`Server connect at port ${process.env.PORT}`);
});
