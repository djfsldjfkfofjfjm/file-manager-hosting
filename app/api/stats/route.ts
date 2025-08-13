import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: {
        uploadedBy: session.userId,
        deletedAt: null
      }
    });

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const imageFiles = files.filter(file => file.mimeType.startsWith('image/')).length;
    const documentFiles = files.filter(file => 
      file.mimeType.includes('pdf') || 
      file.mimeType.includes('word') || 
      file.mimeType.includes('document') ||
      file.mimeType.includes('text')
    ).length;

    return NextResponse.json({
      totalFiles,
      totalSize,
      imageFiles,
      documentFiles
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats' 
    }, { status: 500 });
  }
}