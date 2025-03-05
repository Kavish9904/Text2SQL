export interface BaseConnection {
  id: string;
  name: string;
  type:
    | "mysql"
    | "postgresql"
    | "clickhouse"
    | "motherduck"
    | "turbodb"
    | "cloudflare";
  lastUsed: string;
}

export interface SQLConnection extends BaseConnection {
  type: "clickhouse" | "mysql" | "postgresql";
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface CloudflareConnection extends BaseConnection {
  type: "cloudflare";
  accountId: string;
  apiToken: string;
  databaseName: string;
}

export interface MotherDuckConnection extends BaseConnection {
  type: "motherduck";
  token: string;
  database: string;
  organization: string;
}

export interface TurboDBConnection extends BaseConnection {
  type: "turbodb";
  database: string;
  apiKey: string;
  organization: string;
}

export type DatabaseConnection =
  | SQLConnection
  | MotherDuckConnection
  | TurboDBConnection
  | CloudflareConnection;
