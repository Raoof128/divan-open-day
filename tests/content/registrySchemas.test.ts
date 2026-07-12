import { describe, expect, it } from 'vitest';

import { registryBundleSchema } from '../../src/lib/content/registrySchemas';

type RegistryBundleFixture = ReturnType<typeof makeRegistryBundle>;

function replaceAsset(
  bundle: RegistryBundleFixture,
  asset: Record<string, unknown>,
): void {
  (bundle.assets as { assets: unknown[] }).assets = [asset];
}

function makeAsset(
  kind: 'audio' | 'font' | 'icon' | 'image' | 'ornament',
  path: string,
  mimeType: string,
): Record<string, unknown> {
  return {
    id: `test-${kind}-asset`,
    status: 'active',
    kind,
    path,
    mime_type: mimeType,
    sha256: '1'.repeat(64),
    bytes: 1_024,
    permission_record_id: `test-${kind}-permission`,
    performer_id: kind === 'audio' ? 'test-performer' : null,
    duration_seconds: kind === 'audio' ? 30 : null,
  };
}

function makeRegistryBundle() {
  return {
    editions: {
      schema_version: 1,
      editions: [
        {
          id: 'test-edition-hafez',
          status: 'active',
          poet: 'hafez',
          source_language: 'fa',
          citation: 'TEST ONLY edition citation',
          public_credit: 'TEST ONLY edition credit',
        },
      ],
    },
    contributors: {
      schema_version: 1,
      contributors: [
        {
          id: 'test-contributor',
          status: 'active',
          display_name: 'TEST ONLY contributor',
          roles: ['translator'],
        },
      ],
    },
    permissions: {
      schema_version: 1,
      permissions: [
        {
          id: 'test-translation-permission',
          status: 'active',
          kind: 'translation',
          subject_id: 'test-only-item',
          rights_owner: 'TEST ONLY rights owner',
          evidence_reference: 'TEST ONLY evidence reference',
          permitted_uses: [
            'website_display',
            'downloadable_share_card',
            'event_print',
            'archival_hosting',
          ],
          attribution: 'TEST ONLY attribution',
          modification_permitted: true,
          territories: ['AU'],
          expires_on: null,
        },
      ],
    },
    approvals: {
      schema_version: 1,
      approvals: [
        {
          id: 'test-final-approval',
          status: 'current',
          item_id: 'test-only-item',
          authoring_sha256: '0'.repeat(64),
          approved_by: 'test-final-approver',
          approved_at: '2026-07-12',
        },
      ],
    },
    assets: {
      schema_version: 1,
      assets: [
        {
          id: 'test-audio-asset',
          status: 'active',
          kind: 'audio',
          path: 'audio/test-only.mp3',
          mime_type: 'audio/mpeg',
          sha256: '1'.repeat(64),
          bytes: 1_024,
          permission_record_id: 'test-audio-permission',
          performer_id: 'test-performer',
          duration_seconds: 30,
        },
      ],
    },
  };
}

