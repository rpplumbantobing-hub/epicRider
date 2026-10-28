// Setup global Vitest — epicRider (Phase 3).
// Matcher jest-dom untuk Vitest + cleanup DOM antar test.

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
