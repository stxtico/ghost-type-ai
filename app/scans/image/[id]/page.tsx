import ScanImageDetailClient from "./scanImageDetailClient";

export default function ScanImageDetailPage({ params }: { params: { id: string } }) {
  return <ScanImageDetailClient id={params.id} />;
}
