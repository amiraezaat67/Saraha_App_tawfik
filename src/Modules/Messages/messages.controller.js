import { Router } from "express";
import * as services from "./Services/messages.service.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import * as validators from "../../Validators/Schemas/message.schema.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";

const messagesRouter = Router();

messagesRouter.post("/send-message/:receiverId", validationMiddleware(validators.sendMessageSchema), services.sendMessageServices);

messagesRouter.get("/user-public-messages/:userId", services.publicMessagesService);

export default messagesRouter;
