import { DashboardShell } from "@/components/dashboard-shell";
import { DaDashboard } from "@/components/da-dashboard";

export default function DaPage() {
  return (
    <DashboardShell
      title="Espace Direction Académique"
      subtitle="Valide les thèmes en seconde lecture, fixe la note finale et prend la décision de délibération."
    >
      <DaDashboard />
    </DashboardShell>
  );
}
