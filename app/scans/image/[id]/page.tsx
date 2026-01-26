import AppShell from "@/app/_components/AppShell";
import ScanImageDetailClient from "./scanImageDetailClient";

type Ctx = { params: Promise<{ id: string }> };

export default async function Page(ctx: Ctx) {
  const { id } = await ctx.params;

  return (
    <AppShell>
      <ScanImageDetailClient id={id} />
    </AppShell>
  );
}
