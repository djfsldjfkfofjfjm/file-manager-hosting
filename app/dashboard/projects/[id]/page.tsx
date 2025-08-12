'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { 
  File, 
  Folder, 
  MoreVertical, 
  Download, 
  Trash2, 
  Copy, 
  Move,
  Eye,
  Link as LinkIcon,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDate, getFileIcon } from '@/lib/utils';
import { FileUploadZone } from '@/components/file-manager/file-upload-zone';

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  path: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  files: FileItem[];
  folders: FolderItem[];
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else if (response.status === 404) {
        toast.error('Проект не найден');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error('Ошибка загрузки проекта');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (fileId: string, multiSelect = false) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (multiSelect) {
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
      } else {
        newSet.clear();
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleCopyLink = (file: FileItem) => {
    const url = `${window.location.origin}/api/files/${file.filename}`;
    navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована!');
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Удалить файл в корзину?')) return;

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Файл перемещен в корзину');
        fetchProject();
      } else {
        toast.error('Ошибка удаления файла');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Проект не найден</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {showUpload && (
        <FileUploadZone 
          projectId={id}
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => {
            setShowUpload(false);
            fetchProject();
          }}
        />
      )}

      <div className="p-6 flex-1 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{project.icon || '📁'}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => setShowUpload(true)}>
              Загрузить файлы
            </Button>
          </div>
        </div>

        {project.files.length === 0 && project.folders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
            <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет файлов
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Загрузите первые файлы в этот проект
            </p>
            <Button onClick={() => setShowUpload(true)}>
              Загрузить файлы
            </Button>
          </div>
        ) : (
          <>
            {project.folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Папки
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {project.folders.map((folder) => (
                    <button
                      key={folder.id}
                      className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Folder className="w-12 h-12 text-blue-500 mb-2" />
                      <span className="text-sm text-gray-900 dark:text-white truncate w-full text-center">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {project.files.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative bg-white dark:bg-gray-800 rounded-lg border ${
                      selectedFiles.has(file.id) 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 dark:border-gray-700'
                    } overflow-hidden cursor-pointer hover:shadow-lg transition-all`}
                    onClick={(e) => handleFileSelect(file.id, e.ctrlKey || e.metaKey)}
                  >
                    {selectedFiles.has(file.id) && (
                      <div className="absolute top-2 left-2 z-10">
                        <CheckCircle className="w-5 h-5 text-blue-500 fill-white" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-white/90 dark:bg-gray-800/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(file);
                          }}
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 bg-white/90 dark:bg-gray-800/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="aspect-square relative bg-gray-50 dark:bg-gray-900">
                      {file.mimeType.startsWith('image/') ? (
                        <img
                          src={file.thumbnailUrl || file.url}
                          alt={file.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">{getFileIcon(file.mimeType)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Имя
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Размер
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Дата
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.files.map((file) => (
                      <tr
                        key={file.id}
                        className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                          selectedFiles.has(file.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={(e) => handleFileSelect(file.id, e.ctrlKey || e.metaKey)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getFileIcon(file.mimeType)}</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {file.originalName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(file.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(file);
                              }}
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}