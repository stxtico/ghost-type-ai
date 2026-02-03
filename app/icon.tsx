import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
        }}
      >
        {/* Use your ghost from public */}
        <img
          src={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/ghost-logo.png`}
          width="52"
          height="52"
        />
      </div>
    ),
    size
  );
}
