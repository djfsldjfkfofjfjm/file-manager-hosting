import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzODYxNCwiZXhwIjoyMDcwMjE0NjE0fQ.Ny0ba9L725BaWzpNNdJXwCVk8kpEYzc301zmvKlz6Tc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('Setting up Supabase Storage...');
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  console.log('Existing buckets:', buckets?.map(b => b.name));
  
  const bucketExists = buckets?.some(b => b.name === 'files');
  
  if (!bucketExists) {
    console.log('Creating "files" bucket...');
    const { data, error } = await supabase.storage.createBucket('files', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/*', 'application/pdf', 'text/*']
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Bucket created successfully:', data);
    }
  } else {
    console.log('Bucket "files" already exists');
    
    // Update bucket to be public if it's not
    const { data, error } = await supabase.storage.updateBucket('files', {
      public: true,
      fileSizeLimit: 10485760,
    });
    
    if (error) {
      console.error('Error updating bucket:', error);
    } else {
      console.log('Bucket updated successfully');
    }
  }
  
  console.log('Setup complete!');
}

setupStorage().catch(console.error);