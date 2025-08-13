'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ViewContextType {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ViewContext.Provider value={{ viewMode, setViewMode, searchQuery, setSearchQuery }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}