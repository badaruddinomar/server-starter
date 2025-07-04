"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("@/middlewares/auth");
const user_controllers_1 = require("@/modules/user/user.controllers");
const validator_1 = __importDefault(require("@/middlewares/validator"));
const user_dto_1 = require("@/modules/user/user.dto");
const router = express_1.default.Router();
router.get('/profile', auth_1.authMiddleware, user_controllers_1.getUserProfile);
router.get('/list', auth_1.authMiddleware, (0, auth_1.authorizeRoles)('ADMIN'), user_controllers_1.getAllUsers);
router.patch('/update', auth_1.authMiddleware, (0, validator_1.default)(user_dto_1.updateUserProfileSchema), user_controllers_1.updateUserProfile);
router.delete('/delete/:id', auth_1.authMiddleware, (0, auth_1.authorizeRoles)('ADMIN'), user_controllers_1.deleteUser);
router.patch('/change-password', auth_1.authMiddleware, (0, validator_1.default)(user_dto_1.changePasswordSchema), user_controllers_1.changePassword);
exports.default = router;
