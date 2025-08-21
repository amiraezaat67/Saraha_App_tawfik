import { Router } from "express";
import * as services from "./Services/users.service.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import * as validators from "../../Validators/Schemas/user.schema.js";

const userRouter = Router();

userRouter.post("/register", validationMiddleware(validators.registerationSchema), services.registerServices);
userRouter.post("/login", validationMiddleware(validators.loginSchema), services.loginService);
userRouter.post("/logout", authenticationMiddleware, services.logoutService);
userRouter.post("/forget-Password", validationMiddleware(validators.forgetPasswordSchema), services.forgetPasswordService);
userRouter.post("/refresh-token", services.refreshTokenServices);

userRouter.patch("/confirm", validationMiddleware(validators.confirmSchema), services.confirmService);
userRouter.patch("/Reset-Password", authenticationMiddleware, validationMiddleware(validators.resetPasswordSchema), services.resetPasswordService);
userRouter.patch("/update-password", authenticationMiddleware, validationMiddleware(validators.updatePassword), services.updatePasswordServices);
userRouter.patch("/message-privacy/:messageId", authenticationMiddleware, validationMiddleware(validators.messgaeStatusSchema), services.messagePrivacyService);

userRouter.put("/update", authenticationMiddleware, validationMiddleware(validators.updateSchemaSchema), services.updateService);

userRouter.delete("/delete-user", authenticationMiddleware, services.deleteService);
userRouter.delete("/delete-message/:messageId", authenticationMiddleware, services.deleteMessageService);

userRouter.get("/list-users", services.listUsersServices);
userRouter.get("/user-data/:id", validationMiddleware(validators.profileDataSchema), services.getProfileDataServices);
userRouter.get("/user-messages", authenticationMiddleware, services.getUserMessagesService);

export default userRouter;

/**
 * delete 

 */
