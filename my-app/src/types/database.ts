export type BaseConnection = {
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
};

export type SQLConnection = BaseConnection & {
  type: "mysql" | "postgresql" | "clickhouse";
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
};

export type MotherDuckConnection = BaseConnection & {
  type: "motherduck";
  database: string;
  token: string;
};

export type TurboDBConnection = BaseConnection & {
  type: "turbodb";
  database: string;
  apiKey: string;
  organization: string;
};

export type CloudflareConnection = BaseConnection & {
  type: "cloudflare";
  accountId: string;
  apiToken: string;
  databaseId: string;
};

export type DatabaseConnection =
  | SQLConnection
  | MotherDuckConnection
  | TurboDBConnection
  | CloudflareConnection;
