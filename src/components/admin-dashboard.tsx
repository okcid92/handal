"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/frontend-api";
import { AdminLayout, type AdminView } from "./AdminLayout";
import { AdminTracker } from "./AdminTracker";

export function AdminDashboard() {
  const [userName, setUserName] = useState("Administrateur");
  const [view, setView] = useState<AdminView>("dashboard");
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ user: { name: string } }>("/api/me/overview")
      .then((res) => setUserName(res.user.name))
      .catch(() => {});
  }, []);

  function notify(msg: string, ok = true) {
    setMessage(msg || null);
    setMessageOk(ok);
    if (msg) setTimeout(() => setMessage(null), 4000);
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await apiFetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLogoutLoading(false);
    }
  }

  return (
    <AdminLayout
      view={view}
      onViewChange={setView}
      userName={userName}
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {message && (
        <div
          className={`mx-8 mt-4 flex items-start gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium ${
            messageOk
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
      <AdminTracker view={view} onNotify={notify} />
    </AdminLayout>
  );
}