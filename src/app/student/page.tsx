import { DashboardShell } from "@/components/dashboard-shell";
import { StudentDashboard } from "@/components/student-dashboard";

export default function StudentPage() {
  return (
    <DashboardShell
      title="Espace étudiant"
      subtitle="Propose un thème, dépose le mémoire final et lance l’auto-test depuis un seul tableau de bord."
    >
      <StudentDashboard />
    </DashboardShell>
  );
}
