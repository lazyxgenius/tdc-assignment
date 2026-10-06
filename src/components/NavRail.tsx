"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/context/DemoProvider";
import { Icon } from "./Icon";

const DISABLED = [
  { icon: "home", label: "Home" },
  { icon: "forum", label: "Feedback" },
  { icon: "monitoring", label: "Numbers" },
];

export function NavRail() {
  const pathname = usePathname();
  const { activeClient } = useDemo();
  const checkActive = pathname === "/check" || pathname === "/results";
  const clientsActive = pathname.startsWith("/clients");

  return (
    <nav className="rail" aria-label="Main">
      <Link
        href="/check"
        aria-label="Check profiles"
        aria-current={checkActive ? "page" : undefined}
        className={checkActive ? "rail-logo active" : "rail-logo"}
      >
        <Icon name="fact_check" fill={checkActive} />
      </Link>
      <span className="rail-item disabled" aria-disabled="true" title="Not in the prototype">
        <span className="rail-icon">
          <Icon name="home" />
        </span>
        <span className="rail-label">Home</span>
      </span>
      <Link
        href={`/clients/${activeClient.id}`}
        aria-current={clientsActive ? "page" : undefined}
        className={clientsActive ? "rail-item active" : "rail-item"}
      >
        <span className="rail-icon">
          <Icon name="group" fill={clientsActive} />
        </span>
        <span className="rail-label">Clients</span>
      </Link>
      {DISABLED.slice(1).map((item) => (
        <span key={item.label} className="rail-item disabled" aria-disabled="true" title="Not in the prototype">
          <span className="rail-icon">
            <Icon name={item.icon} />
          </span>
          <span className="rail-label">{item.label}</span>
        </span>
      ))}
    </nav>
  );
}
