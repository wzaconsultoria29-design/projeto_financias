import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Com `globals: false` o Testing Library não limpa o DOM sozinho entre os testes.
afterEach(() => cleanup());
