export interface Env {
  KV_FILESYSTEM: Fetcher;
  KV_FS_API_KEY: string;
  JWT_ADMIN_SECRET: string;
  ADMIN_PATH?: string;
  ADMIN_PASSWORD?: string;
}
