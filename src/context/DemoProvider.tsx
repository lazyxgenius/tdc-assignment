"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { clientById, freshClients } from "@/data/mock";
import type { CandidateFields, Client, Kind, Preference } from "@/lib/types";

const STORAGE_KEY = "tdc-pre-send-cards";

export type CheckedPerson = {
  displayName: string;
  fields: CandidateFields;
};

export type CheckRun = {
  clientId: string;
  ms: number;
  model: string;
  people: CheckedPerson[];
};

type StoredKinds = Record<string, Record<string, Kind>>;

type DemoContextValue = {
  clients: Client[];
  activeClient: Client;
  paste: string;
  setPaste: (value: string) => void;
  selectClient: (id: string) => void;
  saveCard: (clientId: string, preferences: Preference[]) => void;
  resetDemo: () => void;
  notice: string | null;
  clearNotice: () => void;
  check: CheckRun | null;
  setCheck: (check: CheckRun | null) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRaw(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function parseKinds(raw: string): StoredKinds | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as StoredKinds;
  } catch {
    return null;
  }
}

function applyKinds(list: Client[], stored: StoredKinds | null): Client[] {
  if (!stored) return list;
  return list.map((client) => {
    const kinds = stored[client.id];
    if (!kinds) return client;
    return {
      ...client,
      preferences: client.preferences.map((item) => {
        const kind = kinds[item.id];
        return kind === "dealbreaker" || kind === "wish" ? { ...item, kind } : item;
      }),
    };
  });
}

function kindsFrom(list: Client[]): StoredKinds {
  const stored: StoredKinds = {};
  for (const client of list) {
    stored[client.id] = {};
    for (const item of client.preferences) stored[client.id]![item.id] = item.kind;
  }
  return stored;
}

function persist(kinds: StoredKinds | null): boolean {
  try {
    if (kinds == null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(kinds));
    return true;
  } catch {
    return false;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const storedRaw = useSyncExternalStore(subscribe, readRaw, () => "");
  const [fallback, setFallback] = useState<StoredKinds | null>(null);
  const [activeClientId, setActiveClientId] = useState("ananya");
  const [paste, setPaste] = useState(() => freshClients()[0]?.sampleProfiles ?? "");
  const [check, setCheck] = useState<CheckRun | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const clients = useMemo(
    () => applyKinds(freshClients(), fallback ?? parseKinds(storedRaw)),
    [fallback, storedRaw],
  );

  const activeClient = clientById(clients, activeClientId) ?? clients[0]!;

  const value = useMemo<DemoContextValue>(
    () => ({
      clients,
      activeClient,
      paste,
      setPaste,
      selectClient: (id: string) => {
        const next = clientById(clients, id);
        if (!next) return;
        setActiveClientId(id);
        setPaste(next.sampleProfiles);
        setNotice(null);
      },
      saveCard: (clientId: string, preferences: Preference[]) => {
        const next = clients.map((client) =>
          client.id === clientId ? { ...client, preferences } : client,
        );
        const kinds = kindsFrom(next);
        if (persist(kinds)) {
          setFallback(null);
          emit();
        } else {
          setFallback(kinds);
        }
        setNotice("Card saved. Results will update.");
      },
      resetDemo: () => {
        const next = freshClients();
        if (persist(null)) {
          setFallback(null);
          emit();
        } else {
          setFallback(kindsFrom(next));
        }
        setCheck(null);
        setNotice(null);
        const client = clientById(next, activeClientId) ?? next[0]!;
        setActiveClientId(client.id);
        setPaste(client.sampleProfiles);
      },
      notice,
      clearNotice: () => setNotice(null),
      check,
      setCheck,
    }),
    [activeClient, activeClientId, check, clients, notice, paste],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
