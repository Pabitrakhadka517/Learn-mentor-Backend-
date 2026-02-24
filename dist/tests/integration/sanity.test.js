"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
describe('Sanity Check', () => {
    it('should respond with 200 to health check', async () => {
        const response = await (0, supertest_1.default)(app_1.default).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Server is healthy');
    });
});
//# sourceMappingURL=sanity.test.js.map