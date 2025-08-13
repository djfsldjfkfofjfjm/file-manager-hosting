import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mzg2MTQsImV4cCI6MjA3MDIxNDYxNH0.kWuePhueZWMB-I0tIb8zN4uNhtQnKiwVBQYG9XqQy6I';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadToSupabase(file: File, projectId: string): Promise<{ url: string; filename: string }> {
  // Создаем уникальное имя файла
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const fileExt = file.name.split('.').pop();
  const filename = `${projectId}/${timestamp}-${randomId}.${fileExt}`;

  // Создаем bucket если его нет
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'files');
  
  if (!bucketExists) {
    await supabase.storage.createBucket('files', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
  }

  // Загружаем файл
  const { data, error } = await supabase.storage
    .from('files')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filename);

  return {
    url: publicUrl,
    filename: filename
  };
}

export async function deleteFromSupabase(filename: string): Promise<void> {
  const { error } = await supabase.storage
    .from('files')
    .remove([filename]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

export async function listSupabaseFiles(projectId: string) {
  const { data, error } = await supabase.storage
    .from('files')
    .list(projectId, {
      limit: 100,
      offset: 0
    });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}