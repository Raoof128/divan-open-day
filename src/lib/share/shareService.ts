import type { PublicContentItem } from '../../contracts/content';
import {
  DEFAULT_SHARE_CONFIG,
  type ShareConfig,
  buildShareCardSvg,
  buildShareText,
} from './shareCard';

export type ShareOutcome =
  'shared' | 'copied' | 'cancelled' | 'copy-unavailable';

interface ClipboardLike {
  readonly writeText: (text: string) => Promise<void>;
}

interface NavLike {
  readonly share?: ((data: ShareData) => Promise<void>) | undefined;
  readonly canShare?: ((data?: ShareData) => boolean) | undefined;
  readonly clipboard?: ClipboardLike | undefined;
}

export interface ShareVerseDeps {
  readonly nav?: NavLike;
}

function resolveNav(deps?: ShareVerseDeps): NavLike {
  if (deps?.nav) {
    return deps.nav;
  }
  if (typeof navigator === 'undefined') {
    return {};
  }
  const n = navigator;
  return {
    share: typeof n.share === 'function' ? n.share.bind(n) : undefined,
    canShare: typeof n.canShare === 'function' ? n.canShare.bind(n) : undefined,
    clipboard:
      n.clipboard && typeof n.clipboard.writeText === 'function'
        ? { writeText: n.clipboard.writeText.bind(n.clipboard) }
        : undefined,
  };
}

/**
 * Share the verse locally. Prefers the Web Share API after a direct user
 * action (§15.2); falls back to a clipboard copy of the local text; reports a
 * benign cancellation when the visitor dismisses the share sheet. Never uploads
 * content and never uses a social SDK.
 */
export async function shareVerse(
  item: PublicContentItem,
  config: ShareConfig = DEFAULT_SHARE_CONFIG,
  deps?: ShareVerseDeps,
): Promise<ShareOutcome> {
  const nav = resolveNav(deps);
  const text = buildShareText(item, config);
  const payload: ShareData = { title: 'DIVAN', text };
  if (config.siteUrl.length > 0) {
    payload.url = config.siteUrl;
  }

  if (nav.share && (nav.canShare === undefined || nav.canShare(payload))) {
    try {
      await nav.share(payload);
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return 'cancelled';
      }
      // fall through to clipboard on any non-abort failure
    }
  }

  if (nav.clipboard) {
    await nav.clipboard.writeText(text);
    return 'copied';
  }
  return 'copy-unavailable';
}

export interface DownloadDeps {
  readonly createUrl?: (blob: Blob) => string;
  readonly revokeUrl?: (url: string) => void;
  readonly triggerDownload?: (url: string, filename: string) => void;
}

function defaultTriggerDownload(url: string, filename: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/**
 * Generate the share card as a downloadable SVG entirely in the browser,
 * creating and revoking the Blob URL correctly so nothing is retained after the
 * tab closes (§15.2).
 */
export function downloadShareCard(
  item: PublicContentItem,
  config: ShareConfig = DEFAULT_SHARE_CONFIG,
  deps?: DownloadDeps,
): void {
  const svg = buildShareCardSvg(item, config);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const createUrl = deps?.createUrl ?? ((b: Blob) => URL.createObjectURL(b));
  const revokeUrl =
    deps?.revokeUrl ??
    ((u: string) => {
      URL.revokeObjectURL(u);
    });
  const triggerDownload = deps?.triggerDownload ?? defaultTriggerDownload;
  const url = createUrl(blob);
  try {
    triggerDownload(url, `divan-${item.id}.svg`);
  } finally {
    revokeUrl(url);
  }
}
