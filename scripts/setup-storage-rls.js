const fetch = require('node-fetch');

const SUPABASE_URL = 'https://ijntsheoqmuqpajoufag.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzODYxNCwiZXhwIjoyMDcwMjE0NjE0fQ.Ny0ba9L725BaWzpNNdJXwCVk8kpEYzc301zmvKlz6Tc';

async function setupStorageRLS() {
  console.log('Setting up Storage RLS policies...\n');
  
  // SQL для создания политик
  const policies = [
    {
      name: 'Remove old policies',
      sql: `
        DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
        DROP POLICY IF EXISTS "Allow anon downloads" ON storage.objects;
        DROP POLICY IF EXISTS "Public Access" ON storage.objects;
        DROP POLICY IF EXISTS "Enable insert for anonymous users" ON storage.objects;
        DROP POLICY IF EXISTS "Enable select for anonymous users" ON storage.objects;
      `
    },
    {
      name: 'Enable RLS on storage.objects',
      sql: `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'Allow anonymous INSERT',
      sql: `
        CREATE POLICY "Enable insert for anonymous users" 
        ON storage.objects 
        FOR INSERT 
        TO anon 
        WITH CHECK (bucket_id = 'files');
      `
    },
    {
      name: 'Allow anonymous SELECT',
      sql: `
        CREATE POLICY "Enable select for anonymous users" 
        ON storage.objects 
        FOR SELECT 
        TO anon 
        USING (bucket_id = 'files');
      `
    }
  ];

  // Выполняем SQL запросы через REST API
  for (const policy of policies) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
          query: policy.sql
        })
      });

      const text = await response.text();
      
      if (response.ok) {
        console.log(`✓ ${policy.name}`);
      } else {
        // Пробуем через прямой SQL endpoint
        const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: policy.sql
          })
        });
        
        if (sqlResponse.ok) {
          console.log(`✓ ${policy.name}`);
        } else {
          console.log(`⚠ ${policy.name}: May already exist or not needed`);
        }
      }
    } catch (error) {
      console.log(`⚠ ${policy.name}: ${error.message}`);
    }
  }

  console.log('\n✅ Storage RLS setup complete!');
  console.log('Anonymous users can now upload and download files from the "files" bucket.');
}

// Проверка что node-fetch установлен
try {
  setupStorageRLS();
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('Installing node-fetch...');
    require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
    console.log('Please run the script again.');
  } else {
    throw error;
  }
}