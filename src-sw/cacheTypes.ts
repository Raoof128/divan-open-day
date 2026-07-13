export interface CacheLike {
  match(request: RequestInfo | URL): Promise<Response | undefined>;
  put(request: RequestInfo | URL, response: Response): Promise<void>;
  delete(request: RequestInfo | URL): Promise<boolean>;
}

export interface CacheStorageLike {
  open(cacheName: string): Promise<CacheLike>;
  delete(cacheName: string): Promise<boolean>;
  keys(): Promise<string[]>;
}

export interface CryptoLike {
  readonly subtle: Pick<SubtleCrypto, 'digest'>;
}
