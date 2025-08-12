import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'secure_password_123';
  
  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: adminUsername }
  });
  
  if (existingUser) {
    console.log('Admin user already exists');
    return;
  }
  
  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const user = await prisma.user.create({
    data: {
      username: adminUsername,
      password: hashedPassword
    }
  });
  
  console.log(`Created admin user: ${user.username}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });