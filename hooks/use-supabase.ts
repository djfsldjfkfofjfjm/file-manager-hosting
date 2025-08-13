'use client';

import { createClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

const supabaseUrl = 'https://ijntsheoqmuqpajoufag.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbnRzaGVvcW11cXBham91ZmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2Mzg2MTQsImV4cCI6MjA3MDIxNDYxNH0.kWuePhueZWMB-I0tIb8zN4uNhtQnKiwVBQYG9XqQy6I';

export function useSupabase() {
  return useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);
}