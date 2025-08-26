import { Router } from "express";
import { validationMiddleware } from "../../Middlewares/index.js";
import * as services from "./Services/messages.service.js";
import { sendMessageSchema } from "../../Validators/Schemas/index.js";

const messagesRouter = Router();

messagesRouter.post("/send-message/:receiverId", validationMiddleware(sendMessageSchema), services.sendMessageServices);

messagesRouter.get("/user-public-messages/:userId", services.publicMessagesService);

export { messagesRouter };
