"use client";

import { NavRail } from "./NavRail";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <NavRail />
      <div className="main">{children}</div>
    </div>
  );
}
