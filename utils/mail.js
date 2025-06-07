import { createTransport } from "nodemailer";

export const mailTransport = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS
    },
    from: "franciskojoamekeh@gmail.com"
});