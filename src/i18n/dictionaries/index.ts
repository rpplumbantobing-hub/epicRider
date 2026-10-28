// Registry dictionary per locale — epicRider (ADR-020).
// Menambah bahasa baru: buat file dictionary baru yang memenuhi `Dictionary`, lalu daftarkan di sini.

import type { Locale } from "../config";
import { dictionary, type Dictionary } from "./id";
import { en } from "./en";

export const dictionaries: Record<Locale, Dictionary> = { id: dictionary, en };

export { dictionary as idDictionary, en as enDictionary };
export type { Dictionary };
