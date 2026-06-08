/**
 * Infisical Wrap - TypeScript SDK for Infisical Secret Management Platform
 * https://github.com/q15004040209-creator/infisical-wrap
 *
 * @example
 * ```typescript
 * import { InfisicalClient } from 'infisical-wrap';
 *
 * const client = new InfisicalClient({
 *   token: 'your-universal-auth-token',
 *   projectId: 'your-project-id'
 * });
 *
 * const secrets = await client.listSecrets({ environment: 'dev', path: '/' });
 * const apiKey = secrets.find(s => s.key === 'API_KEY')?.value;
 * ```
 */

import https from 'https';
import http from 'http';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InfisicalClientOptions {
  /** Infisical authentication token (Universal Auth recommended) */
  token: string;
  /** Infisical site URL (self-hosting users set this) */
  siteUrl?: string;
  /** Request timeout in ms (default: 60000) */
  requestTimeout?: number;
}

export interface Secret {
  id: string;
  key: string;
  value: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecretReference {
  id: string;
  secretPath: string;
  environment: string;
  workspace: string;
  secretKey: string;
  secretValue: string;
  secretComment?: string;
}

export interface KMSKey {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  serialNumber: string;
  commonName: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  status: string;
}

export interface Project {
  id: string;
  name: string;
  environmentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// HTTP Helper
// ---------------------------------------------------------------------------

function buildUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
  const url = new URL(path, baseUrl);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function httpRequest<T>(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeout?: number;
  } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? '443' : '80'),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 60000,
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed as T);
          }
        } catch {
          reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Main Client
// ---------------------------------------------------------------------------

export class InfisicalClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: InfisicalClientOptions) {
    if (!options.token) {
      throw new Error('Infisical token is required');
    }
    this.token = options.token;
    this.baseUrl = (options.siteUrl || 'https://app.infisical.com').replace(/\/$/, '');
    this.timeout = options.requestTimeout || 60000;
  }

  // -------------------------------------------------------------------------
  // Internal request helper
  // -------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    return httpRequest<T>(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timeout: this.timeout,
    });
  }

  // -------------------------------------------------------------------------
  // Secrets API
  // -------------------------------------------------------------------------

  /**
   * List all secrets in a project environment/path
   */
  async listSecrets(params: {
    projectId: string;
    environment: string;
    path?: string;
    includeImports?: boolean;
  }): Promise<{ secrets: Secret[] }> {
    return this.request<{ secrets: Secret[] }>('GET', '/api/v3/secrets', {
      ...params,
      path: params.path || '/',
    });
  }

  /**
   * Get a single secret by key
   */
  async getSecret(params: {
    projectId: string;
    environment: string;
    secretName: string;
    path?: string;
  }): Promise<SecretReference> {
    const { projectId, environment, secretName, path = '/' } = params;
    return this.request<SecretReference>(
      'GET',
      `/api/v3/secrets/${secretName}`,
      undefined,
      { projectId, environment, path }
    );
  }

  /**
   * Create or update a secret
   */
  async setSecret(params: {
    projectId: string;
    environment: string;
    secretName: string;
    secretValue: string;
    secretComment?: string;
    path?: string;
    skipMultilineEncoding?: boolean;
  }): Promise<Secret> {
    const { projectId, environment, secretName, secretValue, secretComment, path = '/', skipMultilineEncoding } = params;
    return this.request<Secret>('POST', '/api/v3/secrets', {
      projectId,
      environment,
      secrets: [
        {
          secretKey: secretName,
          secretValue,
          secretComment: secretComment || '',
          skipMultilineEncoding: skipMultilineEncoding || false,
          type: 'shared',
        },
      ],
      path,
    });
  }

  /**
   * Delete a secret
   */
  async deleteSecret(params: {
    projectId: string;
    environment: string;
    secretName: string;
    path?: string;
  }): Promise<void> {
    const { projectId, environment, secretName, path = '/' } = params;
    await this.request('DELETE', `/api/v3/secrets/${secretName}`, undefined, {
      projectId,
      environment,
      path,
    });
  }

  /**
   * Batch create or update multiple secrets at once
   */
  async batchSetSecrets(params: {
    projectId: string;
    environment: string;
    secrets: Array<{ key: string; value: string; comment?: string }>;
    path?: string;
  }): Promise<{ secrets: Secret[] }> {
    const { projectId, environment, secrets, path = '/' } = params;
    return this.request<{ secrets: Secret[] }>('POST', '/api/v3/secrets/batch', {
      projectId,
      environment,
      secrets: secrets.map((s) => ({
        secretKey: s.key,
        secretValue: s.value,
        secretComment: s.comment || '',
        skipMultilineEncoding: false,
        type: 'shared',
      })),
      path,
    });
  }

  // -------------------------------------------------------------------------
  // Projects API
  // -------------------------------------------------------------------------

  /**
   * List all projects the token has access to
   */
  async listProjects(): Promise<{ projects: Project[] }> {
    return this.request<{ projects: Project[] }>('GET', '/api/v1/projects');
  }

  // -------------------------------------------------------------------------
  // KMS API
  // -------------------------------------------------------------------------

  /**
   * List all KMS keys in a project
   */
  async listKMSKeys(params: {
    projectId: string;
  }): Promise<{ keys: KMSKey[] }> {
    return this.request<{ keys: KMSKey[] }>('GET', `/api/v1/kms/${params.projectId}/keys`);
  }

  /**
   * Encrypt data using a KMS key
   */
  async encryptKMS(params: {
    projectId: string;
    keyId: string;
    plaintext: string;
  }): Promise<{ ciphertext: string }> {
    return this.request<{ ciphertext: string }>(
      'POST',
      `/api/v1/kms/${params.projectId}/keys/${params.keyId}/encrypt`,
      { plaintext: params.plaintext }
    );
  }

  /**
   * Decrypt data using a KMS key
   */
  async decryptKMS(params: {
    projectId: string;
    keyId: string;
    ciphertext: string;
  }): Promise<{ plaintext: string }> {
    return this.request<{ plaintext: string }>(
      'POST',
      `/api/v1/kms/${params.projectId}/keys/${params.keyId}/decrypt`,
      { ciphertext: params.ciphertext }
    );
  }

  // -------------------------------------------------------------------------
  // Certificate API
  // -------------------------------------------------------------------------

  /**
   * List certificates in a project
   */
  async listCertificates(params: {
    projectId: string;
    caId?: string;
  }): Promise<{ certificates: Certificate[] }> {
    return this.request<{ certificates: Certificate[] }>(
      'GET',
      `/api/v1/pki/${params.projectId}/certificates`,
      undefined,
      params.caId ? { caId: params.caId } : undefined
    );
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default InfisicalClient;
export { InfisicalClient as Client };