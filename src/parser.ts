/**
 * TypeScript AST parser using ts-morph.
 * Extracts interfaces, type aliases, and functions from source files.
 */

import {
  Project,
  SourceFile,
  InterfaceDeclaration,
  FunctionDeclaration,
  VariableDeclaration,
  ArrowFunction,
  Node,
  JSDoc,
  ParameterDeclaration,
} from "ts-morph";
import type {
  ParsedFile,
  ParsedInterface,
  ParsedProperty,
  ParsedTypeAlias,
  ParsedFunction,
  ParsedParameter,
} from "./types";

/**
 * Parse a TypeScript file and extract all exported types.
 */
export function parseFile(filePath: string): ParsedFile {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  const sourceFile = project.addSourceFileAtPath(filePath);

  return {
    filePath,
    interfaces: parseInterfaces(sourceFile),
    typeAliases: parseTypeAliases(sourceFile),
    functions: parseFunctions(sourceFile),
  };
}

// =============================================================================
// Interface Parsing
// =============================================================================

/**
 * Parse all exported interfaces from a source file.
 */
function parseInterfaces(sourceFile: SourceFile): ParsedInterface[] {
  return sourceFile
    .getInterfaces()
    .filter((iface) => iface.isExported())
    .map((iface) => ({
      kind: "interface" as const,
      name: iface.getName(),
      description: getJsDocDescription(iface),
      properties: parseProperties(iface),
      extends: getExtendsClause(iface),
    }));
}

/**
 * Parse all properties from an interface, including method signatures.
 */
function parseProperties(iface: InterfaceDeclaration): ParsedProperty[] {
  const properties: ParsedProperty[] = [];

  // Regular properties
  for (const prop of iface.getProperties()) {
    properties.push({
      name: prop.getName(),
      type: prop.getType().getText(prop),
      required: !prop.hasQuestionToken(),
      description: getJsDocDescription(prop),
    });
  }

  // Method signatures (treated as properties with function type)
  for (const method of iface.getMethods()) {
    const params = method
      .getParameters()
      .map((p) => `${p.getName()}: ${p.getType().getText(p)}`)
      .join(", ");
    const returnType = method.getReturnType().getText(method);
    const funcType = `(${params}) => ${returnType}`;

    properties.push({
      name: method.getName(),
      type: funcType,
      required: !method.hasQuestionToken(),
      description: getJsDocDescription(method),
    });
  }

  return properties;
}

/**
 * Get the names of interfaces that this interface extends.
 */
function getExtendsClause(iface: InterfaceDeclaration): string[] | undefined {
  const extendsClauses = iface.getExtends();
  if (extendsClauses.length === 0) {
    return undefined;
  }
  return extendsClauses.map((clause) => clause.getText());
}

// =============================================================================
// Type Alias Parsing
// =============================================================================

/**
 * Parse all exported type aliases from a source file.
 */
function parseTypeAliases(sourceFile: SourceFile): ParsedTypeAlias[] {
  return sourceFile
    .getTypeAliases()
    .filter((alias) => alias.isExported())
    .map((alias) => ({
      kind: "type" as const,
      name: alias.getName(),
      type: alias.getType().getText(alias),
      description: getJsDocDescription(alias),
    }));
}

// =============================================================================
// Function Parsing
// =============================================================================

/**
 * Parse all exported functions from a source file.
 * Includes both regular function declarations and arrow functions.
 */
function parseFunctions(sourceFile: SourceFile): ParsedFunction[] {
  const functions: ParsedFunction[] = [];

  // Regular function declarations: export function foo() {}
  for (const fn of sourceFile.getFunctions()) {
    if (fn.isExported()) {
      functions.push(parseFunctionDeclaration(fn));
    }
  }

  // Arrow functions: export const foo = () => {}
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    const varStatement = varDecl.getVariableStatement();
    if (varStatement?.isExported()) {
      const init = varDecl.getInitializer();
      if (Node.isArrowFunction(init)) {
        functions.push(parseArrowFunction(varDecl, init));
      }
    }
  }

  return functions;
}

