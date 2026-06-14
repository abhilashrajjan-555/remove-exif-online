# CLAUDE.md

This file provides guidance to Claude Code when working in this micro-tool website project.

## Project Type

Micro-tool SEO website. Stack: **AstroJS + Cloudflare Pages + Google AdSense**.
Full strategy, all prompts, and all rules: `~/Developer/workflows/micro-tool-strategy.md`

## Required MCP Servers (confirm before starting)

```bash
claude mcp add web-design-guidelines
claude mcp add tailwind-v4-docs
# Astro MCP: docs.astro.build/en/guides/build-with-ai/#astro-docs-mcp-server
```

## Dev Commands

```bash
npm run dev       # local preview
npm run deploy    # push to Cloudflare Pages (requires wrangler login done once)
```

## Session Order — Follow This Exactly

1. Read `~/Developer/workflows/micro-tool-strategy.md` for the full strategy
2. Run **Prompt 1** (Website Creation) — reference `@DESIGN.md` and competitor URL
3. `/clear` → Run **Prompt 2** (SEO + 600-word article)
4. `/clear` → Run **Prompt 3** (FAQ section with JSON-LD)
5. `/clear` → Add Privacy Policy, T&C, About Us, Contact Us as MPA routes
6. Add `_headers` file to `/public/` (noindex on .pages.dev)
7. `npm run deploy` → verify on Cloudflare Pages
8. Connect domain (after buying) → Cloudflare custom domains flow

## Architecture Rules

- MPA (multi-page application) — never SPA for this project type
- Static output only — no server-side rendering unless the tool explicitly needs a backend
- Each legal page is a separate route, not a modal
- JSON-LD for all structured data (FAQ, etc.)

## SEO Non-Negotiables

- `<title>` contains the primary keyword
- `<meta description>` under 160 characters, contains keyword
- All images have descriptive `alt` attributes
- 600-word article on home page
- `robots.txt` links to `sitemap.xml`
- `sitemap.xml` lists all page URLs
