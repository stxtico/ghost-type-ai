import AppShell from "@/app/_components/AppShell";
import ScanTextDetailClient from "./scanTextDetailClient";

type Ctx = { params: Promise<{ id: string }> };

export default async function Page(ctx: Ctx) {
  const { id } = await ctx.params;

  return (
    <AppShell>
      <ScanTextDetailClient id={id} />
    </AppShell>
  );
}
