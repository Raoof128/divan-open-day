export type BuildProfile = 'fixture' | 'production';

export const MAX_RELEASE_ASSET_BYTES = 100_000_000;

export interface ReleaseDescriptor {
  readonly releaseId: string;
  readonly schemaVersion: 2;
  readonly builtAt: string;
  readonly buildProfile: BuildProfile;
  readonly productionEligible: boolean;
  readonly itemCount: number;
  readonly hafezCount: number;
  readonly rumiCount: number;
  readonly contentPath: string;
  readonly contentSha256: string;
  readonly assetManifestPath: string;
  readonly assetManifestSha256: string;
}

export interface ReleaseAsset {
  readonly path: string;
  readonly mimeType:
    | 'application/manifest+json'
    | 'audio/mpeg'
    | 'audio/ogg'
    | 'font/woff2'
    | 'image/avif'
    | 'image/png'
    | 'image/svg+xml'
    | 'image/webp'
    | 'text/css'
    | 'text/html'
    | 'text/javascript'
    | 'video/mp4';
  readonly sha256: string;
  readonly bytes: number;
  readonly requiredOffline: boolean;
}

export interface AssetManifest {
  readonly releaseId: string;
  readonly assets: readonly ReleaseAsset[];
}
