"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ScansIndex() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/scans/text");
  }, [r]);
  return null;
}
