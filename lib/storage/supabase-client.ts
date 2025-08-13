import { createClient } from '@supabase/supabase-js';

// Публичный клиент для использования в браузере
const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mzg2MTQsImV4cCI6MjA3MDIxNDYxNH0.kWuePhueZWMB-I0tIb8zN4uNhtQnKiwVBQYG9XqQy6I';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Функция для прямой загрузки файла в Supabase из браузера
export async function uploadFileDirectly(
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string; error?: string }> {
  try {
    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop();
    const filename = `${projectId}/${timestamp}-${randomId}.${fileExt}`;

    // Для больших файлов используем resumable upload
    if (file.size > 6 * 1024 * 1024) { // Больше 6MB
      // Используем TUS протокол для resumable uploads
      const { data, error } = await supabaseClient.storage
        .from('files')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
          duplex: 'half'
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
    } else {
      // Для маленьких файлов обычная загрузка
      const { data, error } = await supabaseClient.storage
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
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return { 
      url: '', 
      filename: '', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Функция для загрузки с прогрессом (используя XMLHttpRequest для больших файлов)
export async function uploadFileWithProgress(
  file: File,
  projectId: string,
  onProgress: (progress: number) => void
): Promise<{ url: string; filename: string; error?: string }> {
  return new Promise((resolve) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop();
    const filename = `${projectId}/${timestamp}-${randomId}.${fileExt}`;

    // Для больших файлов разбиваем на чанки
    const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB чанки
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    if (file.size <= CHUNK_SIZE) {
      // Маленький файл - загружаем целиком
      uploadFileDirectly(file, projectId, onProgress)
        .then(resolve)
        .catch(err => resolve({ url: '', filename: '', error: err.message }));
    } else {
      // Большой файл - используем resumable upload
      let uploadedChunks = 0;
      
      const uploadChunk = async (start: number, end: number) => {
        const chunk = file.slice(start, end);
        const chunkFile = new File([chunk], file.name, { type: file.type });
        
        try {
          // Загружаем чанк
          const { error } = await supabaseClient.storage
            .from('files')
            .upload(filename, chunkFile, {
              cacheControl: '3600',
              upsert: start > 0, // Перезаписываем если это не первый чанк
              contentRange: `bytes ${start}-${end - 1}/${file.size}`
            });

          if (error) throw error;
          
          uploadedChunks++;
          const progress = (uploadedChunks / totalChunks) * 100;
          onProgress(progress);
          
          if (end < file.size) {
            // Загружаем следующий чанк
            const nextStart = end;
            const nextEnd = Math.min(nextStart + CHUNK_SIZE, file.size);
            await uploadChunk(nextStart, nextEnd);
          } else {
            // Все чанки загружены
            const { data: { publicUrl } } = supabaseClient.storage
              .from('files')
              .getPublicUrl(filename);
            
            resolve({ url: publicUrl, filename });
          }
        } catch (error) {
          console.error('Chunk upload failed:', error);
          resolve({ 
            url: '', 
            filename: '', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      };
      
      // Начинаем загрузку с первого чанка
      uploadChunk(0, Math.min(CHUNK_SIZE, file.size));
    }
  });
}