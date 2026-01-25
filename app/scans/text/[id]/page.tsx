import ScanTextDetailClient from "./scanTextDetailClient";

export default function Page({ params }: { params: { id: string } }) {
  return <ScanTextDetailClient id={params.id} />;
}
