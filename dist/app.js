"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "LearnMentor API",
            version: "1.0.0",
            description: "API documentation for LearnMentor backend"
        },
        servers: [{ url: "http://localhost:4000" }]
    },
    apis: ["./src/modules/**/*.ts"]
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use("/swagger", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
app.use("/api/auth", auth_routes_1.default);
app.get("/", (_req, res) => {
    res.send('<h1>Server running 🚀 <a href="/swagger">Swagger Docs</a></h1>');
});
exports.default = app;
//# sourceMappingURL=app.js.map