describe('registryBundleSchema', () => {
  it('accepts a complete strict registry bundle', () => {
    expect(registryBundleSchema.safeParse(makeRegistryBundle()).success).toBe(true);
  });

  it('rejects unknown registry and record fields', () => {
    const unknownRoot = makeRegistryBundle();
    Object.assign(unknownRoot, { private_notes: 'must not be accepted' });

    const unknownRecord = makeRegistryBundle();
    const edition = unknownRecord.editions.editions[0];
    if (edition !== undefined) {
      Object.assign(edition, { private_notes: 'must not be accepted' });
    }

    expect(registryBundleSchema.safeParse(unknownRoot).success).toBe(false);
    expect(registryBundleSchema.safeParse(unknownRecord).success).toBe(false);
  });

  it.each([
    ['editions', 'editions'],
    ['contributors', 'contributors'],
    ['permissions', 'permissions'],
    ['approvals', 'approvals'],
    ['assets', 'assets'],
  ] as const)('rejects duplicate IDs in the %s registry', (registryName, listName) => {
    const bundle = makeRegistryBundle();
    const registry = bundle[registryName] as unknown as Record<string, unknown>;
    const records = registry[listName] as unknown[];
    records.push(structuredClone(records[0]));

    expect(registryBundleSchema.safeParse(bundle).success).toBe(false);
  });

  it('requires complete rights evidence and territorial constraints', () => {
    const missingEvidence = makeRegistryBundle();
    Reflect.deleteProperty(
      missingEvidence.permissions.permissions[0] ?? {},
      'evidence_reference',
    );

    const invalidTerritory = makeRegistryBundle();
    const permission = invalidTerritory.permissions.permissions[0];
    if (permission !== undefined) {
      permission.territories = ['australia'];
    }

    expect(registryBundleSchema.safeParse(missingEvidence).success).toBe(false);
    expect(registryBundleSchema.safeParse(invalidTerritory).success).toBe(false);
  });

  it.each([
    ['a subset', ['website_display']],
    [
      'a duplicate in place of a required use',
      [
        'website_display',
        'website_display',
        'event_print',
        'archival_hosting',
      ],
    ],
  ])('rejects permitted uses containing %s', (_description, permittedUses) => {
    const bundle = makeRegistryBundle();
    const permission = bundle.permissions.permissions[0];
    if (permission !== undefined) {
      permission.permitted_uses = permittedUses;
    }

    expect(registryBundleSchema.safeParse(bundle).success).toBe(false);
  });

  it.each([
    ['unassigned alpha-2 code', ['ZZ']],
    ['worldwide mixed with a country', ['worldwide', 'AU']],
    ['duplicate country codes', ['AU', 'AU']],
  ])('rejects territories containing %s', (_description, territories) => {
    const bundle = makeRegistryBundle();
    const permission = bundle.permissions.permissions[0];
    if (permission !== undefined) {
      permission.territories = territories;
    }

    expect(registryBundleSchema.safeParse(bundle).success).toBe(false);
  });

  it('accepts worldwide as the sole territory', () => {
    const bundle = makeRegistryBundle();
    const permission = bundle.permissions.permissions[0];
    if (permission !== undefined) {
      permission.territories = ['worldwide'];
    }

    expect(registryBundleSchema.safeParse(bundle).success).toBe(true);
  });

  it('requires real ISO dates and lowercase SHA-256 digests', () => {
    const invalidApproval = makeRegistryBundle();
    const approval = invalidApproval.approvals.approvals[0];
    if (approval !== undefined) {
      approval.approved_at = '2026-99-99';
      approval.authoring_sha256 = 'NOT-A-DIGEST';
    }

    expect(registryBundleSchema.safeParse(invalidApproval).success).toBe(false);
  });

  it('requires complete type-correct audio asset metadata', () => {
    const invalidAsset = makeRegistryBundle();
    const asset = invalidAsset.assets.assets[0];
    if (asset !== undefined) {
      Reflect.set(asset, 'performer_id', null);
      asset.mime_type = 'image/png';
    }

    expect(registryBundleSchema.safeParse(invalidAsset).success).toBe(false);
  });

  it.each([
    ['audio//test-only.mp3'],
    ['audio/recitations//test-only.mp3'],
  ])('rejects asset paths with empty segments: %s', (path) => {
    const bundle = makeRegistryBundle();
    const asset = bundle.assets.assets[0];
    if (asset !== undefined) {
      asset.path = path;
    }

    expect(registryBundleSchema.safeParse(bundle).success).toBe(false);
  });

  it.each([
    ['font', 'fonts/test-only.woff2', 'font/woff2'],
    ['image', 'images/test-only.avif', 'image/avif'],
    ['image', 'images/test-only.webp', 'image/webp'],
    ['image', 'images/test-only.png', 'image/png'],
    ['icon', 'icons/test-only.svg', 'image/svg+xml'],
    ['ornament', 'icons/test-ornament.svg', 'image/svg+xml'],
    ['audio', 'audio/test-only.mp3', 'audio/mpeg'],
    ['audio', 'audio/test-only.ogg', 'audio/ogg'],
  ] as const)(
    'accepts a coupled %s asset at %s with %s',
    (kind, path, mimeType) => {
      const bundle = makeRegistryBundle();
      replaceAsset(bundle, makeAsset(kind, path, mimeType));

      expect(registryBundleSchema.safeParse(bundle).success).toBe(true);
    },
  );

  it.each([
    ['font using an image contract', 'font', 'images/test-only.png', 'image/png'],
    ['image using a font contract', 'image', 'fonts/test-only.woff2', 'font/woff2'],
    ['raster image declared as SVG', 'image', 'images/test-only.svg', 'image/svg+xml'],
    ['icon outside the icon root', 'icon', 'images/test-only.svg', 'image/svg+xml'],
    ['audio outside the audio root', 'audio', 'images/test-only.mp3', 'audio/mpeg'],
    ['MP3 MIME with an OGG extension', 'audio', 'audio/test-only.ogg', 'audio/mpeg'],
    ['AVIF MIME with a PNG extension', 'image', 'images/test-only.png', 'image/avif'],
  ] as const)(
    'rejects %s',
    (_description, kind, path, mimeType) => {
      const bundle = makeRegistryBundle();
      replaceAsset(bundle, makeAsset(kind, path, mimeType));

      expect(registryBundleSchema.safeParse(bundle).success).toBe(false);
    },
  );
});
