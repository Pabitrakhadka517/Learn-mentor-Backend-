"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const auth_seeding_1 = require("./modules/auth/auth.seeding");
const http_1 = __importDefault(require("http"));
const socket_1 = require("./socket");
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
(async () => {
    try {
        await (0, db_1.default)();
        await (0, auth_seeding_1.seedAdmin)();
        const server = http_1.default.createServer(app_1.default);
        (0, socket_1.initSocket)(server);
        server.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}/swagger/`);
            console.log(`📡 Socket.io Service Ready`);
        });
    }
    catch (err) {
        console.error("❌ Startup error:", err);
        process.exit(1);
    }
})();
//# sourceMappingURL=server.js.map