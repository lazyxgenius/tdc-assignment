import type { Client, Preference } from "@/lib/types";

export const MATCHMAKER = "Kavya";

const ANANYA_PROFILES = `Vikram, 35, Noida. Senior consultant, MBA. Non-smoker, vegetarian. Never married. 5′11″. Would love to have kids someday.
---
Rohan, 34, Bengaluru. Product designer, M.Des. Doesn't smoke. Never married. 6′0″. Wants children. Plans to move to Delhi NCR in 1–2 years.
---
Karan, 32, Gurugram. Investment banker, MBA. Smokes occasionally. Never married. 5′10″. Wants a family.
---
Sameer, 36, Delhi. Architect, M.Arch. Non-smoker. Never married. 5′9″. Loves travel and cooking.`;

const ISHITA_PROFILES = `Arjun, 32, Singapore. Software engineer, MS. Non-smoker. Never married. 5′10″. Plays cricket on weekends.
---
Nikhil, 31, Mumbai. Management consultant, MBA. Doesn't smoke. Never married. 5′11″. Open to relocating to Singapore next year.
---
Rahul, 33, Singapore. Financial analyst, MBA. Smokes occasionally. Never married. 5′9″.`;

const DEV_PROFILES = `Meera, 31, Bengaluru. Product manager, MBA. Non-smoker, vegetarian. Wants children. Never married.
---
Anika, 30, Mumbai. Graphic designer, B.Des. Doesn't smoke. Vegetarian. Wants kids. Never married.
---
Riya, 33, Bengaluru. Doctor, MD. Non-smoker, vegetarian. Never married. Loves hiking and classical music.`;

const ananyaPreferences: Preference[] = [
  {
    id: "smoking",
    label: "Smoking",
    wantsText: "Never",
    asks: "Never",
    chip: "Non-smoker",
    kind: "dealbreaker",
    rule: { type: "smoking" },
  },
  {
    id: "children",
    label: "Children",
    wantsText: "Wants children",
    asks: "Wants children",
    chip: "Wants children",
    kind: "dealbreaker",
    rule: { type: "children" },
  },
  {
    id: "age",
    label: "Age",
    wantsText: "30 to 38",
    asks: "30 to 38",
    chip: "Age 30–38",
    kind: "dealbreaker",
    rule: { type: "ageRange", min: 30, max: 38 },
  },
  {
    id: "marital",
    label: "Marital status",
    wantsText: "Never married",
    asks: "Never married",
    chip: "Never married",
    kind: "dealbreaker",
    rule: { type: "marital", allowed: ["never_married"] },
  },
  {
    id: "height",
    label: "Height",
    wantsText: "5′9″ or taller",
    asks: "5′9″ or taller",
    chip: "5′9″+",
    kind: "wish",
    rule: { type: "minHeight", inches: 69 },
  },
  {
    id: "location",
    label: "Location",
    wantsText: "Delhi NCR (open to moving later)",
    asks: "Delhi NCR",
    chip: "Delhi NCR",
    kind: "wish",
    rule: { type: "location", allowedCities: ["Delhi NCR"] },
  },
  {
    id: "education",
    label: "Education",
    wantsText: "Postgraduate",
    asks: "Postgraduate",
    chip: "Postgraduate",
    kind: "wish",
    rule: { type: "minEducation", level: "postgraduate" },
  },
  {
    id: "diet",
    label: "Diet",
    wantsText: "Vegetarian preferred",
    asks: "Vegetarian",
    chip: "Vegetarian",
    kind: "wish",
    rule: { type: "diet", allowed: ["vegetarian"] },
  },
];

