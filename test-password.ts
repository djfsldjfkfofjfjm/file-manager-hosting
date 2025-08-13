import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  
  if (!admin) {
    console.log('Admin user not found!');
    return;
  }
  
  console.log('Testing password verification...');
  
  const testPassword = 'secure_password_123';
  const isValid = await bcrypt.compare(testPassword, admin.password);
  
  console.log('Password "secure_password_123" is valid:', isValid);
  
  // Также проверим с другим паролем
  const wrongPassword = 'wrong_password';
  const isWrong = await bcrypt.compare(wrongPassword, admin.password);
  console.log('Password "wrong_password" is valid:', isWrong);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());