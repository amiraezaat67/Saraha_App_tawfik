import nodeMailer from "nodemailer";
import { EventEmitter } from "node:events";

export const emitter = new EventEmitter();

const sendEmail = async ({ to, subject, content, attachments = [] }) => {
  const transport = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTHOR_EMAIL,
      pass: process.env.AUTHOR_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transport.sendMail({
    from: process.env.AUTHOR_EMAIL,
    to,
    subject,
    html: content,
    attachments,
  });
};

emitter.on("sendEmail", (arg) => {
  sendEmail(arg);
});
