"use client";

import { useState } from "react";
import { Upload, ClipboardCheck } from "lucide-react";
import { AdminReferenceBulkUpload } from "@/components/admin-reference-bulk-upload";
import { AdminStagingPanel } from "@/components/admin-staging-panel";

type Tab = "upload" | "staging";

export default function AdminReferenceDocsPage() {
  const [tab, setTab] = useState<Tab>("upload");
  const [stagingKey, setStagingKey] = useState(0);

  return (
    <div className="app-shell min-h-screen px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Tabs */}
        <div className="section-frame flex gap-2 rounded-2xl p-1.5">
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
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                tab === id
                  ? "btn-primary border-[#7b2438] text-white"
                  : "btn-secondary text-[#6c5448]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <AdminReferenceBulkUpload
            onUploadDone={() => {
              setStagingKey((k) => k + 1);
              setTab("staging");
            }}
          />
        ) : (
          <AdminStagingPanel key={stagingKey} />
        )}
      </div>
    </div>
  );
}
