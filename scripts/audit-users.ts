/**
 * scripts/audit-users.ts
 * Audit d'intégrité des comptes utilisateurs Handal.
 *
 * Usage :
 *   npx tsx scripts/audit-users.ts
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_ROLES = ["STUDENT", "TEACHER", "DA", "ADMIN"] as const;
// Mot de passe de test pour détecter les mots de passe en clair connus
const KNOWN_PLAIN_PASSWORDS = ["admin", "admin123", "password", "123456", "mon926732"];

type Issue = { userId: string; field: string; detail: string; severity: "ERROR" | "WARN" };

async function main() {
  console.log("\n🔍 Audit des comptes Handal...\n");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, ine: true, role: true, password: true },
    orderBy: { id: "asc" },
  });

  console.log(`   ${users.length} utilisateur(s) trouvé(s)\n`);

  const issues: Issue[] = [];
  const emailsSeen = new Map<string, string>();
  const inesSeen = new Map<string, string>();

  for (const user of users) {
    const uid = user.id.toString();

    // 1. Rôle valide
    if (!VALID_ROLES.includes(user.role as typeof VALID_ROLES[number])) {
      issues.push({ userId: uid, field: "role", detail: `Rôle invalide : "${user.role}"`, severity: "ERROR" });
    }

    // 2. Email normalisé (espaces cachés, casse)
    if (user.email) {
      const normalized = user.email.trim().toLowerCase();
      if (normalized !== user.email) {
        issues.push({ userId: uid, field: "email", detail: `Email non normalisé : "${user.email}" → devrait être "${normalized}"`, severity: "WARN" });
      }
      if (emailsSeen.has(normalized)) {
        issues.push({ userId: uid, field: "email", detail: `Email dupliqué avec user #${emailsSeen.get(normalized)} : "${normalized}"`, severity: "ERROR" });
      } else {
        emailsSeen.set(normalized, uid);
      }
    }

    // 3. INE unique
    if (user.ine) {
      if (inesSeen.has(user.ine)) {
        issues.push({ userId: uid, field: "ine", detail: `INE dupliqué avec user #${inesSeen.get(user.ine)} : "${user.ine}"`, severity: "ERROR" });
      } else {
        inesSeen.set(user.ine, uid);
      }
    }

    // 4. Étudiant doit avoir INE, staff doit avoir email
    if (user.role === "STUDENT" && !user.ine) {
      issues.push({ userId: uid, field: "ine", detail: "Étudiant sans INE — connexion impossible", severity: "ERROR" });
    }
    if (user.role !== "STUDENT" && !user.email) {
      issues.push({ userId: uid, field: "email", detail: `Utilisateur ${user.role} sans email — connexion impossible`, severity: "ERROR" });
    }

    // 5. Détecter les mots de passe en clair (non hachés)
    const looksLikeHash = user.password.startsWith("$2") && user.password.length >= 60;
    if (!looksLikeHash) {
      issues.push({ userId: uid, field: "password", detail: "Mot de passe non haché (texte brut détecté)", severity: "ERROR" });
    } else {
      // Vérifier si un mot de passe connu faible correspond au hash
      for (const plain of KNOWN_PLAIN_PASSWORDS) {
        const match = await bcrypt.compare(plain, user.password);
        if (match) {
          issues.push({ userId: uid, field: "password", detail: `Mot de passe faible connu détecté : "${plain}"`, severity: "WARN" });
          break;
        }
      }
    }
  }

  // Résumé par rôle
  const byRole = VALID_ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {});

  console.log("📊 Répartition des rôles :");
  for (const [role, count] of Object.entries(byRole)) {
    console.log(`   ${role.padEnd(10)} : ${count}`);
  }

  console.log("\n📋 Résultats de l'audit :");
  if (issues.length === 0) {
    console.log("   ✅ Aucun problème détecté.\n");
  } else {
    const errors = issues.filter((i) => i.severity === "ERROR");
    const warns = issues.filter((i) => i.severity === "WARN");
    console.log(`   ❌ ${errors.length} erreur(s)  ⚠️  ${warns.length} avertissement(s)\n`);
    for (const issue of issues) {
      const icon = issue.severity === "ERROR" ? "❌" : "⚠️ ";
      console.log(`   ${icon} [User #${issue.userId}] ${issue.field} — ${issue.detail}`);
    }
    console.log();
  }
}

main()
  .catch((err) => {
    console.error("❌ Erreur audit-users :", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
