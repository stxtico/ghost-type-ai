"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SavedTextRedirect() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/scans?type=text");
  }, [r]);
  return null;
}
