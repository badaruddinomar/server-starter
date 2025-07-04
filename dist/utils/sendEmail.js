"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("@/config"));
const sendEmail = async (options) => {
    const transporter = nodemailer_1.default.createTransport({
        // host: config.smtp_host,
        // port: config.smtp_port,
        service: config_1.default.smtp_service,
        auth: {
            user: config_1.default.smtp_mail,
            pass: config_1.default.smtp_password,
        },
    });
    const mailOptions = {
        from: config_1.default.smtp_mail,
        to: options.reciverEmail,
        subject: options.subject,
        html: options.body,
    };
    await transporter.sendMail(mailOptions);
};
exports.default = sendEmail;
