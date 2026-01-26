import AppShell from "@/app/_components/AppShell";
import ScanImageDetailClient from "./scanImageDetailClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <ScanImageDetailClient id={id} />
    </AppShell>
  );
}
