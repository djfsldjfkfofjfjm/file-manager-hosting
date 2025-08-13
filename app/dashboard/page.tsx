'use client';

import { FolderPlus, HardDrive, FileText, Image } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatBytes } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    imageFiles: 0,
    documentFiles: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFiles}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Всего файлов</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Image className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.imageFiles}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Изображений</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.documentFiles}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Документов</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <HardDrive className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatBytes(stats.totalSize)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Использовано</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <FolderPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Начните с создания проекта
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Создайте свой первый проект для организации файлов
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Создать проект
          </Link>
        </div>
      </div>
    </div>
  );
}