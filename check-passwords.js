const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, ine: true, role: true, password: true }
  });

  const testPassword = "Handal@2025!";
  
  console.log("Testing password:", testPassword);
  console.log("");

  for (const user of users) {
    const matches = await bcrypt.compare(testPassword, user.password);
    console.log(`${user.role}: ${user.email || user.ine}`);
    console.log(`  Password hash prefix: ${user.password.substring(0, 20)}...`);
    console.log(`  Matches "Handal@2025!": ${matches}`);
    console.log("");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
