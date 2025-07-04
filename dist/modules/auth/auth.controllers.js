"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.resetPassword = exports.verifyForgotPasswordCode = exports.forgotPassword = exports.login = exports.resendVerifyCode = exports.verifyEmail = exports.register = void 0;
const appError_1 = require("@/utils/appError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_1 = __importDefault(require("http-status"));
const sendEmail_1 = __importDefault(require("@/utils/sendEmail"));
const emailTemplate_1 = require("@/templates/emailTemplate");
const prismaClient_1 = require("@/utils/prismaClient");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("@/config"));
const createCookie_1 = require("@/utils/createCookie");
const asyncHandler_1 = __importDefault(require("@/utils/asyncHandler"));
exports.register = (0, asyncHandler_1.default)(async (req, res, _next) => {
    const { name, email, password } = req.body;
    // check if user exists--
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (user) {
        throw new appError_1.AppError('User already exists', http_status_1.default.BAD_REQUEST);
    }
    // hash password--
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    // create verify token--
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyCodeExpire = new Date(Date.now() + 1 * 60 * 1000); // 1 min from now
    // Create new user
    const newUser = await prismaClient_1.prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            verifyCode: verificationCode,
            verifyCodeExpire,
        },
    });
    // send verification email--
    await (0, sendEmail_1.default)({
        reciverEmail: newUser.email,
        subject: 'Verify your email',
        body: (0, emailTemplate_1.verifyEmailTemplate)(verificationCode),
    });
    // send response to client--
    const { password: _password, verifyCode: _verifyCode, verifyCodeExpire: _verifyCodeExpire, forgotPasswordCode: _forgotPasswordCode, forgotPasswordCodeExpire: _forgotPasswordCodeExpire, ...userData } = newUser;
    res.status(http_status_1.default.CREATED).json({
        success: true,
        message: 'user registered successfully',
        data: userData,
    });
});
const verifyEmail = async (req, res) => {
    const { verificationCode } = req.body;
    // 1. Check if the verification code is valid and not expired
    const user = await prismaClient_1.prisma.user.findFirst({
        where: {
            verifyCode: verificationCode,
            verifyCodeExpire: {
                gt: new Date(),
            },
        },
    });
    // if not valid--
    if (!user) {
        throw new appError_1.AppError('Invalid code', http_status_1.default.BAD_REQUEST);
    }
    // 3. Update the user as verified and clear the verification fields
    await prismaClient_1.prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verifyCode: null,
            verifyCodeExpire: null,
        },
    });
    // send response to client--
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Email verified successfully',
    });
};
exports.verifyEmail = verifyEmail;
const resendVerifyCode = async (req, res) => {
    const { email } = req.body;
    // Check if user exists in the database
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new appError_1.AppError('User with this email does not exist!', http_status_1.default.NOT_FOUND);
    }
    if (user.isVerified) {
        throw new appError_1.AppError('Email is already verified!', http_status_1.default.BAD_REQUEST);
    }
    // Generate a new verification code
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newVerifyCodeExpire = new Date(Date.now() + 1 * 60 * 1000);
    // Update user with the new verification code and expiry time
    await prismaClient_1.prisma.user.update({
        where: { email },
        data: {
            verifyCode: newVerificationCode,
            verifyCodeExpire: newVerifyCodeExpire,
        },
    });
    // Send the verification email
    await (0, sendEmail_1.default)({
        reciverEmail: user.email,
        subject: 'Resend Verify Code',
        body: (0, emailTemplate_1.verifyEmailTemplate)(newVerificationCode),
    });
    // Respond to the client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Verification code has been resent. Please check your email.',
    });
};
exports.resendVerifyCode = resendVerifyCode;
const login = async (req, res) => {
    const { email, password } = req.body;
    // 1. Check if user exists
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new appError_1.AppError('Invalid credentials', http_status_1.default.BAD_REQUEST);
    }
    // compare the password--
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new appError_1.AppError('Invalid credentials', http_status_1.default.BAD_REQUEST);
    }
    if (!user.isVerified) {
        throw new appError_1.AppError('Please verify your email', http_status_1.default.UNAUTHORIZED);
    }
    // Send response to client (exclude password)
    const { password: _password, verifyCode: _verifyCode, verifyCodeExpire: _verifyCodeExpire, forgotPasswordCode: _forgotPasswordCode, forgotPasswordCodeExpire: _forgotPasswordCodeExpire, ...userData } = user;
    (0, createCookie_1.createCookie)(res, user);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'user logged in successfully',
        data: userData,
    });
};
exports.login = login;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    // 1. Check if user exists
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_1.default.BAD_REQUEST);
    }
    // 2. Generate code and expiry
    const forgotPasswordCode = Math.floor(100000 + Math.random() * 900000).toString();
    const forgotPasswordCodeExpire = new Date(Date.now() + 1 * 60 * 1000); // 1 mins
    // 3. Update user in DB
    await prismaClient_1.prisma.user.update({
        where: { email },
        data: {
            forgotPasswordCode,
            forgotPasswordCodeExpire,
        },
    });
    await (0, sendEmail_1.default)({
        reciverEmail: email,
        subject: 'Reset your password',
        body: (0, emailTemplate_1.forgotPasswordEmailTemplate)(forgotPasswordCode),
    });
    // 5. Respond to client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Password reset email sent successfully',
    });
};
exports.forgotPassword = forgotPassword;
const verifyForgotPasswordCode = async (req, res) => {
    const { email, forgotPasswordCode } = req.body;
    const user = await prismaClient_1.prisma.user.findFirst({
        where: {
            email,
            forgotPasswordCode,
            forgotPasswordCodeExpire: { gt: new Date() },
        },
    });
    if (!user) {
        throw new appError_1.AppError('Invalid code', http_status_1.default.BAD_REQUEST);
    }
    // Issue a short-lived reset token (expires in e.g., 10 mins)
    const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'RESET_PASSWORD' }, config_1.default.jwt_secret, {
        expiresIn: '10m',
    });
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Code verified successfully',
        meta: {
            resetToken,
        },
    });
};
exports.verifyForgotPasswordCode = verifyForgotPasswordCode;
const resetPassword = async (req, res) => {
    const { password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new appError_1.AppError('Reset token required', http_status_1.default.BAD_REQUEST);
    }
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, config_1.default.jwt_secret);
    }
    catch {
        throw new appError_1.AppError('Invalid token', http_status_1.default.BAD_REQUEST);
    }
    if (payload.type !== 'RESET_PASSWORD') {
        throw new appError_1.AppError('Invalid token', http_status_1.default.BAD_REQUEST);
    }
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { id: payload.userId },
    });
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_1.default.BAD_REQUEST);
    }
    // 2. Hash the new password
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(password, salt);
    await prismaClient_1.prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            forgotPasswordCode: null,
            forgotPasswordCodeExpire: null,
        },
    });
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Password reset successfully',
    });
};
exports.resetPassword = resetPassword;
const logout = async (_req, res) => {
    res.clearCookie('token');
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'user logged out successfully',
    });
};
exports.logout = logout;
