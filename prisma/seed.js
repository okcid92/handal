const bcrypt = require("bcryptjs");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const seedPassword = process.env.SEED_PASSWORD || "mon926732";
const passwordHash = bcrypt.hashSync(seedPassword, 12);

const accounts = [
  {
    name: "Dicko Alou",
    ine: "N01331820231",
    email: null,
    password: passwordHash,
    role: "STUDENT",
    department: "MIAGE",
  },
  {
    name: "Dr. Yacouba Ouatara",
    ine: null,
    email: "teacher@handal.local",
    password: passwordHash,
    role: "TEACHER",
    department: "Informatique",
  },
  {
    name: "Dr. Lucien Zaongo",
    ine: null,
    email: "da@handal.local",
    password: passwordHash,
    role: "DA",
    department: "Direction Academique",
  },
  {
    name: "Administration",
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

  const [student, teacher, da] = await Promise.all([
    prisma.user.findUnique({ where: { ine: "N01331820231" } }),
    prisma.user.findUnique({ where: { email: "teacher@handal.local" } }),
    prisma.user.findUnique({ where: { email: "da@handal.local" } }),
  ]);

  if (!student || !teacher || !da) {
    throw new Error("Seed prerequisite users are missing");
  }

  const now = new Date();
  await prisma.theme.upsert({
    where: {
      titleNormalized: "ai in education",
    },
    update: {
      studentId: student.id,
      title: "AI in Education",
      description:
        "Etude des usages de l'intelligence artificielle dans l'apprentissage universitaire.",
      status: "VALIDATED",
      teacherApproval: true,
      teacherComment: "Sujet pertinent pour le departement.",
      teacherValidatedAt: now,
      daApproval: true,
      daComment: "Validation academique conjointe confirmee.",
      daValidatedAt: now,
    },
    create: {
      studentId: student.id,
      title: "AI in Education",
      titleNormalized: "ai in education",
      description:
        "Etude des usages de l'intelligence artificielle dans l'apprentissage universitaire.",
      status: "VALIDATED",
      teacherApproval: true,
      teacherComment: "Sujet pertinent pour le departement.",
      teacherValidatedAt: now,
      daApproval: true,
      daComment: "Validation academique conjointe confirmee.",
      daValidatedAt: now,
    },
  });

  console.log("Seed completed: demo accounts and v2 validated theme ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });