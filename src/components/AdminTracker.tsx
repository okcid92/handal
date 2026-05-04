"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  UserPlus,
  Upload,
  Search,
  Eye,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";
import type { AdminView } from "./AdminLayout";
import { AdminReferenceBulkUpload } from "./admin-reference-bulk-upload";

const COLORS = {
  primary: "#7d1c2a",
  background: "#f4efe8",
  surface: "#ffffff",
  text: "#1e1410",
  textMuted: "#6b5649",
  border: "#ddd4c4",
};

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
      {view === "users" && <UsersView />}
    </div>
  );
}

function DashboardView({ onNotify }: { onNotify: (msg: string, ok?: boolean) => void }) {
  const [docCount, setDocCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, usersRes] = await Promise.all([
        apiFetch<{ ok: boolean; documents: ReferenceDoc[] }>("/api/admin/reference-docs/approved"),
        apiFetch<{ ok: boolean; users: User[] }>("/api/admin/users"),
      ]);
      setDocCount(docsRes.documents.length);
      setUserCount(usersRes.users.length);
      if (docsRes.documents.length > 0) {
        const sorted = [...docsRes.documents].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLastImport(sorted[0].createdAt);
        setRecentDocs(sorted.slice(0, 5));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const formatLastImport = useMemo(() => {
    if (!lastImport) return "Aucune";
    const diff = Date.now() - new Date(lastImport).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    return `Il y a ${days}j`;
  }, [lastImport]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight" style={{ color: COLORS.text }}>
          Bonjour, Administrateur 👋
        </h1>
        <p className="mt-1 text-sm font-normal" style={{ color: COLORS.textMuted }}>
          Voici un aperçu rapide de vos tâches
        </p>
        <hr className="mt-6" style={{ borderColor: COLORS.border }} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Documents */}
        <div
          className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(30,20,16,0.08)] transition hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)]"
          style={{ borderColor: COLORS.border, borderTopWidth: "3px", borderTopColor: COLORS.primary }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#f5ece8" }}>
              <FileText className="h-5 w-5" style={{ color: COLORS.primary }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Documents de référence</p>
              <p className="text-3xl font-bold" style={{ color: COLORS.text }}>{loading ? "..." : docCount}</p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div
          className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(30,20,16,0.08)] transition hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)]"
          style={{ borderColor: COLORS.border, borderTopWidth: "3px", borderTopColor: "#3b82f6" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#eff6ff" }}>
              <UserPlus className="h-5 w-5" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Utilisateurs enregistrés</p>
              <p className="text-3xl font-bold" style={{ color: COLORS.text }}>{loading ? "..." : userCount}</p>
            </div>
          </div>
        </div>

        {/* Last Import */}
        <div
          className="rounded-xl border bg-white p-5 shadow-[0_1px_3px_rgba(30,20,16,0.08)] transition hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)]"
          style={{ borderColor: COLORS.border, borderTopWidth: "3px", borderTopColor: "#22c55e" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#f0fdf4" }}>
              <Upload className="h-5 w-5" style={{ color: "#22c55e" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Dernière importation</p>
              <p className="text-3xl font-bold" style={{ color: COLORS.text }}>{loading ? "..." : formatLastImport}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-xl border bg-white p-7 sm:p-8 shadow-[0_1px_3px_rgba(30,20,16,0.08)]" style={{ borderColor: COLORS.border }}>
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4" style={{ color: COLORS.textMuted }} />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>
            Importer un document de référence
          </p>
        </div>
        <AdminReferenceBulkUpload onUploadDone={() => {
          onNotify("Document importé avec succès ! Le fichier a été ajouté à la base de référence.", true);
          loadStats();
        }} />
      </div>

      {/* Recent Documents */}
      <div className="rounded-xl border bg-white shadow-[0_1px_3px_rgba(30,20,16,0.08)] overflow-hidden" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#f3f0ee" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: COLORS.primary }} />
            <p className="font-serif text-lg font-normal" style={{ color: COLORS.text }}>Documents de référence récents</p>
          </div>
          <button className="text-sm font-medium transition hover:opacity-75" style={{ color: COLORS.primary }}>
            Voir tous →
          </button>
        </div>
        {recentDocs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-4xl" style={{ color: `${COLORS.primary}20` }}>📭</span>
            <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Aucun document importé pour l'instant</p>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Utilisez la zone ci-dessus pour ajouter des fichiers</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: COLORS.background }}>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Nom du document</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Taille</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Importé le</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc, i) => (
                <tr
                  key={doc.id}
                  className="border-b transition hover:bg-[#faf7f4]"
                  style={{ borderColor: "#f3f0ee" }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: COLORS.text }}>📄 {doc.originalName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: COLORS.textMuted }}>
                    {Math.round(Number(doc.fileSize) / 1024)} Ko
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: COLORS.textMuted }}>
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`/api/documents/${doc.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded transition hover:bg-[#f5ece8]"
                      style={{ color: COLORS.primary }}
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ReferenceDocsView() {
  const [docs, setDocs] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ ok: boolean; documents: ReferenceDoc[] }>("/api/admin/reference-docs/approved")
      .then((res) => setDocs(res.documents))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-normal tracking-tight" style={{ color: COLORS.text }}>Documents de référence</h1>
        <p className="mt-1 text-sm" style={{ color: COLORS.textMuted }}>{docs.length} document{docs.length !== 1 ? "s" : ""} dans la base</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7d1c2a]/20 border-t-[#7d1c2a]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#ddd4c4]/50 py-16" style={{ background: COLORS.background }}>
          <CheckCircle className="h-10 w-10 text-green-500/60" />
          <p className="text-sm font-medium" style={{ color: COLORS.text }}>Aucun document dans la base</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Importez des documents depuis le tableau de bord.</p>
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
              <div key={doc.id} className="flex items-center justify-between rounded-xl border bg-white p-4 transition hover:shadow-[0_4px_16px_rgba(30,20,16,0.08)]" style={{ borderColor: COLORS.border }}>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#f5ece8" }}>
                    <FileText className="h-5 w-5" style={{ color: COLORS.primary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: COLORS.text }}>{doc.originalName}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs" style={{ color: COLORS.textMuted }}>
                      {meta?.authorName && <span>👤 {meta.authorName}</span>}
                      {meta?.subjectLabel && <span>📚 {meta.subjectLabel}</span>}
                      {meta?.department && <span>🏫 {meta.department}</span>}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: COLORS.textMuted }}>
                      {Math.round(Number(doc.fileSize) / 1024)} Ko • {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/documents/${doc.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:bg-[#f5ece8]"
                  style={{ borderColor: COLORS.border, color: COLORS.primary }}
                >
                  Voir
                </a>
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
        <h1 className="font-serif text-2xl font-normal tracking-tight" style={{ color: COLORS.text }}>Utilisateurs</h1>
        <p className="mt-1 text-sm" style={{ color: COLORS.textMuted }}>Liste des comptes enregistrés sur la plateforme</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
        <input
          type="text"
          placeholder="Rechercher par nom, INE ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#7d1c2a] focus:ring-2 focus:ring-[#7d1c2a]/20"
          style={{ borderColor: COLORS.border, background: COLORS.surface }}
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
                ? { background: COLORS.primary, color: "#fff" }
                : { background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text }
            }
          >
            {f === "all" ? "Tous" : f === "STUDENT" ? "Étudiants" : f === "TEACHER" ? "Enseignants" : "DA"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#7d1c2a]/20 border-t-[#7d1c2a]" />
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-[0_1px_3px_rgba(30,20,16,0.08)] overflow-hidden" style={{ borderColor: COLORS.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: COLORS.background }}>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Avatar</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Nom</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Email / INE</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted }}>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b transition hover:bg-[#faf7f4]"
                  style={{ borderColor: i < filteredUsers.length - 1 ? "#f3f0ee" : "transparent" }}
                >
                  <td className="px-5 py-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: "#f5ece8", color: COLORS.primary }}
                    >
                      {getInitials(user.name)}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium" style={{ color: COLORS.text }}>{user.name}</p>
                    {user.department && <p className="text-xs" style={{ color: COLORS.textMuted }}>{user.department}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm" style={{ color: COLORS.textMuted }}>{user.ine || user.email || "-"}</p>
                  </td>
                  <td className="px-5 py-3">{getRoleBadge(user.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: COLORS.textMuted }}>
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}