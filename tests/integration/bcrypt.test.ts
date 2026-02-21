import bcrypt from 'bcrypt';
describe('Bcrypt Test', () => {
    it('should hash', async () => {
        const hash = await bcrypt.hash('test', 10);
        expect(hash).toBeDefined();
    });
});
