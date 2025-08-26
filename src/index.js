import "./config.js";
import express from "express";
import { dbConnection } from "./DB/db.connection.js";
import { userRouter, authRouter, messagesRouter } from "./Modules/controllers.index.js";

const app = express();
dbConnection();

app.use(express.json());

app.use("/users", userRouter, authRouter);
app.use("/messages", messagesRouter);

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ msg: `Server Error`, error: err });
});

app.listen(process.env.PORT, () => {
  console.log(`Server connect at port ${process.env.PORT}`);
});
