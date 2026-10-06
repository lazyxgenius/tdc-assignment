"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useDemo } from "@/context/DemoProvider";
import type { Kind, Preference } from "@/lib/types";

function signature(items: Preference[]): string {
  return items.map((item) => `${item.id}:${item.kind}`).join("|");
}

function Segment({
  label,
  kind,
  onChange,
}: {
  label: string;
  kind: Kind;
  onChange: (kind: Kind) => void;
}) {
  return (
    <div className="segment" role="radiogroup" aria-label={`${label}: type`}>
      <button type="button" role="radio" aria-checked={kind === "dealbreaker"} onClick={() => onChange("dealbreaker")}>
        {kind === "dealbreaker" ? <Icon name="check" size={18} /> : null}
        Deal-breaker
      </button>
      <button type="button" role="radio" aria-checked={kind === "wish"} onClick={() => onChange("wish")}>
        {kind === "wish" ? <Icon name="check" size={18} /> : null}
        Wish
      </button>
    </div>
  );
}

function PreferenceList({
  items,
  onChange,
}: {
  items: Array<{ item: Preference; index: number }>;
  onChange: (id: string, kind: Kind) => void;
}) {
  if (items.length === 0) {
    return <p className="empty-group">None in this group.</p>;
  }
  return (
    <ul className="pref-list">
      {items.map(({ item }) => (
        <li key={item.id}>
          <div>
            <p className="pref-label">{item.label}</p>
            <p className="pref-value">{item.wantsText}</p>
          </div>
          <Segment label={item.label} kind={item.kind} onChange={(kind) => onChange(item.id, kind)} />
        </li>
      ))}
    </ul>
  );
}

export default function CardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const { clients, check, saveCard, resetDemo, notice, clearNotice } = useDemo();
  const client = clients.find((item) => item.id === id);
  const savedKey = client ? signature(client.preferences) : "";
  const [draft, setDraft] = useState<Preference[]>(() => client?.preferences ?? []);
  const [seenKey, setSeenKey] = useState(savedKey);

  useEffect(() => {
    if (!client) router.replace("/check");
  }, [client, router]);

  if (client && seenKey !== savedKey) {
    setSeenKey(savedKey);
    setDraft(client.preferences);
  }

  if (!client) return null;

  const indexed = draft.map((item, index) => ({ item, index }));
  const dealBreakers = indexed.filter(({ item }) => item.kind === "dealbreaker");
  const wishes = indexed.filter(({ item }) => item.kind === "wish");
  const dirty = signature(draft) !== signature(client.preferences);
  const pronoun = client.pronoun === "she" ? "her" : "his";
  const showResultsLink = check?.clientId === client.id;

  function setKind(prefId: string, kind: Kind) {
    clearNotice();
    setDraft((current) => current.map((item) => (item.id === prefId ? { ...item, kind } : item)));
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <Link href="/check" className="icon-button" aria-label="Back to check profiles">
          <Icon name="arrow_back" />
        </Link>
        <div className="grow">
          <h1>{client.name} · Preference card</h1>
          <p className="sub">
            {client.age} · {client.city} · {client.since}
          </p>
        </div>
        <button
          type="button"
          className="btn-text"
          onClick={() => {
            clearNotice();
            setDraft(client.preferences);
          }}
        >
          Discard
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => saveCard(client.id, draft)}
        >
          <Icon name="save" size={18} />
          Save card
        </button>
      </header>

      {dirty ? (
        <div className="note" role="status">
          <Icon name="info" size={20} />
          <span>Unsaved changes. Nothing is stored until you save the card.</span>
        </div>
      ) : null}

      {notice && !dirty ? (
        <div className="note saved" role="status">
          <Icon name="check_circle" size={20} />
          <span>
            {notice}{" "}
            {showResultsLink ? <Link href="/results">Back to results</Link> : null}
          </span>
        </div>
      ) : null}

      <div className="note">
        <Icon name="info" size={20} />
        <span>
          {client.cardNote} Mark each item as a <b>deal-breaker</b> (never break) or a <b>wish</b> (can stretch).
        </span>
      </div>

      <div className="split">
        <div className="stack">
          <section className="group">
            <div className="group-head">
              <Icon name="block" fill className="tone-red" />
              <h2>Deal-breakers</h2>
              <span>Never sent if broken</span>
            </div>
            <PreferenceList items={dealBreakers} onChange={setKind} />
          </section>

          <section className="group">
            <div className="group-head">
              <Icon name="tune" className="tone-tertiary" />
              <h2>Wishes</h2>
              <span>Can stretch, with a reason</span>
            </div>
            <PreferenceList items={wishes} onChange={setKind} />
            <div className="group-foot">
              <button type="button" className="btn-text disabled" disabled title="Not in the prototype">
                <Icon name="add" size={18} />
                Add a preference
              </button>
            </div>
          </section>
        </div>

        <aside className="stack side">
          <section className="pattern" title="Not in the prototype">
            <div className="pattern-title">
              <Icon name="lightbulb" className="tone-primary" />
              <h2>Pattern from {pronoun} feedback</h2>
            </div>
            <p>
              Height came up in <b>3 of {pronoun} last 5</b> rejections, all under 5′10″.
            </p>
            <p className="muted">Worth asking on your next call. The card only changes if you change it.</p>
            <div className="actions">
              <button type="button" disabled>
                Add to call notes
              </button>
              <button type="button" disabled>
                Dismiss
              </button>
            </div>
          </section>

          <section className="glance">
            <div className="glance-head">
              <h2>Card at a glance</h2>
              {client.glance ? <span className="sample-tag">Sample data</span> : null}
            </div>
            <div className="glance-rows">
              <div>
                <span>Deal-breakers</span>
                <span>{dealBreakers.length}</span>
              </div>
              <div>
                <span>Wishes</span>
                <span>{wishes.length}</span>
              </div>
              {client.glance ? (
                <>
                  <div>
                    <span>Profiles checked with this card</span>
                    <span>{client.glance.checked}</span>
                  </div>
                  <div>
                    <span>Accepted</span>
                    <span>
                      {client.glance.accepted} ({client.glance.percent}%)
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <button type="button" className="quiet" onClick={resetDemo}>
            Reset demo data
          </button>
        </aside>
      </div>
    </div>
  );
}
