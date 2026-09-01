/**
 * Company OpenID SSO — Nacos naming consumer (OpenAPI, no SDK).
 *
 * Resolves the corporate `auth-service` base url through Nacos service
 * discovery so hardcoded instance IPs never leak into config (instances are
 * ephemeral and move on migration). Consumer-only: Langfuse never registers
 * itself. Deliberately SDK-free — the Nacos 1.x HTTP OpenAPI (verified live
 * against ehr-nacos.netease.com, 2026-08-31) is all we need, and it avoids
 * pulling gRPC-heavy nacos SDK deps into the Next.js server bundle.
 *
 * See openspec/changes/company-openid-sso/design.md (决策 2).
 */
import { env } from "@/src/env.mjs";
import { logger, traceException } from "@langfuse/shared/src/server";

interface NacosInstance {
  ip: string;
  port: number;
  healthy: boolean;
  enabled: boolean;
}

interface InstanceListResponse {
  hosts?: NacosInstance[];
}

interface LoginResponse {
  accessToken?: string;
  tokenTtl?: number; // seconds
}

const INSTANCES_TTL_MS = 10_000; // matches Nacos default cacheMillis
const TOKEN_REFRESH_MARGIN_S = 60;

let tokenCache: { accessToken: string; expiresAt: number } | null = null;
let instancesCache: { instances: NacosInstance[]; fetchedAt: number } | null =
  null;

/** Normalize configured base urls: accept `host:port` or full `…/nacos` bases. */
function nacosBaseUrls(): string[] {
  if (!env.COMPANY_SSO_NACOS_ADDR) return [];
  return env.COMPANY_SSO_NACOS_ADDR.split(",")
    .map((u) => {
      let base = u.trim().replace(/\/+$/, "");
      if (!base.endsWith("/nacos")) base += "/nacos";
      return base;
    })
    .filter((u) => u.length > 0);
}

export function isNacosDiscoveryConfigured(): boolean {
  return (
    nacosBaseUrls().length > 0 &&
    env.COMPANY_SSO_NACOS_NAMESPACE !== undefined &&
    env.COMPANY_SSO_NACOS_USERNAME !== undefined &&
    env.COMPANY_SSO_NACOS_PASSWORD !== undefined
  );
}

async function login(base: string): Promise<string> {
  if (
    tokenCache &&
    tokenCache.expiresAt > Date.now() + TOKEN_REFRESH_MARGIN_S * 1000
  ) {
    return tokenCache.accessToken;
  }
  const res = await fetch(`${base}/v1/auth/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: env.COMPANY_SSO_NACOS_USERNAME ?? "",
      password: env.COMPANY_SSO_NACOS_PASSWORD ?? "",
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`nacos login failed: HTTP ${res.status} (${base})`);
  }
  const json = (await res.json()) as LoginResponse;
  if (!json.accessToken) throw new Error(`nacos login: no accessToken (${base})`);
  tokenCache = {
    accessToken: json.accessToken,
    // refresh earlier than ttl when ttl is small/missing
    expiresAt: Date.now() + Math.max(json.tokenTtl ?? 300, 120) * 1000,
  };
  return tokenCache.accessToken;
}

async function fetchInstancesFrom(base: string): Promise<NacosInstance[]> {
  const accessToken = await login(base);
  const qs = new URLSearchParams({
    serviceName: env.COMPANY_SSO_NACOS_SERVICE_NAME ?? "auth-service",
    namespaceId: env.COMPANY_SSO_NACOS_NAMESPACE ?? "",
    accessToken,
  });
  const res = await fetch(`${base}/v1/ns/instance/list?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`nacos instance list failed: HTTP ${res.status} (${base})`);
  }
  const json = (await res.json()) as InstanceListResponse;
  return json.hosts ?? [];
}

async function fetchInstances(): Promise<NacosInstance[]> {
  if (
    instancesCache &&
    Date.now() - instancesCache.fetchedAt < INSTANCES_TTL_MS
  ) {
    return instancesCache.instances;
  }
  let lastError: unknown = null;
  for (const base of nacosBaseUrls()) {
    try {
      const instances = await fetchInstancesFrom(base);
      instancesCache = { instances, fetchedAt: Date.now() };
      return instances;
    } catch (e) {
      lastError = e;
      logger.warn("company-sso: nacos base unreachable, trying next", {
        base,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  traceException(lastError instanceof Error ? lastError : new Error(String(lastError)));
  return instancesCache?.instances ?? [];
}

/**
 * Base url of one healthy auth-service instance, or null when discovery is
 * not configured / no healthy instance is known. `COMPANY_SSO_AUTH_BASE_URL`
 * overrides discovery entirely (direct-address deployments, tests).
 */
export async function pickAuthServiceBaseUrl(): Promise<string | null> {
  if (env.COMPANY_SSO_AUTH_BASE_URL) {
    return env.COMPANY_SSO_AUTH_BASE_URL.replace(/\/+$/, "");
  }
  if (!isNacosDiscoveryConfigured()) return null;
  const instances = await fetchInstances();
  const healthy = instances.filter((i) => i.healthy && i.enabled);
  if (healthy.length === 0) {
    logger.error("company-sso: no healthy auth-service instance from nacos");
    return null;
  }
  const picked = healthy[Math.floor(Math.random() * healthy.length)];
  return `http://${picked.ip}:${picked.port}`;
}
