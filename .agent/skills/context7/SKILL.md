---
name: context7
description: Use Context7 MCP server to fetch up-to-date documentation and code examples for any library.
---

# Context7 Skill

This skill allows the assistant to fetch real-time, version-specific documentation for libraries and frameworks. Use this whenever the user asks to implement something using a specific library (e.g., Supabase, Next.js, Cloudflare Workers, etc.) or when you suspect your internal training data might be outdated.

## When to use
- At the start of a planning phase for a new feature.
- When encountering errors that look like API mismatches (e.g., "function not found" in a known library).
- When a library version is explicitly mentioned by the user.

## Core Tools
- `query-docs`: Search for specific documentation snippets.
- `resolve-library-id`: Identify the correct ID for a library to query its docs.

## Usage Patterns
1. **Identify the library**: Use `resolve-library-id` if you are unsure of the exact ID.
2. **Fetch documentation**: Use `query-docs` with the library ID and a query (e.g., "supabase auth sign up example").
3. **Verify versions**: Always check if the documentation matches the version in `package.json`.

## Guidelines
- Always prioritize documentation from Context7 over internal knowledge for modern, fast-moving libraries.
- If the user says "use context7" in their prompt, this skill MUST be used immediately.
- Embed the retrieved snippets directly into your implementation plan to ensure accuracy.
