const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const passwordHash = bcrypt.hashSync("mon926732", 10);

const accounts = [
  {
    name: "Student Demo",
    ine: "N01331820231",
    email: null,
    password: passwordHash,
    role: "STUDENT",
    department: "MIAGE",
  },
  {
    name: "Teacher Demo",
    ine: null,
    email: "teacher@handal.local",
    password: passwordHash,
    role: "TEACHER",
    department: "Informatique",
  },
  {
    name: "DA Demo",
    ine: null,
    email: "da@handal.local",
    password: passwordHash,
    role: "DA",
    department: "Direction Academique",
  },
  {
    name: "Admin Demo",
    ine: null,
    email: "admin@handal.local",
    password: passwordHash,
    role: "ADMIN",
    department: "IT",
  },
];

async function main() {
  for (const account of accounts) {
    await prisma.user.upsert({
      where: account.ine ? { ine: account.ine } : { email: account.email },
      update: {
        name: account.name,
        password: account.password,
        role: account.role,
        department: account.department,
        ine: account.ine,
        email: account.email,
      },
      create: account,
    });
  }

  console.log("Seed completed: demo accounts ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
