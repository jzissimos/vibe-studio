"use client";
import { ReactNode } from "react";
import { fal } from "@fal-ai/client";
fal.config({ proxyUrl: "/api/fal/proxy" });
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
