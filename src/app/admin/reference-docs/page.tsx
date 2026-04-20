"use client";

import { useState } from "react";
import { Upload, ClipboardCheck } from "lucide-react";
import { AdminReferenceBulkUpload } from "@/components/admin-reference-bulk-upload";
import { AdminStagingPanel } from "@/components/admin-staging-panel";

type Tab = "upload" | "staging";

export default function AdminReferenceDocsPage() {
  const [tab, setTab] = useState<Tab>("upload");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] to-[#f5f1e8] px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Onglets */}
        <div className="flex gap-2 rounded-2xl border border-[#7b2438]/14 bg-white p-1.5">
          {(
            [
              { id: "upload", label: "Upload", icon: Upload },
              { id: "staging", label: "Staging Area", icon: ClipboardCheck },
            ] as { id: Tab; label: string; icon: React.ElementType }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                tab === id
                  ? "bg-[#7b2438] text-white shadow-sm"
                  : "text-[#6c5448] hover:bg-[#f2d9e0]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <AdminReferenceBulkUpload onUploadDone={() => setTab("staging")} />
        ) : (
          <AdminStagingPanel />
        )}
      </div>
    </div>
  );
}
