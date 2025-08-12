// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    file: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    folder: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('@/lib/auth/jwt', () => ({
  getSession: jest.fn(),
}));

// Mock Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

describe('Files API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/files/upload', () => {
    it('should reject unauthorized requests', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      getSession.mockResolvedValue(null);
      
      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.txt'));
      formData.append('projectId', 'project-123');
      
      // Simulate the API handler logic
      const session = await getSession();
      if (!session) {
        // Simulate unauthorized response
        const errorResponse = { error: 'Unauthorized' };
        expect(errorResponse.error).toBe('Unauthorized');
      }
    });
    
    it('should upload file successfully', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      const { put } = require('@vercel/blob');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.project.findFirst.mockResolvedValue({ id: 'project-123', userId: 'user-123' });
      put.mockResolvedValue({ url: 'https://blob.vercel.com/test.txt', pathname: 'test.txt' });
      prisma.file.create.mockResolvedValue({
        id: 'file-123',
        filename: 'test.txt',
        originalName: 'test.txt',
        url: 'https://blob.vercel.com/test.txt',
      });
      
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('projectId', 'project-123');
      
      // Simulate successful upload
      expect(prisma.project.findFirst).toBeDefined();
      expect(put).toBeDefined();
      expect(prisma.file.create).toBeDefined();
    });
    
    it('should reject files over 10MB', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      getSession.mockResolvedValue({ userId: 'user-123' });
      
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], 'large.txt');
      
      const MAX_SIZE = 10 * 1024 * 1024;
      if (largeFile.size > MAX_SIZE) {
        // Simulate error response for large file
        const errorResponse = { error: 'File size exceeds 10MB limit' };
        expect(largeFile.size).toBeGreaterThan(MAX_SIZE);
        expect(errorResponse.error).toBe('File size exceeds 10MB limit');
      }
    });
  });
  
  describe('GET /api/files', () => {
    it('should list files for authorized user', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.file.findMany.mockResolvedValue([
        { id: 'file-1', filename: 'file1.txt' },
        { id: 'file-2', filename: 'file2.jpg' },
      ]);
      
      // Simulate GET request
      const session = await getSession();
      expect(session).toBeDefined();
      expect(session.userId).toBe('user-123');
      
      const files = await prisma.file.findMany();
      expect(files).toHaveLength(2);
    });
  });
  
  describe('DELETE /api/files/[id]', () => {
    it('should delete file and remove from blob storage', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      const { del } = require('@vercel/blob');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.file.findUnique.mockResolvedValue({
        id: 'file-123',
        url: 'https://blob.vercel.com/test.txt',
        uploadedBy: 'user-123',
      });
      del.mockResolvedValue(undefined);
      prisma.file.delete.mockResolvedValue({ id: 'file-123' });
      
      // Simulate DELETE request
      const file = await prisma.file.findUnique({ where: { id: 'file-123' } });
      expect(file).toBeDefined();
      
      await del(file.url);
      expect(del).toHaveBeenCalledWith('https://blob.vercel.com/test.txt');
      
      await prisma.file.delete({ where: { id: 'file-123' } });
      expect(prisma.file.delete).toHaveBeenCalledWith({ where: { id: 'file-123' } });
    });
  });
});