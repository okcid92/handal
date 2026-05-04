"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText,
  UserPlus,
  Upload,
  Search,
  ChevronRight,
  Eye,
  X,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/frontend-api";
import type { AdminView } from "./AdminLayout";
import { AdminReferenceBulkUpload } from "./admin-reference-bulk-upload";

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
  stagingMetadata: unknown;
};

const BRAND = "#6c5448";

type Props = {
  view: AdminView;
  onNotify: (msg: string, ok?: boolean) => void;
};

export function AdminTracker({ view, onNotify }: Props) {
  return (
    <div className="p-8">
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
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
          Bonjour, Administrateur 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
          Voici un aperçu rapide de vos tâches
        </p>
        <hr className="mt-6" style={{ borderColor: "#e8e0db" }} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Documents */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          style={{ borderColor: "#e8e0db", borderTopWidth: "3px", borderTopColor: BRAND }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${BRAND}10` }}>
              <FileText className="h-5 w-5" style={{ color: BRAND }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Documents de référence</p>
              <p className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>{loading ? "..." : docCount}</p>
            </div>
          </div>
        </div>

        {/* Users */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          style={{ borderColor: "#e8e0db", borderTopWidth: "3px", borderTopColor: "#3b82f6" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#3b82f610" }}>
              <UserPlus className="h-5 w-5" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Utilisateurs enregistrés</p>
              <p className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>{loading ? "..." : userCount}</p>
            </div>
          </div>
        </div>

        {/* Last Import */}
        <div
          className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          style={{ borderColor: "#e8e0db", borderTopWidth: "3px", borderTopColor: "#22c55e" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "#22c55e10" }}>
              <Upload className="h-5 w-5" style={{ color: "#22c55e" }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Dernière importation</p>
              <p className="text-3xl font-bold" style={{ color: "#1a1a1a" }}>{loading ? "..." : formatLastImport}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="rounded-xl border bg-white p-8 shadow-sm" style={{ borderColor: "#e8e0db" }}>
        <div className="mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4" style={{ color: "#9ca3af" }} />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
            Importer un document de référence
          </p>
        </div>
        <AdminReferenceBulkUpload onUploadDone={() => {
          onNotify("Document importé avec succès !", true);
          loadStats();
        }} />
      </div>

      {/* Recent Documents */}
      <div className="rounded-xl border bg-white shadow-sm" style={{ borderColor: "#e8e0db" }}>
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "#f3f0ee" }}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: BRAND }} />
            <p className="font-bold" style={{ color: "#1a1a1a" }}>Documents de référence récents</p>
          </div>
          <button className="text-sm font-semibold transition hover:opacity-75" style={{ color: BRAND }}>
            Voir tous →
          </button>
        </div>
        {recentDocs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-4xl" style={{ color: `${BRAND}20` }}>📭</span>
            <p className="text-sm" style={{ color: "#6b7280" }}>Aucun document importé pour l'instant</p>
            <p className="text-xs" style={{ color: "#9ca3af" }}>Utilisez la zone ci-dessus pour ajouter des fichiers</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#faf7f5" }}>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Nom du document</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Taille</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Importé le</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((doc, i) => (
                <tr
                  key={doc.id}
                  className="border-b transition hover:bg-[#faf7f5]"
                  style={{ borderColor: "#f3f0ee" }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>📄 {doc.originalName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "#6b7280" }}>
                    {Math.round(Number(doc.fileSize) / 1024)} Ko
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "#6b7280" }}>
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`/api/documents/${doc.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded transition hover:bg-[#6c5448]/10"
                      style={{ color: BRAND }}
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
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Documents de référence</h1>
        <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>{docs.length} document{docs.length !== 1 ? "s" : ""} dans la base</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6c5448]/20 border-t-[#6c5448]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#6c5448]/15 py-16">
          <CheckCircle className="h-10 w-10 text-green-500/60" />
          <p className="text-sm font-bold" style={{ color: "#1a1a1a" }}>Aucun document dans la base</p>
          <p className="text-xs" style={{ color: "#6b7280" }}>Importez des documents depuis le tableau de bord.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-xl border bg-white p-4" style={{ borderColor: "#e8e0db" }}>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" style={{ color: BRAND }} />
                <div>
                  <p className="font-semibold" style={{ color: "#1a1a1a" }}>{doc.originalName}</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>
                    {Math.round(Number(doc.fileSize) / 1024)} Ko • {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <a
                href={`/api/documents/${doc.id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-[#faf7f5]"
                style={{ borderColor: "#e8e0db", color: BRAND }}
              >
                Voir
              </a>
            </div>
          ))}
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
        <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>Utilisateurs</h1>
        <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>Liste des comptes enregistrés sur la plateforme</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#9ca3af" }} />
        <input
          type="text"
          placeholder="Rechercher par nom, INE ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#6c5448] focus:ring-2 focus:ring-[#6c5448]/20"
          style={{ borderColor: "#e8e0db" }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "STUDENT", "TEACHER", "DA"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition"
            style={
              filter === f
                ? { background: BRAND, color: "#fff" }
                : { background: "#fff", border: "1px solid #e8e0db", color: "#4b5563" }
            }
          >
            {f === "all" ? "Tous" : f === "STUDENT" ? "Étudiants" : f === "TEACHER" ? "Enseignants" : "DA"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#6c5448]/20 border-t-[#6c5448]" />
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: "#e8e0db" }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: "#faf7f5" }}>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Avatar</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Nom</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Email / INE</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>Rôle</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b transition hover:bg-[#faf7f5]"
                  style={{ borderColor: i < filteredUsers.length - 1 ? "#f3f0ee" : "transparent" }}
                >
                  <td className="px-5 py-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: `${BRAND}15`, color: BRAND }}
                    >
                      {getInitials(user.name)}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{user.name}</p>
                    {user.department && <p className="text-xs" style={{ color: "#6b7280" }}>{user.department}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm" style={{ color: "#6b7280" }}>{user.ine || user.email || "-"}</p>
                  </td>
                  <td className="px-5 py-3">{getRoleBadge(user.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: "#6b7280" }}>
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}