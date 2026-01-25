"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SavedTextSavedPage() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/scans/text");
  }, [r]);
  return null;
}
