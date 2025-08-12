import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';
import { deleteFile as deletePhysicalFile } from '@/lib/storage/local';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get file and verify ownership
    const file = await prisma.file.findFirst({
      where: {
        id,
        uploadedBy: session.userId
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Soft delete - move to trash
    await prisma.file.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Get file and verify ownership
    const file = await prisma.file.findFirst({
      where: {
        id,
        uploadedBy: session.userId
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Update file
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        originalName: data.originalName,
        folderId: data.folderId,
        projectId: data.projectId
      }
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}