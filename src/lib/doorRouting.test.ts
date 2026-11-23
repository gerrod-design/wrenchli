import { describe, it, expect } from "vitest";
import { doorAction } from "./doorRouting";

const DEV = "developers.wrenchli.net";
const OPS = "ops.wrenchli.net";

describe("doorAction: non-door hosts pass through untouched", () => {
  it("www passes everything through", () => {
    for (const p of ["/", "/developers", "/admin", "/robots.txt", "/llms.txt"]) {
      expect(doorAction("www.wrenchli.net", p)).toEqual({ type: "next" });
    }
  });
  it("apex and preview hosts pass through", () => {
    expect(doorAction("wrenchli.net", "/admin")).toEqual({ type: "next" });
    expect(doorAction("wrenchli-abc123.vercel.app", "/robots.txt")).toEqual({
      type: "next",
    });
  });
});

describe("doorAction: developers door", () => {
  it("serves its own machine-identity files", () => {
    expect(doorAction(DEV, "/robots.txt")).toEqual({
      type: "rewrite",
      to: "/door-files/developers/robots.txt",
    });
    expect(doorAction(DEV, "/llms.txt")).toEqual({
      type: "rewrite",
      to: "/door-files/developers/llms.txt",
    });
    expect(doorAction(DEV, "/sitemap.xml")).toEqual({
      type: "rewrite",
      to: "/door-files/developers/sitemap.xml",
    });
  });
  it("serves the prerendered door variants at door-relative URLs", () => {
    expect(doorAction(DEV, "/")).toEqual({
      type: "rewrite",
      to: "/door-developers/index.html",
    });
    expect(doorAction(DEV, "/gpt-actions")).toEqual({
      type: "rewrite",
      to: "/door-developers/gpt-actions/index.html",
    });
    expect(doorAction(DEV, "/price-check")).toEqual({
      type: "rewrite",
      to: "/door-developers/price-check/index.html",
    });
    expect(doorAction(DEV, "/code-lookup")).toEqual({
      type: "rewrite",
      to: "/door-developers/code-lookup/index.html",
    });
  });
  it("canonicalizes the legacy /developers paths on this host", () => {
    expect(doorAction(DEV, "/developers")).toEqual({
      type: "redirect",
      to: "/",
      status: 301,
    });
    expect(doorAction(DEV, "/developers/gpt-actions")).toEqual({
      type: "redirect",
      to: "/gpt-actions",
      status: 301,
    });
    expect(doorAction(DEV, "/developers/price-check")).toEqual({
      type: "redirect",
      to: "/price-check",
      status: 301,
    });
    expect(doorAction(DEV, "/developers/code-lookup")).toEqual({
      type: "redirect",
      to: "/code-lookup",
      status: 301,
    });
  });
  it("refuses the admin console (it exists only on the ops door)", () => {
    expect(doorAction(DEV, "/admin")).toEqual({ type: "notFound" });
    expect(doorAction(DEV, "/admin/audit")).toEqual({ type: "notFound" });
  });
  it("passes the OpenAPI document and app assets through", () => {
    expect(doorAction(DEV, "/openapi.json")).toEqual({ type: "next" });
    expect(doorAction(DEV, "/assets/index-abc.js")).toEqual({ type: "next" });
  });
});

describe("doorAction: ops door", () => {
  it("serves the disallow-all robots file", () => {
    expect(doorAction(OPS, "/robots.txt")).toEqual({
      type: "rewrite",
      to: "/door-files/ops/robots.txt",
    });
  });
  it("sends the root to the console", () => {
    expect(doorAction(OPS, "/")).toEqual({
      type: "redirect",
      to: "/admin",
      status: 302,
    });
  });
  it("serves admin paths and the reset path", () => {
    expect(doorAction(OPS, "/admin")).toEqual({ type: "next" });
    expect(doorAction(OPS, "/admin/login")).toEqual({ type: "next" });
    expect(doorAction(OPS, "/admin/financing-simulation")).toEqual({
      type: "next",
    });
    expect(doorAction(OPS, "/reset-password")).toEqual({ type: "next" });
  });
  it("serves the static files the console needs to boot", () => {
    expect(doorAction(OPS, "/assets/index-abc.js")).toEqual({ type: "next" });
    expect(doorAction(OPS, "/favicon.png")).toEqual({ type: "next" });
    expect(doorAction(OPS, "/manifest.json")).toEqual({ type: "next" });
  });
  it("404s everything else, including public pages and the door files of other doors", () => {
    expect(doorAction(OPS, "/developers")).toEqual({ type: "notFound" });
    expect(doorAction(OPS, "/garage")).toEqual({ type: "notFound" });
    expect(doorAction(OPS, "/llms.txt")).toEqual({ type: "notFound" });
    expect(doorAction(OPS, "/sitemap.xml")).toEqual({ type: "notFound" });
  });
});
