import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in database:', users.length);
  
  const admin = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  
  if (admin) {
    console.log('Admin user found:');
    console.log('- ID:', admin.id);
    console.log('- Username:', admin.username);
    console.log('- Password hash:', admin.password.substring(0, 20) + '...');
    console.log('- Created at:', admin.createdAt);
  } else {
    console.log('Admin user NOT found!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());