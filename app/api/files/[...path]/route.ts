import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { path } = await params;
    const filename = path.join('/');

    // Get file record from database
    const fileRecord = await prisma.file.findFirst({
      where: { filename }
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Fetch file from Supabase Storage
    const response = await fetch(fileRecord.url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the file data as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Return file with proper headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': fileRecord.mimeType,
        'Content-Length': fileRecord.size.toString(),
        'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}