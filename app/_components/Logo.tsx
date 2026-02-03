"use client";

import React from "react";

export default function Logo({
  className,
  title = "Ghost Typer",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 256 256"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ghost silhouette */}
      <path
        d="M128 26
           C82 26, 48 60, 48 106
           V206
           c0 10 11 15 19 9
           l22-16 18 12
           c7 5 16 5 23 0
           l18-12 22 16
           c8 6 19 1 19-9
           V106
           c0-46-34-80-80-80Z"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <path
        d="M152 104
           c12 0 22 7 22 18
           c0 2-1 3-3 3
           c-10 0-19-3-27-9
           c-2-2-3-4-2-6
           c2-4 6-6 10-6Z"
        fill="currentColor"
      />
      <path
        d="M104 104
           c-12 0-22 7-22 18
           c0 2 1 3 3 3
           c10 0 19-3 27-9
           c2-2 3-4 2-6
           c-2-4-6-6-10-6Z"
        fill="currentColor"
      />
    </svg>
  );
}