/**
 * Parse a regular function declaration.
 */
function parseFunctionDeclaration(fn: FunctionDeclaration): ParsedFunction {
  const jsDocs = fn.getJsDocs();
  const paramDescriptions = extractParamDescriptions(jsDocs);

  return {
    kind: "function" as const,
    name: fn.getName() || "anonymous",
    description: getJsDocDescription(fn),
    parameters: parseParameters(fn.getParameters(), paramDescriptions),
    returnType: fn.getReturnType().getText(fn),
    isAsync: fn.isAsync(),
  };
}

/**
 * Parse an arrow function assigned to a variable.
 */
function parseArrowFunction(
  varDecl: VariableDeclaration,
  arrowFn: ArrowFunction
): ParsedFunction {
  // JSDoc is on the variable statement, not the arrow function
  const varStatement = varDecl.getVariableStatement();
  const jsDocs = varStatement?.getJsDocs() || [];
  const paramDescriptions = extractParamDescriptions(jsDocs);

  return {
    kind: "function" as const,
    name: varDecl.getName(),
    description: getJsDocDescriptionFromDocs(jsDocs),
    parameters: parseParameters(arrowFn.getParameters(), paramDescriptions),
    returnType: arrowFn.getReturnType().getText(arrowFn),
    isAsync: arrowFn.isAsync(),
  };
}

/**
 * Parse function parameters with their JSDoc descriptions.
 */
function parseParameters(
  params: ParameterDeclaration[],
  paramDescriptions: Map<string, string>
): ParsedParameter[] {
  return params.map((param) => ({
    name: param.getName(),
    type: param.getType().getText(param),
    required: !param.isOptional() && !param.hasInitializer(),
    description: paramDescriptions.get(param.getName()),
  }));
}

/**
 * Extract @param descriptions from JSDoc comments.
 * Only handles top-level params (not nested like @param input.authority).
 */
function extractParamDescriptions(jsDocs: JSDoc[]): Map<string, string> {
  const descriptions = new Map<string, string>();

  if (jsDocs.length === 0) {
    return descriptions;
  }

  // Use the last JSDoc - the one immediately preceding the declaration
  const jsDoc = jsDocs[jsDocs.length - 1];
  for (const tag of jsDoc.getTags()) {
    if (tag.getTagName() === "param" && Node.isJSDocParameterTag(tag)) {
      const paramName = tag.getName();
      const comment = tag.getCommentText()?.trim();
      
      // Only store top-level params (no dots like input.authority)
      if (paramName && !paramName.includes(".") && comment) {
        // Remove leading dash if present ("- description" -> "description")
        const description = comment.replace(/^-\s*/, "");
        descriptions.set(paramName, description);
      }
    }
  }

  return descriptions;
}

// =============================================================================
// JSDoc Utilities
// =============================================================================

/**
 * Extract JSDoc description from a node.
 * Returns undefined if no JSDoc is present.
 */
function getJsDocDescription(node: Node): string | undefined {
  const jsDocs = (node as any).getJsDocs?.();
  return getJsDocDescriptionFromDocs(jsDocs);
}

/**
 * Extract description from JSDoc array.
 * Uses the last JSDoc comment (the one immediately preceding the declaration).
 */
function getJsDocDescriptionFromDocs(jsDocs: JSDoc[] | undefined): string | undefined {
  if (!jsDocs || jsDocs.length === 0) {
    return undefined;
  }

  // Use the last JSDoc - this is the one immediately preceding the declaration.
  // Earlier JSDocs might be file-level comments or comments for previous code.
  const jsDoc = jsDocs[jsDocs.length - 1];
  const description = jsDoc.getDescription?.();

  if (!description || description.trim() === "") {
    return undefined;
  }

  return description.trim();
}
