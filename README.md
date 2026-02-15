# types-not-docs

Generate markdown documentation from TypeScript types. One source of truth, docs that stay in sync.

Inspired by [Ship types, not docs](https://shiptypes.com) by Boris Tane.

## Installation

```bash
npm install -g types-not-docs
```

Or run directly with npx:

```bash
npx types-not-docs "./src/**/*.ts" -o docs.md
```

## Usage

```bash
# Generate docs for all TypeScript files in src/
types-not-docs "./src/**/*.ts" -o docs.md

# With a custom title
types-not-docs "./src/**/*.ts" -o docs.md -t "My SDK Reference"

# Exclude additional patterns
types-not-docs "./src/**/*.ts" -o docs.md --exclude "**/__mocks__/**"
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `<glob>` | Glob pattern for TypeScript files | (required) |
| `-o, --output <file>` | Output file | stdout |
| `-t, --title <title>` | Document title | "API Reference" |
| `--exclude <patterns...>` | Glob patterns to exclude | node_modules, tests, dist |

## What it extracts

- **Interfaces** - Properties, types, required/optional, JSDoc descriptions
- **Type aliases** - Union types, generics, etc.
- **Functions** - Parameters, return types, async, JSDoc with @param tags
- **Arrow functions** - `export const fn = () => {}` syntax

## Example output

```markdown
## TokenMetadata

Token metadata information.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| name | `string` |  | The token's display name |
| symbol | `string` |  | The token's ticker symbol |

---

## getTokenMetadata()

Fetches token metadata from the chain.

​```typescript
async function getTokenMetadata(rpc: RpcClient, mint: Address): Promise<TokenMetadata>
​```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| rpc | `RpcClient` | ✓ | The RPC client instance |
| mint | `Address` | ✓ | The mint address to inspect |

**Returns:** `Promise<TokenMetadata>`
```

## Why?

Documentation drifts from code. It's a lossy copy that inevitably falls out of sync.

Types are the contract. By generating docs from types, they stay in sync automatically. This is especially valuable for AI agents that need to understand your SDK to use it.

## License

MIT
