/**
 * Markdown generator for parsed TypeScript types.
 * Generates API reference-style documentation with tables.
 */

import * as path from "path";
import type {
  ParsedFile,
  ParsedInterface,
  ParsedTypeAlias,
  ParsedFunction,
  ParsedProperty,
  ParsedParameter,
} from "./types";

export interface GeneratorOptions {
  /** Title for the document */
  title?: string;
}

/** An item with its source file for duplicate detection */
interface ItemWithSource<T> {
  item: T;
  sourceFile: string;
}

/**
 * Generate markdown documentation from parsed files.
 */
export function generateMarkdown(
  files: ParsedFile[],
  options: GeneratorOptions = {}
): string {
  const { title = "API Reference" } = options;
  const lines: string[] = [];

  // Collect all items with their source files
  const allInterfaces: ItemWithSource<ParsedInterface>[] = [];
  const allTypeAliases: ItemWithSource<ParsedTypeAlias>[] = [];
  const allFunctions: ItemWithSource<ParsedFunction>[] = [];

  for (const file of files) {
    const sourceFile = path.basename(file.filePath);
    for (const iface of file.interfaces) {
      allInterfaces.push({ item: iface, sourceFile });
    }
    for (const alias of file.typeAliases) {
      allTypeAliases.push({ item: alias, sourceFile });
    }
    for (const fn of file.functions) {
      allFunctions.push({ item: fn, sourceFile });
    }
  }

  // Detect duplicate names
  const duplicateNames = findDuplicateNames([
    ...allInterfaces.map((i) => i.item.name),
    ...allTypeAliases.map((t) => t.item.name),
    ...allFunctions.map((f) => f.item.name),
  ]);

  // Title
  lines.push(`# ${title}`);
  lines.push("");

  // Table of Contents
  if (allInterfaces.length + allTypeAliases.length + allFunctions.length > 0) {
    lines.push("## Table of Contents");
    lines.push("");

    if (allInterfaces.length > 0) {
      lines.push("### Interfaces");
      lines.push("");
      for (const { item, sourceFile } of allInterfaces) {
        const displayName = getDisplayName(item.name, sourceFile, duplicateNames);
        const anchor = getAnchor(item.name, sourceFile, duplicateNames);
        lines.push(`- [${displayName}](#${anchor})`);
      }
      lines.push("");
    }

    if (allTypeAliases.length > 0) {
      lines.push("### Types");
      lines.push("");
      for (const { item, sourceFile } of allTypeAliases) {
        const displayName = getDisplayName(item.name, sourceFile, duplicateNames);
        const anchor = getAnchor(item.name, sourceFile, duplicateNames);
        lines.push(`- [${displayName}](#${anchor})`);
      }
      lines.push("");
    }

    if (allFunctions.length > 0) {
      lines.push("### Functions");
      lines.push("");
      for (const { item, sourceFile } of allFunctions) {
        const displayName = getDisplayName(item.name, sourceFile, duplicateNames);
        const anchor = getAnchor(item.name, sourceFile, duplicateNames);
        lines.push(`- [${displayName}()](#${anchor})`);
      }
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // Interfaces
  for (const { item, sourceFile } of allInterfaces) {
    lines.push(...generateInterface(item, sourceFile, duplicateNames));
    lines.push("");
  }

  // Type Aliases
  for (const { item, sourceFile } of allTypeAliases) {
    lines.push(...generateTypeAlias(item, sourceFile, duplicateNames));
    lines.push("");
  }

  // Functions
  for (const { item, sourceFile } of allFunctions) {
    lines.push(...generateFunction(item, sourceFile, duplicateNames));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Find names that appear more than once.
 */
function findDuplicateNames(names: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) {
      duplicates.add(name);
    }
    seen.add(name);
  }
  return duplicates;
}

/**
 * Get display name, adding source file suffix for duplicates.
 */
function getDisplayName(
  name: string,
  sourceFile: string,
  duplicates: Set<string>
): string {
  if (duplicates.has(name)) {
    return `${name} (${sourceFile})`;
  }
  return name;
}

/**
 * Get anchor, adding source file suffix for duplicates.
 */
function getAnchor(
  name: string,
  sourceFile: string,
  duplicates: Set<string>
): string {
  if (duplicates.has(name)) {
    const combined = `${name}-${sourceFile}`;
    return toAnchor(combined);
  }
  return toAnchor(name);
}

/**
 * Generate markdown for an interface.
 */
function generateInterface(
  iface: ParsedInterface,
  sourceFile: string,
  duplicates: Set<string>
): string[] {
  const lines: string[] = [];
  const displayName = getDisplayName(iface.name, sourceFile, duplicates);

  lines.push(`## ${displayName}`);
  lines.push("");

  if (iface.extends && iface.extends.length > 0) {
    lines.push(`*Extends: ${iface.extends.join(", ")}*`);
    lines.push("");
  }

  if (iface.description) {
    lines.push(iface.description);
    lines.push("");
  }

  if (iface.properties.length > 0) {
    lines.push(...generatePropertiesTable(iface.properties));
  } else {
    lines.push("*No properties*");
  }

  lines.push("");
  lines.push("---");

  return lines;
}

/**
 * Generate a properties table.
 */
function generatePropertiesTable(properties: ParsedProperty[]): string[] {
  const lines: string[] = [];

  lines.push("| Property | Type | Required | Description |");
  lines.push("|----------|------|----------|-------------|");

  for (const prop of properties) {
    const required = prop.required ? "✓" : "";
    const description = prop.description || "";
    const type = escapeMarkdown(prop.type);
    lines.push(`| ${prop.name} | \`${type}\` | ${required} | ${description} |`);
  }

  return lines;
}

/**
 * Generate markdown for a type alias.
 */
function generateTypeAlias(
  alias: ParsedTypeAlias,
  sourceFile: string,
  duplicates: Set<string>
): string[] {
  const lines: string[] = [];
  const displayName = getDisplayName(alias.name, sourceFile, duplicates);

  lines.push(`## ${displayName}`);
  lines.push("");

  if (alias.description) {
    lines.push(alias.description);
    lines.push("");
  }

  lines.push("```typescript");
  lines.push(`type ${alias.name} = ${alias.type}`);
  lines.push("```");

  lines.push("");
  lines.push("---");

  return lines;
}

/**
 * Generate markdown for a function.
 */
function generateFunction(
  fn: ParsedFunction,
  sourceFile: string,
  duplicates: Set<string>
): string[] {
  const lines: string[] = [];
  const displayName = getDisplayName(fn.name, sourceFile, duplicates);

  const asyncPrefix = fn.isAsync ? "async " : "";
  lines.push(`## ${displayName}()`);
  lines.push("");

  if (fn.description) {
    lines.push(fn.description);
    lines.push("");
  }

  // Signature
  const params = fn.parameters.map((p) => {
    const opt = p.required ? "" : "?";
    return `${p.name}${opt}: ${p.type}`;
  });
  const signature = `${asyncPrefix}function ${fn.name}(${params.join(", ")}): ${fn.returnType}`;

  lines.push("```typescript");
  lines.push(signature);
  lines.push("```");
  lines.push("");

  // Parameters table
  if (fn.parameters.length > 0) {
    lines.push("**Parameters:**");
    lines.push("");
    lines.push(...generateParametersTable(fn.parameters));
    lines.push("");
  }

  // Return type
  lines.push(`**Returns:** \`${escapeMarkdown(fn.returnType)}\``);

  lines.push("");
  lines.push("---");

  return lines;
}

/**
 * Generate a parameters table.
 */
function generateParametersTable(parameters: ParsedParameter[]): string[] {
  const lines: string[] = [];

  lines.push("| Name | Type | Required | Description |");
  lines.push("|------|------|----------|-------------|");

  for (const param of parameters) {
    const required = param.required ? "✓" : "";
    const description = param.description || "";
    const type = escapeMarkdown(param.type);
    lines.push(`| ${param.name} | \`${type}\` | ${required} | ${description} |`);
  }

  return lines;
}

/**
 * Convert a name to a markdown anchor.
 */
function toAnchor(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Escape markdown special characters in type strings.
 * For now, just handle pipe characters in union types.
 */
function escapeMarkdown(text: string): string {
  // Escape pipe characters for table cells
  return text.replace(/\|/g, "\\|");
}
