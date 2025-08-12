module.exports = {
  SignJWT: class SignJWT {
    constructor(payload) {
      this.payload = payload;
    }
    setProtectedHeader() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return 'mocked-jwt-token';
    }
  },
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { userId: 'test-user-id' },
  }),
};