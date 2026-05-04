"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminReferenceDocsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard with reference-docs view
    router.replace("/admin?view=reference-docs");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7b2438]/20 border-t-[#7b2438] mx-auto mb-4" />
        <p className="text-sm text-[#6c5448]">Redirection...</p>
      </div>
    </div>
  );
}

