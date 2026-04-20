/**
 * scripts/reset-admin.ts
 * Script de récupération d'accès admin Handal.
 *
 * Usage :
 *   npx tsx scripts/reset-admin.ts
 *
 * Variables d'environnement optionnelles :
 *   ADMIN_EMAIL    — email du compte à réinitialiser (défaut: admin@handal.local)
 *   ADMIN_PASSWORD — nouveau mot de passe en clair  (défaut: Handal@Admin2025!)
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@handal.local";
  const plainPassword = process.env.ADMIN_PASSWORD ?? "Handal@Admin2025!";

  const hash = await bcrypt.hash(plainPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hash, role: "ADMIN" },
    create: {
      name: "Admin Handal",
      email,
      password: hash,
      role: "ADMIN",
      department: "IT",
    },
  });

  console.log(`\n✅ Admin réinitialisé :`);
  console.log(`   ID    : ${user.id}`);
  console.log(`   Email : ${user.email}`);
  console.log(`   Rôle  : ${user.role}`);
  console.log(`   Mot de passe : ${plainPassword}\n`);
  console.log(`⚠️  Changez ce mot de passe après la première connexion.\n`);
}

main()
  .catch((err) => {
    console.error("❌ Erreur reset-admin :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
