"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const notification_controller_1 = require("./notification.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, notification_controller_1.NotificationController.getNotifications);
router.get('/unread-count', auth_middleware_1.authenticate, notification_controller_1.NotificationController.getUnreadCount);
router.patch('/:id/read', auth_middleware_1.authenticate, notification_controller_1.NotificationController.markAsRead);
router.patch('/read-all', auth_middleware_1.authenticate, notification_controller_1.NotificationController.markAllAsRead);
router.delete('/:id', auth_middleware_1.authenticate, notification_controller_1.NotificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map