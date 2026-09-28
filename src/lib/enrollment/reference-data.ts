// //src/lib/enrollment/reference-data.ts
// TODO: Once these tables are seeded in Supabase, replace these static
// arrays with real fetches. IDs here are readable placeholders standing in
// for the UUIDs Supabase will generate — swap the fetch source later,
// the shape (id/name/track_id) stays the same.
import type { DocumentType } from "@/lib/enrollment/types";

export const GRADE_LEVELS = [7, 8, 9, 10, 11, 12];

export const TRACKS = [
  { id: "track-academic", name: "Academic" },
  { id: "track-tvl", name: "TVL" },
];

export const DOCUMENT_TYPES: DocumentType[] = [
  { id: "doc-psa", name: "PSA Birth Certificate", required: true },
  { id: "doc-form-138", name: "Form 138 (Report Card)", required: true },
  { id: "doc-good-moral", name: "Good Moral Certificate", required: true },
];

export const STRANDS = [
  // Academic Track
  { id: "strand-stem", track_id: "track-academic", name: "STEM" },
  { id: "strand-humss", track_id: "track-academic", name: "HUMSS" },
  { id: "strand-abm", track_id: "track-academic", name: "ABM" },
  { id: "strand-gas", track_id: "track-academic", name: "GAS" },
  { id: "strand-assh", track_id: "track-academic", name: "ASSH" },
  { id: "strand-be", track_id: "track-academic", name: "BE" },
  { id: "strand-oap", track_id: "track-academic", name: "OAP" },
  { id: "strand-so", track_id: "track-academic", name: "SO" },
  { id: "strand-pus", track_id: "track-academic", name: "PUS" },
  { id: "strand-fbsi", track_id: "track-academic", name: "FBSI" },
  { id: "strand-gas-oap", track_id: "track-academic", name: "GAS-OAP" },
  { id: "strand-gas-eim", track_id: "track-academic", name: "GAS-EIM" },
  // TVL Track
  { id: "strand-css", track_id: "track-tvl", name: "CSS" },
  { id: "strand-ict", track_id: "track-tvl", name: "ICT" },
  { id: "strand-bpp", track_id: "track-tvl", name: "BPP" },
];

export const LEARNING_MODALITIES = [
  { id: "modality-blended", name: "Blended (Combination)" },
  { id: "modality-educational-tv", name: "Educational Television" },
  { id: "modality-homeschooling", name: "Homeschooling" },
  { id: "modality-modular-digital", name: "Modular (Digital)" },
  { id: "modality-modular-print", name: "Modular (Print)" },
  { id: "modality-online", name: "Online" },
  { id: "modality-radio-tv", name: "Radio-Based Television" },
];

export const SPED_CATEGORIES = [
  // a1: Diagnostics from licensed medical specialists
  {
    id: "sped-adhd",
    category: "diagnostics",
    name: "Attention Deficit Hyperactivity Disorder",
  },
  { id: "sped-asd", category: "diagnostics", name: "Autism Spectrum Disorder" },
  {
    id: "sped-cerebral-palsy",
    category: "diagnostics",
    name: "Cerebral Palsy",
  },
  {
    id: "sped-emotional-behavior",
    category: "diagnostics",
    name: "Emotional-Behavior Disorder",
  },
  {
    id: "sped-hearing-impairment",
    category: "diagnostics",
    name: "Hearing Impairment",
  },
  {
    id: "sped-intellectual-disability",
    category: "diagnostics",
    name: "Intellectual Disability",
  },
  {
    id: "sped-learning-disability",
    category: "diagnostics",
    name: "Learning Disability",
  },
  {
    id: "sped-multiple-disabilities",
    category: "diagnostics",
    name: "Multiple Disabilities",
  },
  {
    id: "sped-orthopedic",
    category: "diagnostics",
    name: "Orthopedic/Physical Handicap",
  },
  {
    id: "sped-speech-language",
    category: "diagnostics",
    name: "Speech/Language Disorder",
  },
  {
    id: "sped-health-cancer",
    category: "diagnostics",
    name: "Special Health Problem/Chronic Disease - Cancer",
  },
  {
    id: "sped-health-non-cancer",
    category: "diagnostics",
    name: "Special Health Problem/Chronic Disease - Non-Cancer",
  },
  {
    id: "sped-visual-blind",
    category: "diagnostics",
    name: "Visual Impairment - Blind",
  },
  {
    id: "sped-visual-low-vision",
    category: "diagnostics",
    name: "Visual Impairment - Low Vision",
  },

  // a2: Manifestations
  {
    id: "sped-applying-knowledge",
    category: "manifestations",
    name: "Difficulty in Applying Knowledge",
  },
  {
    id: "sped-communicating",
    category: "manifestations",
    name: "Difficulty in Communicating",
  },
  {
    id: "sped-interpersonal",
    category: "manifestations",
    name: "Difficulty in Displaying Interpersonal Behavior (Emotional and Behavioral)",
  },
  {
    id: "sped-hearing",
    category: "manifestations",
    name: "Difficulty in Hearing",
  },
  {
    id: "sped-mobility",
    category: "manifestations",
    name: "Difficulty in Mobility (Walking, Climbing and Grasping)",
  },
  {
    id: "sped-adaptive-skills",
    category: "manifestations",
    name: "Difficulty in Performing Adaptive Skills (Self Care)",
  },
  {
    id: "sped-remembering",
    category: "manifestations",
    name: "Difficulty in Remembering, Concentrating, Paying Attention and Understanding",
  },
  {
    id: "sped-seeing",
    category: "manifestations",
    name: "Difficulty in Seeing",
  },
] as const;

export const DIMASALANG_BARANGAYS = [
  { id: "brgy-balantay", name: "Balantay" },
  { id: "brgy-balocawe", name: "Balocawe" },
  { id: "brgy-banahao", name: "Banahao" },
  { id: "brgy-buenaflor", name: "Buenaflor" },
  { id: "brgy-buracan", name: "Buracan" },
  { id: "brgy-cabanoyoan", name: "Cabanoyoan" },
  { id: "brgy-cabrera", name: "Cabrera" },
  { id: "brgy-cadulan", name: "Cadulan" },
  { id: "brgy-calabad", name: "Calabad" },
  { id: "brgy-canomay", name: "Canomay" },
  { id: "brgy-divisoria", name: "Divisoria" },
  { id: "brgy-gaid", name: "Gaid" },
  { id: "brgy-gregorio-alino", name: "Gregorio Alino" },
  { id: "brgy-magcaraguit", name: "Magcaraguit" },
  { id: "brgy-mambog", name: "Mambog" },
  { id: "brgy-poblacion", name: "Poblacion" },
  { id: "brgy-rizal", name: "Rizal" },
  { id: "brgy-san-vicente", name: "San Vicente" },
  { id: "brgy-suba", name: "Suba" },
  { id: "brgy-tr-yangco", name: "T.R. Yangco" },
];

export const ACTIVE_SCHOOL_YEAR = {
  name: "2026-2027",
  application_enabled: true,
};
