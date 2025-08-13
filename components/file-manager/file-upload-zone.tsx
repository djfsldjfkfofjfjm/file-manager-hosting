'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';
import { supabaseClient } from '@/lib/storage/supabase-client';

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
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const uploadFiles = async () => {
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== 'pending') continue;

      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // 1. Получаем разрешение на загрузку от сервера
        const prepareResponse = await fetch('/api/files/prepare-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            mimeType: uploadFile.file.type
          })
        });

        if (!prepareResponse.ok) {
          const error = await prepareResponse.json();
          throw new Error(error.error || 'Failed to prepare upload');
        }

        const { filename, maxSize } = await prepareResponse.json();

        // Проверяем размер файла
        if (uploadFile.file.size > maxSize) {
          throw new Error(`File size exceeds ${formatBytes(maxSize)} limit`);
        }

        // 2. Загружаем файл напрямую в Supabase из браузера
        const updateProgress = (progress: number) => {
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress } : f
          ));
        };

        // Для больших файлов (>6MB) используем чанковую загрузку
        const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks
        let uploadedUrl: string;
        
        if (uploadFile.file.size > CHUNK_SIZE) {
          // Большой файл - загружаем по частям
          const totalChunks = Math.ceil(uploadFile.file.size / CHUNK_SIZE);
          let uploadedChunks = 0;

          for (let start = 0; start < uploadFile.file.size; start += CHUNK_SIZE) {
            const end = Math.min(start + CHUNK_SIZE, uploadFile.file.size);
            const chunk = uploadFile.file.slice(start, end);
            
            const { data, error } = await supabaseClient.storage
              .from('files')
              .upload(filename, chunk, {
                cacheControl: '3600',
                upsert: start > 0, // Добавляем к существующему файлу
                contentRange: `bytes ${start}-${end - 1}/${uploadFile.file.size}`
              });

            if (error) throw error;
            
            uploadedChunks++;
            updateProgress((uploadedChunks / totalChunks) * 100);
          }
        } else {
          // Маленький файл - загружаем целиком
          const { data, error } = await supabaseClient.storage
            .from('files')
            .upload(filename, uploadFile.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;
          updateProgress(100);
        }

        // Получаем публичный URL из Supabase
        const { data: { publicUrl } } = supabaseClient.storage
          .from('files')
          .getPublicUrl(filename);

        // 3. Подтверждаем загрузку на сервере и сохраняем в БД
        const confirmResponse = await fetch('/api/files/confirm-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename,
            originalName: uploadFile.file.name,
            mimeType: uploadFile.file.type,
            size: uploadFile.file.size,
            projectId,
            folderId,
            supabaseUrl: publicUrl
          })
        });

        if (!confirmResponse.ok) {
          const error = await confirmResponse.json();
          throw new Error(error.error || 'Failed to confirm upload');
        }

        const fileRecord = await confirmResponse.json();
        console.log('File uploaded successfully:', fileRecord);

        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ));
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed' 
          } : f
        ));
      }
    }

    setIsUploading(false);
    
    const successCount = files.filter(f => f.status === 'success').length;
    if (successCount > 0) {
      toast.success(`Загружено файлов: ${successCount}`);
      setTimeout(() => {
        onUploadComplete();
      }, 1500);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Загрузка файлов</h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {isDragActive
                ? 'Отпустите файлы здесь'
                : 'Перетащите файлы сюда или нажмите для выбора'}
            </p>
            <p className="text-xs text-gray-500">
              Максимальный размер: 500MB. Поддерживаются все популярные форматы.
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((uploadFile, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  {uploadFile.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : uploadFile.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    getFileIcon(uploadFile.file)
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(uploadFile.file.size)}
                      {uploadFile.error && (
                        <span className="text-red-500 ml-2">{uploadFile.error}</span>
                      )}
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {uploadFile.status === 'pending' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? 'Загрузка...' : `Загрузить (${files.filter(f => f.status === 'pending').length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}