"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useDemo } from "@/context/DemoProvider";
import { countKinds, evaluateCandidate, sendReadyLine, type Evaluated, type Row } from "@/lib/rules";
import type { RuleStatus, Verdict } from "@/lib/types";

type Filter = "all" | Verdict;

const FILTERS: Array<{ id: Filter; label: string; icon?: string }> = [
  { id: "all", label: "All" },
  { id: "green", label: "Green", icon: "check_circle" },
  { id: "amber", label: "Amber", icon: "warning" },
  { id: "red", label: "Red", icon: "block" },
  { id: "grey", label: "Grey", icon: "help" },
];

function took(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}

function Summary({ text, emphasis }: { text: string; emphasis: string | null }) {
  if (!emphasis || !text.includes(emphasis)) return text;
  const index = text.indexOf(emphasis);
  return (
    <>
      {text.slice(0, index)}
      <b>{emphasis}</b>
      {text.slice(index + emphasis.length)}
    </>
  );
}

function Status({ status }: { status: RuleStatus }) {
  if (status === "met") {
    return (
      <span className="status met">
        <Icon name="check" size={18} />
        Met
      </span>
    );
  }
  if (status === "missed") {
    return (
      <span className="status missed">
        <Icon name="close" size={18} />
        Missed
      </span>
    );
  }
  return (
    <span className="status unknown">
      <Icon name="help" size={18} />
      Unknown
    </span>
  );
}

function DetailTable({ rows, wantsLabel }: { rows: Row[]; wantsLabel: string }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Preference</th>
            <th>{wantsLabel}</th>
            <th>Profile says</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.status === "missed" ? "miss" : undefined}>
              <td>
                {row.label}{" "}
                <span className="muted">· {row.kind === "dealbreaker" ? "deal-breaker" : "wish"}</span>
              </td>
              <td>{row.wants}</td>
              <td className={row.profileSays === "Not mentioned" ? "muted" : undefined}>{row.profileSays}</td>
              <td>
                <Status status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardActions({ item }: { item: Evaluated }) {
  if (item.verdict === "green") {
    return (
      <button type="button" className="btn-filled disabled" disabled title="Not in the prototype">
        <Icon name="add" size={18} />
        Add to email
      </button>
    );
  }
  if (item.verdict === "red") {
    return (
      <>
        <button type="button" className="btn-text disabled" disabled title="Not in the prototype">
          Override (logged)
        </button>
        <button type="button" className="btn-outline disabled" disabled title="Not in the prototype">
          Skip
        </button>
      </>
    );
  }
  if (item.verdict === "grey") {
    return (
      <>
        <button type="button" className="btn-text disabled" disabled title="Not in the prototype">
          Skip
        </button>
        <button type="button" className="btn-outline disabled" disabled title="Not in the prototype">
          <Icon name="task_alt" size={18} />
          Mark as confirmed
        </button>
      </>
    );
  }
  return null;
}

