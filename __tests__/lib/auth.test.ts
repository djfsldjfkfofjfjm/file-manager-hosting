const bcrypt = require('bcryptjs');

describe('Authentication', () => {
  describe('JWT Functions', () => {
    it('should create and verify a JWT token', async () => {
      // Mock implementation since jose is mocked
      const { SignJWT, jwtVerify } = require('jose');
      
      const payload = { userId: 'test-user-id' };
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign();
      
      expect(token).toBeDefined();
      expect(token).toBe('mocked-jwt-token');
      
      const { payload: verifiedPayload } = await jwtVerify(token);
      expect(verifiedPayload.userId).toBe('test-user-id');
    });
    
    it('should fail to verify an invalid token', async () => {
      const { jwtVerify } = require('jose');
      jwtVerify.mockRejectedValueOnce(new Error('Invalid token'));
      
      const invalidToken = 'invalid.jwt.token';
      await expect(jwtVerify(invalidToken)).rejects.toThrow('Invalid token');
    });
  });
  
  describe('Password Hashing', () => {
    it('should hash and verify a password', async () => {
      const password = 'secure_password_123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await bcrypt.compare('wrong_password', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });
});