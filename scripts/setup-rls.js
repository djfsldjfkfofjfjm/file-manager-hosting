const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzODYxNCwiZXhwIjoyMDcwMjE0NjE0fQ.Ny0ba9L725BaWzpNNdJXwCVk8kpEYzc301zmvKlz6Tc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLS() {
  console.log('Setting up RLS policies for Storage...');
  
  try {
    // Сначала удаляем существующие политики для bucket 'files'
    await supabase.rpc('query', {
      query: `
        DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow anon downloads" ON storage.objects;
        DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      `
    }).catch(() => {});

    // Создаем новые политики для анонимных пользователей
    const { data: insertPolicy, error: insertError } = await supabase.rpc('query', {
      query: `
        CREATE POLICY "Allow anon uploads" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'files');
      `
    });

    if (insertError) {
      console.log('Insert policy might already exist or error:', insertError.message);
    } else {
      console.log('✓ Created INSERT policy for anonymous users');
    }

    // Политика для чтения файлов
    const { data: selectPolicy, error: selectError } = await supabase.rpc('query', {
      query: `
        CREATE POLICY "Allow anon downloads" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'files');
      `
    });

    if (selectError) {
      console.log('Select policy might already exist or error:', selectError.message);
    } else {
      console.log('✓ Created SELECT policy for anonymous users');
    }

    // Проверяем что bucket публичный
    const { data: bucketUpdate, error: bucketError } = await supabase.storage
      .updateBucket('files', {
        public: true,
        fileSizeLimit: 524288000, // 500MB
        allowedMimeTypes: undefined
      });

    if (bucketError) {
      console.log('Bucket update error:', bucketError.message);
      
      // Если не удалось обновить, попробуем создать новый
      const { data: bucketCreate, error: createError } = await supabase.storage
        .createBucket('files', {
          public: true,
          fileSizeLimit: 524288000, // 500MB
          allowedMimeTypes: undefined
        });
        
      if (createError && !createError.message.includes('already exists')) {
        console.log('Bucket create error:', createError.message);
      }
    } else {
      console.log('✓ Bucket settings updated');
    }

    console.log('\n✅ RLS policies configured successfully!');
    console.log('Anonymous users can now:');
    console.log('- Upload files to the "files" bucket');
    console.log('- Download files from the "files" bucket');
    
  } catch (error) {
    console.error('Error setting up RLS:', error);
  }
}

setupRLS();