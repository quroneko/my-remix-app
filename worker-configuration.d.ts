/// <reference types="@remix-run/dev" />
/// <reference types="@cloudflare/workers-types" />
import '@remix-run/cloudflare'

interface Env {
	DB: D1Database;
}

declare global {
  interface CacheStorage {
    default: Cache
  }
}
