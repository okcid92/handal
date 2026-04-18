import { DashboardShell } from "@/components/dashboard-shell";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminPage() {
  return (
    <DashboardShell
      title="Espace administrateur"
      subtitle="Supervision complète de la plateforme, accès rapide aux vues métiers et aux endpoints de consultation."
    >
      <AdminDashboard />
    </DashboardShell>
  );
}
