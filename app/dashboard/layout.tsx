import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ViewProvider } from '@/contexts/view-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ViewProvider>
  );
}