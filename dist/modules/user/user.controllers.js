"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteUser = exports.updateUserProfile = exports.getAllUsers = exports.getUserProfile = void 0;
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("@/utils/appError");
const prismaClient_1 = require("@/utils/prismaClient");
const cloudinaryImageUpload_1 = require("@/utils/cloudinaryImageUpload");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUserProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new appError_1.AppError('User not authenticated', http_status_1.default.UNAUTHORIZED);
    }
    const user = await prismaClient_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            role: true,
            avatarUrl: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_1.default.NOT_FOUND);
    }
    // Send response to client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: user,
    });
};
exports.getUserProfile = getUserProfile;
const getAllUsers = async (req, res) => {
    const { search, page, limit } = req.query;
    const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
    const limitNumber = parseInt(limit) > 0 ? parseInt(limit) : 10;
    const skip = (pageNumber - 1) * limitNumber;
    const searchText = search;
    const searchFilter = {
        isVerified: true,
        ...(searchText && {
            OR: [
                { name: { contains: searchText.trim(), mode: 'insensitive' } },
                { email: { contains: searchText.trim(), mode: 'insensitive' } },
            ],
        }),
    };
    // Get all users
    const users = await prismaClient_1.prisma.user.findMany({
        where: searchFilter,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            role: true,
            avatarUrl: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    const totalUsers = await prismaClient_1.prisma.user.count({
        where: {
            isVerified: true,
        },
    });
    // Send response to client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        meta: {
            totalUsers,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(totalUsers / limitNumber),
        },
    });
};
exports.getAllUsers = getAllUsers;
const updateUserProfile = async (req, res) => {
    const userId = req.user?.id;
    const { name, phone, address } = req.body;
    const avatar = req.files?.avatar;
    const user = await prismaClient_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_1.default.NOT_FOUND);
    }
    let avatarObj = {
        url: user.avatarUrl || '',
        public_id: user.avatarUrlId || '',
    };
    // check is avatar exists--
    if (avatar) {
        // check avatar is more than one--
        if (Array.isArray(avatar)) {
            throw new appError_1.AppError('Only one image can be uploaded for avatar', http_status_1.default.BAD_REQUEST);
        }
        // check avatar file type is valid---
        const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validImageTypes.includes(avatar.mimetype)) {
            throw new appError_1.AppError('Invalid image type, image must be jpeg, png or webp', http_status_1.default.BAD_REQUEST);
        }
        // check avatar file size--
        const MAX_SIZE = 2 * 1024 * 1024;
        if (avatar.size > MAX_SIZE) {
            throw new appError_1.AppError('Image size must be less than 2MB', http_status_1.default.BAD_REQUEST);
        }
        // Delete old avatar
        if (user.avatarUrlId) {
            await (0, cloudinaryImageUpload_1.deleteSingleImage)(user.avatarUrlId);
        }
        // upload new avatar--
        avatarObj = await (0, cloudinaryImageUpload_1.uploadSingleImage)(avatar, 'tohori_avatars');
    }
    const updatedUser = await prismaClient_1.prisma.user.update({
        where: { id: userId },
        data: {
            name,
            phone,
            address,
            avatarUrl: avatarObj?.url,
            avatarUrlId: avatarObj?.public_id,
        },
    });
    const { password: _password, ...userData } = updatedUser;
    // Send response to client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'User profile updated successfully',
        data: userData,
    });
};
exports.updateUserProfile = updateUserProfile;
const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const user = await prismaClient_1.prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_1.default.NOT_FOUND);
    }
    if (user.avatarUrlId) {
        await (0, cloudinaryImageUpload_1.deleteSingleImage)(user.avatarUrlId);
    }
    await prismaClient_1.prisma.user.delete({ where: { id: Number(userId) } });
    // Send response to client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'User deleted successfully',
    });
};
exports.deleteUser = deleteUser;
const changePassword = async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    const user = await prismaClient_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new appError_1.AppError('User not found', http_status_1.default.NOT_FOUND);
    }
    const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new appError_1.AppError('Current password is incorrect', http_status_1.default.BAD_REQUEST);
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
    await prismaClient_1.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });
    // Send response to client
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'Password changed successfully',
    });
};
exports.changePassword = changePassword;
