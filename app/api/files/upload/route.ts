import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';
import { uploadToSupabase } from '@/lib/storage/supabase-storage';

export const maxDuration = 60; // Увеличиваем таймаут до 60 секунд

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const folderId = formData.get('folderId') as string | null;

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and projectId are required' }, { status: 400 });
    }

    // Check file size (50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.userId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Upload to Supabase Storage
    const { url, filename } = await uploadToSupabase(file, projectId);
    
    // Generate thumbnail URL for images
    const thumbnailUrl = file.type.startsWith('image/') ? url : null;

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url,
        thumbnailUrl,
        projectId,
        folderId,
        uploadedBy: session.userId,
        metadata: null
      }
    });

    return NextResponse.json(fileRecord);
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to upload file',
      details: errorMessage
    }, { status: 500 });
  }
}