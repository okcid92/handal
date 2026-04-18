import { DashboardShell } from "@/components/dashboard-shell";
import { TeacherDashboard } from "@/components/teacher-dashboard";

export default function TeacherPage() {
  return (
    <DashboardShell
      title="Espace enseignant"
      subtitle="Modère les thèmes en attente, lance les analyses officielles et consulte les rapports d’analyse."
    >
      <TeacherDashboard />
    </DashboardShell>
  );
}
