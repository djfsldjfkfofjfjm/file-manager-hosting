import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, fileName, fileSize, mimeType } = await request.json();

    if (!projectId || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Проверяем размер файла (до 500MB)
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (fileSize > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 500MB limit' }, { status: 400 });
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

    // Генерируем уникальное имя файла для Supabase
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileExt = fileName.split('.').pop();
    const filename = `${projectId}/${timestamp}-${randomId}.${fileExt}`;

    // Возвращаем данные для загрузки
    return NextResponse.json({
      filename,
      projectId,
      userId: session.userId,
      maxSize: MAX_SIZE
    });
  } catch (error) {
    console.error('Prepare upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to prepare upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}