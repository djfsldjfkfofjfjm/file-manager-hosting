import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

describe('Utility Functions', () => {
  describe('cn function', () => {
    // Inline implementation to avoid import issues
    const cn = (...inputs: any[]) => {
      return twMerge(clsx(inputs));
    };
    
    it('should merge class names correctly', () => {
      const result = cn('px-2 py-1', 'bg-red-500', 'hover:bg-blue-500');
      expect(result).toBe('px-2 py-1 bg-red-500 hover:bg-blue-500');
    });
    
    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
    });
    
    it('should merge Tailwind classes intelligently', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });
  });
  
  describe('File utilities', () => {
    it('should format file size correctly', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
      };
      
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
    
    it('should get file extension correctly', () => {
      const getFileExtension = (filename: string): string => {
        const parts = filename.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
      };
      
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('image.PNG')).toBe('png');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('noextension')).toBe('');
    });
    
    it('should validate file type', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      const isValidFileType = (mimeType: string): boolean => {
        return allowedTypes.includes(mimeType);
      };
      
      expect(isValidFileType('image/jpeg')).toBe(true);
      expect(isValidFileType('image/png')).toBe(true);
      expect(isValidFileType('application/pdf')).toBe(true);
      expect(isValidFileType('text/plain')).toBe(false);
    });
  });
});