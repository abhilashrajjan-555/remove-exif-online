# AGENTS.md

This file provides guidance to Codex, opencode, and Antigravity when working in this micro-tool website project.

## Project Type

Micro-tool SEO website. Stack: **AstroJS + Cloudflare Pages + Google AdSense**.
Full strategy, all prompts, and all rules: `~/Developer/workflows/micro-tool-strategy.md`
**Read that file first before starting any work.**

## Dev Commands

```bash
npm run dev       # local preview at localhost:4321
npm run deploy    # push to Cloudflare Pages (requires wrangler login done once)
```

## Prompt Execution Order

Follow exactly — use a fresh context between each:

1. **Website Creation Prompt** (Prompt 1 in strategy doc) — include competitor URL and @DESIGN.md
2. **SEO Prompt** (Prompt 2 in strategy doc) — 600-word article + OG meta tags
3. **FAQ Prompt** (Prompt 3 in strategy doc) — JSON-LD structured data
4. Add legal pages as separate MPA routes: Privacy Policy, T&C, About Us, Contact Us
5. Add `public/_headers` for Cloudflare noindex on .pages.dev
6. Deploy with `npm run deploy`

## Architecture Rules

- MPA (multi-page application) — never SPA
- Static output only unless the tool explicitly needs server-side logic
- Each page is a separate Astro route
- JSON-LD for all structured data

## SEO Non-Negotiables

- `<title>` contains the primary keyword
- `<meta description>` under 160 characters, contains keyword
- All images have descriptive `alt` attributes
- 600-word article on home page (mandatory for Google to understand the page)
- `robots.txt` links to `sitemap.xml`
- `sitemap.xml` lists all page URLs
- `public/_headers` file sets `X-Robots-Tag: noindex` on `.pages.dev` domain only
