"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const user_model_1 = require("../auth/user.model");
class AdminRepository {
    static async getAllUsers() {
        return await user_model_1.User.find({}).sort({ createdAt: -1 });
    }
    static async getUserStats() {
        const total = await user_model_1.User.countDocuments();
        const tutors = await user_model_1.User.countDocuments({ role: "tutor" });
        const students = await user_model_1.User.countDocuments({ role: "user" });
        const admins = await user_model_1.User.countDocuments({ role: "admin" });
        return { total, tutors, students, admins };
    }
}
exports.AdminRepository = AdminRepository;
//# sourceMappingURL=admin.repository.js.map