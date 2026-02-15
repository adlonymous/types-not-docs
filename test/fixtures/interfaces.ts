/**
 * Token metadata information.
 * 
 * This interface represents the core metadata of a token, including its
 * name, symbol, and other identifying information.
 */
export interface TokenMetadata {
  /** The token's display name */
  name?: string;
  /** The token's ticker symbol */
  symbol?: string;
  /** URI pointing to extended metadata */
  uri?: string;
  /** Number of decimal places */
  decimals?: number;
}

/**
 * Token authority configuration.
 */
export interface TokenAuthorities {
  /** Authority that can mint new tokens */
  mintAuthority?: string | null;
  /** Authority that can freeze token accounts */
  freezeAuthority?: string | null;
  /** Authority that can update token metadata */
  updateAuthority?: string | null;
}

/**
 * Complete list data including configuration and wallet addresses.
 *
 * This interface extends ListConfig to include the actual wallet addresses
 * that are part of the allowlist or blocklist.
 */
export interface ListConfig {
  /** The address of the list configuration account */
  listConfig: string;
  /** The mode of the list (allowlist or blocklist) */
  mode: "allowlist" | "blocklist";
  /** The seed used to derive the list configuration PDA */
  seed: string;
}

/**
 * Extended list with wallet addresses.
 */
export interface List extends ListConfig {
  /** Array of wallet addresses that are part of this list */
  wallets: string[];
}

/**
 * Result of a token pause operation.
 */
export interface PauseTokenResult {
  success: boolean;
  error?: string;
  transactionSignature?: string;
  paused?: boolean;
}

/**
 * Interface with method signatures.
 */
export interface TokenClient {
  /** Fetches token metadata from the chain */
  getMetadata(mint: string): Promise<TokenMetadata>;
  /** Optional method to refresh cache */
  refresh?(): void;
}

// Not exported - should be ignored
interface InternalConfig {
  secret: string;
}
