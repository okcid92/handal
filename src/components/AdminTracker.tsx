"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  Upload,
  Search,
  Eye,
  CheckCircle,
  User,
  BookOpen,
  GraduationCap,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";
import type { AdminView } from "./AdminLayout";
import { AdminReferenceBulkUpload } from "./admin-reference-bulk-upload";
import { AdminStagingPanel } from "./admin-staging-panel";

type User = {
  id: string;
  name: string;
  ine: string | null;
  email: string | null;
  role: string;
  department: string | null;
};

type ReferenceDoc = {
  id: string;
  originalName: string;
  fileSize: string;
  createdAt: string;
  stagingMetadata: {
    subjectLabel?: string | null;
    authorName?: string | null;
    department?: string | null;
  } | null;
};

type Props = {
  view: AdminView;
  onNotify: (msg: string, ok?: boolean) => void;
};

export function AdminTracker({ view, onNotify }: Props) {
  return (
    <div className="p-6 sm:p-8">
      {view === "dashboard" && <DashboardView onNotify={onNotify} />}
      {view === "reference-docs" && <ReferenceDocsView />}
      {view === "staging" && <StagingView />}
      {view === "users" && <UsersView />}
    </div>
  );
}

function DashboardView({ onNotify }: { onNotify: (msg: string, ok?: boolean) => void }) {
  const loadStats = useCallback(async () => {
    // Just trigger reload after upload
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
          Bonjour, Administrateur
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
          Gérez vos documents de référence et utilisateurs
        </p>
        <hr className="mt-4" style={{ borderColor: "var(--line)" }} />
      </div>

      {/* Upload Zone */}
      <div className="rounded-xl border bg-white p-6" style={{ borderColor: "var(--line)" }}>
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4" style={{ color: "var(--text-soft)" }} />
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>
            Importer un document de référence
          </p>
        </div>
        <AdminReferenceBulkUpload onUploadDone={() => {
          onNotify("Document importé avec succès ! Le fichier a été ajouté à la zone de staging.", true);
          loadStats();
        }} />
      </div>
    </div>
  );
}

function StagingView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>Zone de staging</h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-soft)" }}>Vérifiez et corrigez les métadonnées avant indexation</p>
      </div>
      <AdminStagingPanel hideTabs />
    </div>
  );
}

function ReferenceDocsView() {
  const [docs, setDocs] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadDocs = useCallback(() => {
    apiFetch<{ ok: boolean; documents: ReferenceDoc[] }>("/api/admin/reference-docs/approved")
      .then((res) => setDocs(res.documents))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleDelete = async (docId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;
    setDeleting(docId);
    try {
      await apiFetch(`/api/admin/reference-docs/${docId}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de suppression");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>Documents de référence</h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-soft)" }}>{docs.length} document{docs.length !== 1 ? "s" : ""} dans la base</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#ddd4c4]/50 py-16" style={{ background: "var(--background)" }}>
          <CheckCircle className="h-10 w-10 text-green-500/60" />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Aucun document dans la base</p>
          <p className="text-xs" style={{ color: "var(--text-soft)" }}>Importez des documents depuis le tableau de bord.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => {
            let meta = null;
            if (doc.stagingMetadata) {
              if (typeof doc.stagingMetadata === "string") {
                try { meta = JSON.parse(doc.stagingMetadata); } catch { meta = null; }
              } else {
                meta = doc.stagingMetadata;
              }
            }
            return (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border bg-white p-4 transition hover:shadow-md" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "rgba(123,36,56,0.08)" }}>
                    <FileText className="h-5 w-5" style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "var(--foreground)" }}>{doc.originalName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-soft)" }}>
                      {meta?.authorName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {meta.authorName}
                        </span>
                      )}
                      {meta?.subjectLabel && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {meta.subjectLabel}
                        </span>
                      )}
                      {meta?.department && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {meta.department}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-soft)" }}>
                      {Math.round(Number(doc.fileSize) / 1024)} Ko • {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-red-50"
                    style={{ borderColor: "var(--line)", color: "#dc2626" }}
                  >
                    {deleting === doc.id ? "..." : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                  <a
                    href={`/api/documents/${doc.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-[#f5ece8]"
                    style={{ borderColor: "var(--line)", color: "var(--primary)" }}
                  >
                    Voir
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "STUDENT" | "TEACHER" | "DA">("all");

  useEffect(() => {
    apiFetch<{ ok: boolean; users: User[] }>("/api/admin/users")
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesFilter = filter === "all" || u.role === filter;
      const matchesSearch =
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.ine?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [users, search, filter]);

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      STUDENT: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
      TEACHER: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
      DA: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
      ADMIN: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
    };
    const s = styles[role] || styles.STUDENT;
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
      >
        {role === "STUDENT" ? "Étudiant" : role === "TEACHER" ? "Enseignant" : role === "DA" ? "DA" : "Admin"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>Utilisateurs</h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-soft)" }}>Liste des comptes enregistrés sur la plateforme</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-soft)" }} />
        <input
          type="text"
          placeholder="Rechercher par nom, INE ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#7b2438] focus:ring-2 focus:ring-[#7b2438]/20"
          style={{ borderColor: "var(--line)", background: "var(--surface-1)" }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "STUDENT", "TEACHER", "DA"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-xs font-medium transition"
            style={
              filter === f
                ? { background: "var(--primary)", color: "#fff" }
                : { background: "var(--surface-1)", border: "1px solid var(--line)", color: "var(--foreground)" }
            }
          >
            {f === "all" ? "Tous" : f === "STUDENT" ? "Étudiants" : f === "TEACHER" ? "Enseignants" : "DA"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438]" />
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "var(--line)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "var(--background)" }}>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>Avatar</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>Nom</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>Email / INE</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-soft)" }}>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b transition hover:bg-[#faf7f4]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <td className="px-5 py-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: "rgba(123,36,56,0.1)", color: "var(--primary)" }}
                    >
                      {getInitials(user.name)}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user.name}</p>
                    {user.department && <p className="text-xs" style={{ color: "var(--text-soft)" }}>{user.department}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm" style={{ color: "var(--text-soft)" }}>{user.ine || user.email || "-"}</p>
                  </td>
                  <td className="px-5 py-3">{getRoleBadge(user.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: "var(--text-soft)" }}>
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}