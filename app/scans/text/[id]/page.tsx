import AppShell from "@/app/_components/AppShell";
import ScanTextDetailClient from "./scanTextDetailClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <ScanTextDetailClient id={id} />
    </AppShell>
  );
}
