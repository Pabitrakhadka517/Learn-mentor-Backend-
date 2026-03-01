"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const chat_middleware_1 = require("./chat.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.delete('/:id', chat_controller_1.ChatController.deleteChat);
router.get('/', chat_controller_1.ChatController.getChats);
router.post('/', chat_controller_1.ChatController.createChat);
router.post('/:id/messages', chat_middleware_1.uploadChatAttachment, chat_controller_1.ChatController.sendMessage);
router.get('/:id/messages', chat_controller_1.ChatController.getMessages);
router.patch('/messages/:messageId', auth_middleware_1.authenticate, chat_controller_1.ChatController.editMessage);
router.delete('/messages/:messageId', auth_middleware_1.authenticate, chat_controller_1.ChatController.deleteMessage);
router.post('/:id/read', chat_controller_1.ChatController.markRead);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map