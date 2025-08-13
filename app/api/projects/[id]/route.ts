import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';
import { deleteFromSupabase } from '@/lib/storage/supabase-storage';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.userId
      },
      include: {
        folders: {
          orderBy: { name: 'asc' }
        },
        files: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const project = await prisma.project.updateMany({
      where: {
        id,
        userId: session.userId
      },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isPinned: data.isPinned
      }
    });

    if (project.count === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Проверяем существование проекта и получаем файлы
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.userId
      },
      include: {
        files: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Удаляем файлы из Supabase
    for (const file of project.files) {
      try {
        await deleteFromSupabase(file.filename);
      } catch (error) {
        console.error(`Error deleting file from Supabase: ${file.filename}`, error);
      }
    }

    // Удаляем проект и связанные записи из базы данных (каскадное удаление)
    await prisma.project.delete({
      where: {
        id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}