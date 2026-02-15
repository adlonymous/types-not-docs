/**
 * Quick test script for the markdown generator.
 * Run with: npx ts-node test/test-generator.ts
 */

import { parseFile } from "../src/parser";
import { generateMarkdown } from "../src/generator";
import path from "path";

// Parse both fixture files
const interfacesPath = path.join(__dirname, "fixtures/interfaces.ts");
const functionsPath = path.join(__dirname, "fixtures/types-and-functions.ts");

const files = [
  parseFile(interfacesPath),
  parseFile(functionsPath),
];

// Generate markdown
const markdown = generateMarkdown(files, { title: "Mosaic SDK Reference" });

console.log(markdown);
