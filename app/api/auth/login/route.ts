import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { setSession } from '@/lib/auth/jwt';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secure_password_123';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if it's the first run - create admin user if not exists
    let user = await prisma.user.findUnique({
      where: { username: ADMIN_USERNAME },
    });

    if (!user) {
      // Create admin user on first login
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      user = await prisma.user.create({
        data: {
          username: ADMIN_USERNAME,
          password: hashedPassword,
        },
      });
    }

    // Verify credentials
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      // Check if it's the default password
      if (password === ADMIN_PASSWORD) {
        // Allow login with configured password
      } else {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Create session
    await setSession({
      userId: user.id,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}