"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useDemo } from "@/context/DemoProvider";
import { splitProfiles } from "@/lib/split";
import type { CandidateFields } from "@/lib/types";

const LEGEND = [
  { verdict: "red", icon: "block", label: "Red", text: "breaks a deal-breaker" },
  { verdict: "amber", icon: "warning", label: "Amber", text: "misses a wish" },
  { verdict: "green", icon: "check_circle", label: "Green", text: "fits" },
  { verdict: "grey", icon: "help", label: "Grey", text: "not mentioned, confirm first" },
] as const;

export default function CheckPage() {
  const router = useRouter();
  const { clients, activeClient, paste, setPaste, selectClient, setCheck } = useDemo();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profiles = splitProfiles(paste);
  const count = profiles.length;
  const dealBreakers = activeClient.preferences.filter((item) => item.kind === "dealbreaker");
  const wishes = activeClient.preferences.filter((item) => item.kind === "wish");

  async function onCheck() {
    if (count === 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles }),
      });
      const data = (await response.json()) as {
        error?: string;
        model?: string;
        ms?: number;
        candidates?: Array<{ displayName: string } & CandidateFields>;
      };
      if (!response.ok || !data.candidates || data.model == null || data.ms == null) {
        setError(data.error || "Couldn't read the profiles right now. Please try again.");
        return;
      }
      setCheck({
        clientId: activeClient.id,
        model: data.model,
        ms: data.ms,
        people: data.candidates.map((candidate) => {
          const { displayName, ...fields } = candidate;
          return { displayName, fields };
        }),
      });
      router.push("/results");
    } catch {
      setError("Couldn't read the profiles right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <span className="icon-button disabled" aria-disabled="true" title="Not in the prototype">
          <Icon name="arrow_back" />
        </span>
        <h1>Check profiles before sending</h1>
      </header>

      <div className="split">
        <section className="stack">
          <div className="field">
            <label htmlFor="client">Client</label>
            <div className="field-box accent">
              <select
                id="client"
                value={activeClient.id}
                onChange={(event) => selectClient(event.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} · {client.age} · {client.city}
                  </option>
                ))}
              </select>
              <Icon name="arrow_drop_down" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="profiles">Candidate profiles</label>
            <textarea
              id="profiles"
              rows={14}
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
            />
            <p className="help">
              Paste any format: biodata text, portal profile or WhatsApp forward. Separate profiles with a line of ---.
            </p>
          </div>

          <div className="actions">
            <button type="button" className="btn-primary" onClick={onCheck} disabled={count === 0 || loading}>
              <Icon name="fact_check" size={20} />
              {loading ? "Checking…" : `Check ${count} ${count === 1 ? "profile" : "profiles"}`}
            </button>
            <button type="button" className="btn-outline disabled" disabled title="Not in the prototype">
              <Icon name="upload_file" size={20} />
              Upload biodata PDF
            </button>
          </div>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="note">
            <Icon name="shield_person" size={20} />
            <span>Names, phone numbers and emails are removed before any text is read. Only the standard profile fields are pulled out.</span>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-head">
            <h2>Checking against {activeClient.shortName}&apos;s card</h2>
            <Link href={`/clients/${activeClient.id}`}>Edit</Link>
          </div>
          <div>
            <p className="kicker">Deal-breakers</p>
            <div className="chips">
              {dealBreakers.map((item) => (
                <span key={item.id} className="chip solid">
                  {item.chip}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="kicker">Wishes</p>
            <div className="chips">
              {wishes.map((item) => (
                <span key={item.id} className="chip soft">
                  {item.chip}
                </span>
              ))}
            </div>
          </div>
          <div className="legend">
            <p className="kicker">What you&apos;ll get</p>
            <ul>
              {LEGEND.map((item) => (
                <li key={item.verdict}>
                  <Icon name={item.icon} fill size={20} className={`tone-${item.verdict}`} />
                  <span className={`legend-${item.verdict}`}>
                    <b>{item.label}</b> · {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
