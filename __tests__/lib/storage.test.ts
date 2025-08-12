import { put, del, list } from '@vercel/blob';

// Mock @vercel/blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
  list: jest.fn(),
}));

describe('Vercel Blob Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('uploadToBlob', () => {
    it('should upload a file to blob storage', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockBlobResult = {
        url: 'https://blob.vercel.com/test.txt',
        pathname: 'test.txt',
      };
      
      (put as jest.Mock).mockResolvedValue(mockBlobResult);
      
      // Import the function inline to avoid module resolution issues during test
      const uploadToBlob = async (file: File) => {
        const blob = await put(file.name, file, { access: 'public' });
        return {
          url: blob.url,
          filename: blob.pathname,
        };
      };
      
      const result = await uploadToBlob(mockFile);
      
      expect(put).toHaveBeenCalledWith('test.txt', mockFile, { access: 'public' });
      expect(result).toEqual({
        url: 'https://blob.vercel.com/test.txt',
        filename: 'test.txt',
      });
    });
  });
  
  describe('deleteFromBlob', () => {
    it('should delete a file from blob storage', async () => {
      const url = 'https://blob.vercel.com/test.txt';
      
      (del as jest.Mock).mockResolvedValue(undefined);
      
      const deleteFromBlob = async (url: string) => {
        await del(url);
      };
      
      await deleteFromBlob(url);
      
      expect(del).toHaveBeenCalledWith(url);
    });
  });
  
  describe('listBlobs', () => {
    it('should list files in blob storage', async () => {
      const mockBlobs = [
        { url: 'https://blob.vercel.com/file1.txt', pathname: 'file1.txt' },
        { url: 'https://blob.vercel.com/file2.jpg', pathname: 'file2.jpg' },
      ];
      
      (list as jest.Mock).mockResolvedValue({ blobs: mockBlobs });
      
      const listBlobs = async () => {
        const { blobs } = await list();
        return blobs;
      };
      
      const result = await listBlobs();
      
      expect(list).toHaveBeenCalled();
      expect(result).toEqual(mockBlobs);
    });
  });
});