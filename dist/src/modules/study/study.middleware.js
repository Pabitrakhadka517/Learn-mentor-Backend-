"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadStudyResource = void 0;
const multer_1 = __importDefault(require("multer"));
const fileFilter = (req, file, cb) => {
    const allowedMimetypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (allowedMimetypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('This file type is not supported in the Library yet!'));
    }
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024
    },
    fileFilter: fileFilter
});
exports.uploadStudyResource = upload.single('resource');
//# sourceMappingURL=study.middleware.js.map