"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultipleImages = exports.uploadMultipleImages = exports.deleteSingleImage = exports.uploadSingleImage = void 0;
const cloudinary_1 = __importDefault(require("@/config/cloudinary"));
const uploadSingleImage = async (image, // req.files?.image as UploadedFile
folderName) => {
    try {
        const result = await cloudinary_1.default.uploader.upload(image.tempFilePath, {
            folder: folderName,
        });
        return {
            url: result.secure_url,
            public_id: result.public_id.split('/')[1],
        };
    }
    catch (err) {
        throw err;
    }
};
exports.uploadSingleImage = uploadSingleImage;
const deleteSingleImage = async (publicId) => {
    try {
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (err) {
        throw err;
    }
};
exports.deleteSingleImage = deleteSingleImage;
const uploadMultipleImages = async (images, // req.files?.images as UploadedFile[]
folderName) => {
    try {
        const results = await Promise.all(images.map(async (image) => {
            const result = await cloudinary_1.default.uploader.upload(image.tempFilePath, {
                folder: folderName,
            });
            return {
                url: result.secure_url,
                public_id: result.public_id.split('/')[1],
            };
        }));
        return results;
    }
    catch (err) {
        throw err;
    }
};
exports.uploadMultipleImages = uploadMultipleImages;
const deleteMultipleImages = async (publicIds) => {
    try {
        await cloudinary_1.default.api.delete_resources(publicIds);
    }
    catch (err) {
        throw err;
    }
};
exports.deleteMultipleImages = deleteMultipleImages;
