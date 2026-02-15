#!/usr/bin/env node
/**
 * CLI entry point for types-not-docs.
 * Parses TypeScript files and generates markdown documentation.
 */

import { program } from "commander";
import { glob } from "glob";
import * as fs from "fs";
import * as path from "path";
import { parseFile } from "./parser";
import { generateMarkdown } from "./generator";
import type { ParsedFile } from "./types";

// Get version from package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8")
);

program
  .name("types-not-docs")
  .description("Generate markdown documentation from TypeScript types")
  .version(packageJson.version)
  .argument("<glob>", "Glob pattern for TypeScript files (e.g., ./src/**/*.ts)")
  .option("-o, --output <file>", "Output file (defaults to stdout)")
  .option("-t, --title <title>", "Document title", "API Reference")
  .option("--exclude <patterns...>", "Glob patterns to exclude", [
    "**/node_modules/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/dist/**",
  ])
  .addHelpText(
    "after",
    `
Examples:
  $ types-not-docs "./src/**/*.ts"
  $ types-not-docs "./src/**/*.ts" -o docs.md
  $ types-not-docs "./src/**/*.ts" -o docs.md -t "My SDK Reference"
  $ types-not-docs "./src/**/*.ts" --exclude "**/__tests__/**"
`
  )
  .action(async (globPattern: string, options) => {
    try {
      await run(globPattern, options);
    } catch (error) {
      console.error("Error:", (error as Error).message);
      process.exit(1);
    }
  });

program.configureOutput({
  outputError: (str, write) => {
    write(str);
    if (str.includes("too many arguments")) {
      write("\nHint: Did you forget -t before the title? Use: -t \"My Title\"\n");
    }
  },
});

program.parse();

async function run(
  globPattern: string,
  options: {
    output?: string;
    title: string;
    exclude: string[];
  }
) {
  // Find files matching the glob pattern
  const files = await glob(globPattern, {
    ignore: options.exclude,
    absolute: true,
  });

  if (files.length === 0) {
    throw new Error(`No files found matching pattern: ${globPattern}`);
  }

  console.error(`Found ${files.length} file(s)`);

  // Parse all files
  const parsedFiles: ParsedFile[] = [];
  let totalInterfaces = 0;
  let totalTypes = 0;
  let totalFunctions = 0;

  for (const file of files) {
    try {
      const parsed = parseFile(file);
      
      // Only include files that have exported types
      if (
        parsed.interfaces.length > 0 ||
        parsed.typeAliases.length > 0 ||
        parsed.functions.length > 0
      ) {
        parsedFiles.push(parsed);
        totalInterfaces += parsed.interfaces.length;
        totalTypes += parsed.typeAliases.length;
        totalFunctions += parsed.functions.length;
      }
    } catch (error) {
      console.error(`Warning: Failed to parse ${file}: ${(error as Error).message}`);
    }
  }

  if (parsedFiles.length === 0) {
    throw new Error("No exported types found in any files");
  }

  console.error(
    `Parsed ${parsedFiles.length} file(s): ${totalInterfaces} interfaces, ${totalTypes} types, ${totalFunctions} functions`
  );

  // Generate markdown
  const markdown = generateMarkdown(parsedFiles, { title: options.title });

  // Output
  if (options.output) {
    fs.writeFileSync(options.output, markdown, "utf-8");
    console.error(`Wrote documentation to ${options.output}`);
  } else {
    console.log(markdown);
  }
}
