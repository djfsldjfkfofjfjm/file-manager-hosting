import { NextRequest, NextResponse } from 'next/server';
import { getFile, fileExists } from '@/lib/storage/local';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { path } = await params;
    const filename = path.join('/');

    // Check if file exists
    const exists = await fileExists(filename);
    if (!exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file record from database
    const fileRecord = await prisma.file.findFirst({
      where: { filename }
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get file buffer
    const buffer = await getFile(filename);

    // Return file with proper headers
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': fileRecord.mimeType,
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${fileRecord.originalName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}