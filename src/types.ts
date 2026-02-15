/**
 * Internal type model for types-not-docs.
 * These types represent the extracted information from TypeScript source files.
 */

/**
 * A property of an interface or inline object type.
 */
export interface ParsedProperty {
  /** Property name */
  name: string;
  /** Type as a string (e.g., "string", "Address | null", "Promise<Order>") */
  type: string;
  /** Whether the property is required (not optional) */
  required: boolean;
  /** Description from JSDoc comment, if present */
  description?: string;
}

/**
 * A parsed TypeScript interface.
 */
export interface ParsedInterface {
  kind: "interface";
  /** Interface name */
  name: string;
  /** Description from JSDoc comment, if present */
  description?: string;
  /** Interface properties */
  properties: ParsedProperty[];
  /** Names of interfaces this extends, if any */
  extends?: string[];
}

/**
 * A parsed TypeScript type alias.
 */
export interface ParsedTypeAlias {
  kind: "type";
  /** Type alias name */
  name: string;
  /** The type definition as a string (e.g., "'a' | 'b' | 'c'") */
  type: string;
  /** Description from JSDoc comment, if present */
  description?: string;
}

/**
 * A parameter of a function.
 */
export interface ParsedParameter {
  /** Parameter name */
  name: string;
  /** Type as a string */
  type: string;
  /** Whether the parameter is required (not optional, no default value) */
  required: boolean;
  /** Description from @param JSDoc tag, if present */
  description?: string;
}

/**
 * A parsed exported function.
 */
export interface ParsedFunction {
  kind: "function";
  /** Function name */
  name: string;
  /** Description from JSDoc comment, if present */
  description?: string;
  /** Function parameters */
  parameters: ParsedParameter[];
  /** Return type as a string */
  returnType: string;
  /** Whether the function is async */
  isAsync: boolean;
}

/**
 * Union of all parsed type kinds.
 */
export type ParsedType = ParsedInterface | ParsedTypeAlias | ParsedFunction;

/**
 * All extracted types from a single source file.
 */
export interface ParsedFile {
  /** File path (relative or absolute) */
  filePath: string;
  /** All exported interfaces */
  interfaces: ParsedInterface[];
  /** All exported type aliases */
  typeAliases: ParsedTypeAlias[];
  /** All exported functions */
  functions: ParsedFunction[];
}