export const clients: Client[] = [
  {
    id: "ananya",
    name: "Ananya S.",
    shortName: "Ananya",
    age: 31,
    city: "Gurugram",
    pronoun: "she",
    since: "Partner Search client since July",
    cardNote: "Built from her intake form and portal preferences (updated 12 Sep).",
    sampleProfiles: ANANYA_PROFILES,
    glance: { checked: 23, accepted: 9, percent: 39 },
    preferences: ananyaPreferences,
  },
  {
    id: "ishita",
    name: "Ishita K.",
    shortName: "Ishita",
    age: 29,
    city: "Singapore",
    pronoun: "she",
    since: "Partner Search client since March",
    cardNote: "Built from her intake form and portal preferences (updated 3 Aug).",
    sampleProfiles: ISHITA_PROFILES,
    preferences: [
      {
        id: "smoking",
        label: "Smoking",
        wantsText: "Never",
        asks: "Never",
        chip: "Non-smoker",
        kind: "dealbreaker",
        rule: { type: "smoking" },
      },
      {
        id: "age",
        label: "Age",
        wantsText: "29 to 37",
        asks: "29 to 37",
        chip: "Age 29–37",
        kind: "dealbreaker",
        rule: { type: "ageRange", min: 29, max: 37 },
      },
      {
        id: "marital",
        label: "Marital status",
        wantsText: "Never married",
        asks: "Never married",
        chip: "Never married",
        kind: "dealbreaker",
        rule: { type: "marital", allowed: ["never_married"] },
      },
      {
        id: "location",
        label: "Location",
        wantsText: "Singapore or open to relocating there",
        asks: "Singapore",
        chip: "Singapore",
        kind: "wish",
        rule: { type: "location", allowedCities: ["Singapore"] },
      },
      {
        id: "education",
        label: "Education",
        wantsText: "Postgraduate",
        asks: "Postgraduate",
        chip: "Postgraduate",
        kind: "wish",
        rule: { type: "minEducation", level: "postgraduate" },
      },
      {
        id: "height",
        label: "Height",
        wantsText: "5′8″ or taller",
        asks: "5′8″ or taller",
        chip: "5′8″+",
        kind: "wish",
        rule: { type: "minHeight", inches: 68 },
      },
    ],
  },
  {
    id: "dev",
    name: "Dev P.",
    shortName: "Dev",
    age: 36,
    city: "Bengaluru",
    pronoun: "he",
    since: "Partner Search client since January",
    cardNote: "Built from his intake form and portal preferences (updated 21 Jun).",
    sampleProfiles: DEV_PROFILES,
    preferences: [
      {
        id: "children",
        label: "Children",
        wantsText: "Wants children",
        asks: "Wants children",
        chip: "Wants children",
        kind: "dealbreaker",
        rule: { type: "children" },
      },
      {
        id: "age",
        label: "Age",
        wantsText: "29 to 36",
        asks: "29 to 36",
        chip: "Age 29–36",
        kind: "dealbreaker",
        rule: { type: "ageRange", min: 29, max: 36 },
      },
      {
        id: "smoking",
        label: "Smoking",
        wantsText: "Never",
        asks: "Never",
        chip: "Non-smoker",
        kind: "dealbreaker",
        rule: { type: "smoking" },
      },
      {
        id: "location",
        label: "Location",
        wantsText: "Bengaluru",
        asks: "Bengaluru",
        chip: "Bengaluru",
        kind: "wish",
        rule: { type: "location", allowedCities: ["Bengaluru"] },
      },
      {
        id: "education",
        label: "Education",
        wantsText: "Graduate or above",
        asks: "Graduate or above",
        chip: "Graduate+",
        kind: "wish",
        rule: { type: "minEducation", level: "graduate" },
      },
      {
        id: "diet",
        label: "Diet",
        wantsText: "Vegetarian",
        asks: "Vegetarian",
        chip: "Vegetarian",
        kind: "wish",
        rule: { type: "diet", allowed: ["vegetarian"] },
      },
    ],
  },
];

export function freshClients(): Client[] {
  return structuredClone(clients);
}

export function clientById(list: Client[], id: string): Client | undefined {
  return list.find((client) => client.id === id);
}
