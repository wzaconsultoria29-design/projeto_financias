import { describe, it, expect } from "vitest";
import { intervalo, anterior } from "@/lib/periodo";

const sabado = new Date("2026-10-31T15:00:00Z"); // 12h em São Paulo, sábado

describe("intervalo", () => {
  it("semana vai da segunda-feira até hoje", () => {
    expect(intervalo("semana", sabado)).toEqual({ de: "2026-10-26", ate: "2026-10-31" });
  });
  it("na segunda-feira a semana tem um dia só", () => {
    expect(intervalo("semana", new Date("2026-10-26T15:00:00Z"))).toEqual({ de: "2026-10-26", ate: "2026-10-26" });
  });
  it("no domingo a semana ainda começa na segunda anterior", () => {
    expect(intervalo("semana", new Date("2026-11-01T15:00:00Z"))).toEqual({ de: "2026-10-26", ate: "2026-11-01" });
  });
  it("23h30 em São Paulo ainda é o mesmo dia", () => {
    expect(intervalo("hoje", new Date("2026-11-01T02:30:00Z"))).toEqual({ de: "2026-10-31", ate: "2026-10-31" });
  });
  it("mês e ano começam no dia 1", () => {
    expect(intervalo("mes", sabado)).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(intervalo("ano", sabado)).toEqual({ de: "2026-01-01", ate: "2026-10-31" });
  });
  it("7d e 30d contam o dia de hoje", () => {
    expect(intervalo("7d", sabado)).toEqual({ de: "2026-10-25", ate: "2026-10-31" });
    expect(intervalo("30d", sabado)).toEqual({ de: "2026-10-02", ate: "2026-10-31" });
  });
  it("personalizado devolve as datas e corrige a ordem invertida", () => {
    expect(intervalo("custom", sabado, { de: "2026-10-05", ate: "2026-10-10" })).toEqual({ de: "2026-10-05", ate: "2026-10-10" });
    expect(intervalo("custom", sabado, { de: "2026-10-10", ate: "2026-10-05" })).toEqual({ de: "2026-10-05", ate: "2026-10-10" });
  });
  it("personalizado sem datas cai no mês atual", () => {
    expect(intervalo("custom", sabado)).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
  });
});

describe("anterior", () => {
  it("é o período de mesmo tamanho imediatamente antes", () => {
    expect(anterior({ de: "2026-10-26", ate: "2026-10-31" })).toEqual({ de: "2026-10-20", ate: "2026-10-25" });
    expect(anterior({ de: "2026-10-31", ate: "2026-10-31" })).toEqual({ de: "2026-10-30", ate: "2026-10-30" });
  });
  it("atravessa a virada de mês igual ao banco", () => {
    expect(anterior({ de: "2026-10-01", ate: "2026-10-31" })).toEqual({ de: "2026-08-31", ate: "2026-09-30" });
  });
});
