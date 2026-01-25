"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SavedImageSavedPage() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/scans/image");
  }, [r]);
  return null;
}
