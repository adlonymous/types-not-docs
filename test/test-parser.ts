/**
 * Quick test script for the parser.
 * Run with: npx ts-node test/test-parser.ts
 */

import { parseFile } from "../src/parser";
import path from "path";

function testFile(filename: string) {
  const fixturePath = path.join(__dirname, `fixtures/${filename}`);
  const result = parseFile(fixturePath);

  console.log("=".repeat(60));
  console.log(`FILE: ${filename}`);
  console.log("=".repeat(60));
  console.log();

  // Interfaces
  if (result.interfaces.length > 0) {
    console.log(`INTERFACES (${result.interfaces.length}):`);
    console.log("-".repeat(40));
    for (const iface of result.interfaces) {
      console.log(`  ${iface.name}`);
      if (iface.description) {
        console.log(`    "${iface.description.split("\n")[0]}..."`);
      }
      if (iface.extends) {
        console.log(`    extends: ${iface.extends.join(", ")}`);
      }
      console.log(`    properties: ${iface.properties.length}`);
    }
    console.log();
  }

  // Type Aliases
  if (result.typeAliases.length > 0) {
    console.log(`TYPE ALIASES (${result.typeAliases.length}):`);
    console.log("-".repeat(40));
    for (const alias of result.typeAliases) {
      console.log(`  ${alias.name} = ${alias.type}`);
      if (alias.description) {
        console.log(`    "${alias.description}"`);
      }
    }
    console.log();
  }

  // Functions
  if (result.functions.length > 0) {
    console.log(`FUNCTIONS (${result.functions.length}):`);
    console.log("-".repeat(40));
    for (const fn of result.functions) {
      const asyncLabel = fn.isAsync ? "async " : "";
      const params = fn.parameters.map((p) => {
        const opt = p.required ? "" : "?";
        return `${p.name}${opt}: ${p.type}`;
      });
      console.log(`  ${asyncLabel}${fn.name}(${params.length} params) => ${fn.returnType}`);
      if (fn.description) {
        console.log(`    "${fn.description.split("\n")[0]}"`);
      }
      for (const param of fn.parameters) {
        const req = param.required ? "required" : "optional";
        const desc = param.description ? ` - ${param.description}` : "";
        console.log(`      @param ${param.name} (${req})${desc}`);
      }
    }
    console.log();
  }
}

// Test both fixtures
testFile("interfaces.ts");
testFile("types-and-functions.ts");
