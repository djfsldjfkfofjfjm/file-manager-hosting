'use client';

import { createClient } from '@supabase/supabase-js';

// Публичный клиент для использования в браузере
const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mzg2MTQsImV4cCI6MjA3MDIxNDYxNH0.kWuePhueZWMB-I0tIb8zN4uNhtQnKiwVBQYG9XqQy6I';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Функция для прямой загрузки файла в Supabase из браузера
export async function uploadFileDirectly(
  file: File,
  projectId: string
): Promise<{ url: string; filename: string; error?: string }> {
  try {
    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop();
    const filename = `${projectId}/${timestamp}-${randomId}.${fileExt}`;

    // Загружаем файл (Supabase автоматически обрабатывает большие файлы)
    const { error } = await supabaseClient.storage
      .from('files')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', filename: '', error: error.message };
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('files')
      .getPublicUrl(filename);

    return { url: publicUrl, filename };
  } catch (error) {
    console.error('Upload failed:', error);
    return { 
      url: '', 
      filename: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}