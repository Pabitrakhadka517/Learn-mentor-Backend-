"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadChatAttachments = exports.uploadChatAttachment = void 0;
const multer_1 = __importDefault(require("multer"));
const fileFilter = (req, file, cb) => {
    const allowedMimetypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain'
    ];
    if (allowedMimetypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('This file type is not supported in the Chat at this moment!'));
    }
};
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
});
exports.uploadChatAttachment = upload.single('file');
exports.uploadChatAttachments = upload.array('files', 5);
//# sourceMappingURL=chat.middleware.js.map