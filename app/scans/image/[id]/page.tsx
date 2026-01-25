import ScanImageDetailClient from "./scanImageDetailClient";

export default function Page({ params }: { params: { id: string } }) {
  return <ScanImageDetailClient id={params.id} />;
}
