import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      filename, 
      originalName, 
      mimeType, 
      size, 
      projectId, 
      folderId,
      supabaseUrl 
    } = await request.json();

    if (!filename || !originalName || !size || !projectId || !supabaseUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Проверяем существование проекта и права доступа
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.userId
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Генерируем thumbnail URL для изображений
    const thumbnailUrl = mimeType?.startsWith('image/') ? supabaseUrl : null;

    // Сохраняем информацию о файле в базе данных
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName,
        mimeType: mimeType || 'application/octet-stream',
        size,
        url: supabaseUrl, // Сохраняем Supabase URL для проксирования
        thumbnailUrl,
        projectId,
        folderId: folderId || null,
        uploadedBy: session.userId,
        metadata: null
      }
    });

    // Возвращаем запись с URL через наш домен
    return NextResponse.json({
      ...fileRecord,
      // Публичная ссылка через наш домен для пользователя
      publicUrl: `/api/files/${filename}`
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to confirm upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}