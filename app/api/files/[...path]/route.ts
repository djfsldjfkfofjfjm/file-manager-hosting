import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { path } = await params;
    const filename = path.join('/');

    console.log('Serving file:', filename);

    // Get file record from database
    const fileRecord = await prisma.file.findFirst({
      where: { filename }
    });

    if (!fileRecord) {
      console.error('File not found in database:', filename);
      return NextResponse.json({ 
        error: 'File not found in database',
        filename: filename
      }, { status: 404 });
    }

    console.log('Found file record:', {
      id: fileRecord.id,
      filename: fileRecord.filename,
      url: fileRecord.url
    });

    // Fetch file from Supabase Storage
    const response = await fetch(fileRecord.url);
    
    if (!response.ok) {
      console.error('Failed to fetch from Supabase:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'Failed to fetch file from storage',
        status: response.status,
        statusText: response.statusText
      }, { status: 404 });
    }

    // Get the file data as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('Successfully fetched file, size:', arrayBuffer.byteLength);
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to serve file',
      details: errorMessage
    }, { status: 500 });
  }
}