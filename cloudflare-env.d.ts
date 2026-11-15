declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ASSETS?: Fetcher;
    USER_KEY_ENCRYPTION_KEY?: string;
    SHARE_ACCESS_TOKEN?: string;
    OWNER_BILLING_APPROVED?: string;
    /** Set to "1" only on OpenAI Sites. Independent Workers must leave unset. */
    TRUST_SITES_AUTH_HEADERS?: string;
  }
}
