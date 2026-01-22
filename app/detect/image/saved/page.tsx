"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SavedImageRedirect() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/scans?type=image");
  }, [r]);
  return null;
}