export default function ResultsPage() {
  const router = useRouter();
  const { clients, check } = useDemo();
  const client = clients.find((item) => item.id === check?.clientId);
  const [filter, setFilter] = useState<Filter>("all");

  const evaluated = useMemo(() => {
    if (!check || !client) return [];
    return check.people.map((person, index) =>
      evaluateCandidate(
        person.fields,
        person.displayName,
        client.preferences,
        client.pronoun,
        `${index}-${person.displayName}`,
      ),
    );
  }, [check, client]);

  const signature = evaluated.map((item) => `${item.key}:${item.verdict}`).join("|");
  const defaultOpen = evaluated.find((item) => item.verdict === "amber")?.key ?? null;
  const [openKey, setOpenKey] = useState<string | null>(defaultOpen);
  const [seenSignature, setSeenSignature] = useState(signature);
  if (seenSignature !== signature) {
    setSeenSignature(signature);
    setOpenKey(defaultOpen);
  }

  useEffect(() => {
    if (!check) router.replace("/check");
  }, [check, router]);

  if (!check || !client) return null;

  const counts = countKinds(client.preferences);
  const visible = filter === "all" ? evaluated : evaluated.filter((item) => item.verdict === filter);
  const tally = {
    all: evaluated.length,
    green: evaluated.filter((item) => item.verdict === "green").length,
    amber: evaluated.filter((item) => item.verdict === "amber").length,
    red: evaluated.filter((item) => item.verdict === "red").length,
    grey: evaluated.filter((item) => item.verdict === "grey").length,
  };
  const ready = sendReadyLine(evaluated);
  const colon = ready.indexOf(":");
  const candidatePronoun = client.pronoun === "she" ? "He" : "She";
  const wantsLabel = client.pronoun === "she" ? "She wants" : "He wants";

  return (
    <div className="wrap">
      <header className="page-header">
        <Link href="/check" className="icon-button" aria-label="Back to profiles">
          <Icon name="arrow_back" />
        </Link>
        <div>
          <h1>
            {evaluated.length} {evaluated.length === 1 ? "profile" : "profiles"} checked for {client.name}
          </h1>
          <p className="sub">
            Against {counts.dealbreakers} deal-breakers and {counts.wishes} wishes · took {took(check.ms)}
          </p>
        </div>
      </header>

      <div className="filters" role="group" aria-label="Filter by result">
        {FILTERS.map((item) => {
          const pressed = filter === item.id;
          const count = tally[item.id];
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={pressed}
              className={pressed ? "filter on" : "filter"}
              onClick={() => setFilter(item.id)}
            >
              {item.id === "all" ? (
                pressed ? <Icon name="check" size={18} /> : null
              ) : (
                <Icon name={item.icon ?? "help"} fill size={18} className={`tone-${item.id}`} />
              )}
              {item.id === "all" ? `All ${count}` : `${count} ${item.label}`}
            </button>
          );
        })}
      </div>

      {visible.map((item) => {
        const open = openKey === item.key;
        const heading = [item.displayName, item.age != null ? String(item.age) : null].filter(Boolean).join(", ");
        return (
          <article key={item.key} className="result">
            <div className="result-head">
              <span className={`badge ${item.verdict}`}>
                <Icon
                  name={
                    item.verdict === "green"
                      ? "check_circle"
                      : item.verdict === "amber"
                        ? "warning"
                        : item.verdict === "red"
                          ? "block"
                          : "help"
                  }
                  fill
                  size={18}
                  className={`tone-${item.verdict}`}
                />
                {item.title}
              </span>
              <div className="result-copy">
                <h2>
                  {heading}
                  {item.city ? ` · ${item.city}` : ""}
                </h2>
                <p>
                  <Summary text={item.summary} emphasis={item.emphasis} />
                </p>
              </div>
              <button type="button" className="btn-text" onClick={() => setOpenKey(open ? null : item.key)}>
                {open ? "Hide details" : "Show details"}
              </button>
              <CardActions item={item} />
            </div>
            {open ? (
              <div className="result-body">
                <DetailTable rows={item.rows} wantsLabel={wantsLabel} />
                {item.verdict === "amber" ? (
                  <>
                    <div className="field stretch">
                      <label htmlFor={`why-${item.key}`}>Why meet anyway (goes in the email)</label>
                      <textarea
                        id={`why-${item.key}`}
                        rows={2}
                        disabled
                        readOnly
                        value={`${candidatePronoun} is already planning a move to Delhi NCR, and you both put family and long weekends in the hills first.`}
                      />
                      <p className="help">Stretch note: not in the prototype.</p>
                    </div>
                    <div className="actions">
                      <button type="button" className="btn-filled disabled" disabled title="Not in the prototype">
                        <Icon name="add" size={18} />
                        Send as a stretch
                      </button>
                      <button type="button" className="btn-text disabled" disabled title="Not in the prototype">
                        Skip
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}

      <div className="ready-bar">
        <Icon name="mail" />
        <p>
          {colon >= 0 ? (
            <>
              <b>{ready.slice(0, colon + 1)}</b>
              {ready.slice(colon + 1)}
            </>
          ) : (
            ready
          )}
        </p>
        <button type="button" className="btn-filled disabled" disabled title="Not in the prototype">
          <Icon name="edit" size={20} />
          Create email
        </button>
      </div>
    </div>
  );
}
