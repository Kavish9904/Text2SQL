// Create this new file for shared types
export interface DatabaseConnection {
  type:
    | "mysql"
    | "postgresql"
    | "clickhouse"
    | "cloudflare"
    | "motherduck"
    | "turbodb";
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  accountId?: string;
  databaseId?: string;
  apiToken?: string;
  token?: string;
}
