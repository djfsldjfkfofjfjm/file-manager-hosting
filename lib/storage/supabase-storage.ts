import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
// Use service role key for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzODYxNCwiZXhwIjoyMDcwMjE0NjE0fQ.Ny0ba9L725BaWzpNNdJXwCVk8kpEYzc301zmvKlz6Tc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function uploadToSupabase(file: File, projectId: string): Promise<{ url: string; filename: string }> {
  // Создаем уникальное имя файла
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const fileExt = file.name.split('.').pop();
  const filename = `${projectId}/${timestamp}-${randomId}.${fileExt}`;

  // Проверяем существование bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === 'files');
  
  if (!bucketExists) {
    // Создаем bucket только если его нет
    await supabase.storage.createBucket('files', {
      public: true,
      fileSizeLimit: 524288000, // 500MB
      allowedMimeTypes: undefined // undefined = разрешить все типы
    });
  }

  // Загружаем файл без указания contentType - пусть Supabase сам определяет
  const { data, error } = await supabase.storage
    .from('files')
    .upload(filename, file, {
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