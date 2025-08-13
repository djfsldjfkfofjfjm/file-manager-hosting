'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Plus, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Star,
  HardDrive,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isPinned: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      toast.error('Ошибка при выходе');
    }
  };

  const menuItems = [
    {
      href: '/dashboard',
      label: 'Главная',
      icon: Home,
      active: pathname === '/dashboard',
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">File Manager</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Управление файлами</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1 mb-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                item.active
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex items-center space-x-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {isProjectsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span>Проекты</span>
            </button>
            <Link href="/dashboard/projects/new">
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isProjectsOpen && (
            <div className="space-y-1">
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Загрузка...
                </div>
              ) : projects.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Нет проектов
                </div>
              ) : (
                <>
                  {projects.filter(p => p.isPinned).map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors text-sm",
                        pathname.includes(project.id)
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span className="truncate">
                        {project.icon} {project.name}
                      </span>
                    </Link>
                  ))}
                  {projects.filter(p => !p.isPinned).map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors text-sm",
                        pathname.includes(project.id)
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span className="truncate">
                        {project.icon} {project.name}
                      </span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </Button>
      </div>
    </aside>
  );
}