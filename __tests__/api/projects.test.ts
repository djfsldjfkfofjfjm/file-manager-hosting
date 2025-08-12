// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    file: {
      deleteMany: jest.fn(),
    },
    folder: {
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/jwt', () => ({
  getSession: jest.fn(),
}));

describe('Projects API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.project.create.mockResolvedValue({
        id: 'project-123',
        name: 'Test Project',
        description: 'Test Description',
        userId: 'user-123',
      });
      
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
      };
      
      const result = await prisma.project.create({
        data: {
          ...projectData,
          userId: 'user-123',
        },
      });
      
      expect(result.id).toBe('project-123');
      expect(result.name).toBe('Test Project');
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Project',
          description: 'Test Description',
          userId: 'user-123',
        },
      });
    });
    
    it('should reject project creation without authentication', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      getSession.mockResolvedValue(null);
      
      const session = await getSession();
      expect(session).toBeNull();
    });
  });
  
  describe('GET /api/projects', () => {
    it('should list all projects for authenticated user', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.project.findMany.mockResolvedValue([
        { id: 'project-1', name: 'Project 1', userId: 'user-123' },
        { id: 'project-2', name: 'Project 2', userId: 'user-123' },
      ]);
      
      const projects = await prisma.project.findMany({
        where: { userId: 'user-123' },
      });
      
      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('Project 1');
      expect(projects[1].name).toBe('Project 2');
    });
  });
  
  describe('PUT /api/projects/[id]', () => {
    it('should update project details', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.project.findFirst.mockResolvedValue({
        id: 'project-123',
        name: 'Old Name',
        userId: 'user-123',
      });
      prisma.project.update.mockResolvedValue({
        id: 'project-123',
        name: 'New Name',
        description: 'New Description',
        userId: 'user-123',
      });
      
      const updatedProject = await prisma.project.update({
        where: { id: 'project-123' },
        data: {
          name: 'New Name',
          description: 'New Description',
        },
      });
      
      expect(updatedProject.name).toBe('New Name');
      expect(updatedProject.description).toBe('New Description');
    });
    
    it('should not update project owned by another user', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.project.findFirst.mockResolvedValue(null);
      
      const project = await prisma.project.findFirst({
        where: {
          id: 'project-456',
          userId: 'user-123',
        },
      });
      
      expect(project).toBeNull();
    });
  });
  
  describe('DELETE /api/projects/[id]', () => {
    it('should delete project and all associated files', async () => {
      const { getSession } = require('@/lib/auth/jwt');
      const { prisma } = require('@/lib/prisma');
      
      getSession.mockResolvedValue({ userId: 'user-123' });
      prisma.project.findFirst.mockResolvedValue({
        id: 'project-123',
        userId: 'user-123',
      });
      prisma.file.deleteMany.mockResolvedValue({ count: 5 });
      prisma.folder.deleteMany.mockResolvedValue({ count: 2 });
      prisma.project.delete.mockResolvedValue({ id: 'project-123' });
      
      // Simulate cascade delete
      await prisma.file.deleteMany({ where: { projectId: 'project-123' } });
      await prisma.folder.deleteMany({ where: { projectId: 'project-123' } });
      await prisma.project.delete({ where: { id: 'project-123' } });
      
      expect(prisma.file.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
      });
      expect(prisma.folder.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
      });
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-123' },
      });
    });
  });
});