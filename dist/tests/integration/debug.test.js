"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../../src/app"));
describe('Debug Test with App', () => {
    it('should load app', async () => {
        expect(app_1.default).toBeDefined();
    });
});
//# sourceMappingURL=debug.test.js.map