'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  projectId: string;
  folderId?: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUploadZone({ projectId, folderId, onClose, onUploadComplete }: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/*': ['.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.md'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const uploadFiles = async () => {
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== 'pending') continue;

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('projectId', projectId);
      if (folderId) formData.append('folderId', folderId);

      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'success', progress: 100 } : f
          ));
        } else {
          const error = await response.text();
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'error', error } : f
          ));
        }
      } catch (error) {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: 'Ошибка загрузки' } : f
        ));
      }
    }

    setIsUploading(false);
    const hasSuccess = files.some(f => f.status === 'success');
    if (hasSuccess) {
      toast.success('Файлы успешно загружены!');
      setTimeout(() => {
        onUploadComplete();
      }, 1000);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Загрузка файлов
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {isDragActive
                ? 'Отпустите файлы здесь'
                : 'Перетащите файлы сюда или нажмите для выбора'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Максимальный размер: 50MB | Поддерживаются все популярные форматы
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((uploadFile, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  {uploadFile.file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(uploadFile.file)}
                      alt={uploadFile.file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadFile.file.type)
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatBytes(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                    {uploadFile.error && (
                      <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  <div>
                    {uploadFile.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Отмена
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Загрузка...' : `Загрузить (${files.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}