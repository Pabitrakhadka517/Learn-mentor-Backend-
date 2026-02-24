"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
describe('Bcrypt Test', () => {
    it('should hash', async () => {
        const hash = await bcrypt_1.default.hash('test', 10);
        expect(hash).toBeDefined();
    });
});
//# sourceMappingURL=bcrypt.test.js.map