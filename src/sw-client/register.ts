export const OFFLINE_STATUS_EVENT = 'divan:offline-status';

export type OfflineStatusCode =
  | 'unsupported'
  | 'registering'
  | 'registered'
  | 'update_ready'
  | 'activating'
  | 'active'
  | 'error';

export interface OfflineStatusDetail {
  readonly code: OfflineStatusCode;
  readonly message: string;
  readonly releaseId: string | null;
}

export interface RegisterOfflineWorkerOptions {
  readonly serviceWorker?: ServiceWorkerContainer | null;
  readonly eventTarget?: EventTarget;
  readonly secureContext?: boolean;
  readonly expectedReleaseId?: string;
}

export interface OfflineActivationOptions {
  readonly replace?: (url: string) => void;
  readonly currentUrl?: string;
  readonly timeoutMs?: number;
  readonly setTimer?: (callback: () => void, milliseconds: number) => unknown;
  readonly clearTimer?: (handle: unknown) => void;
}

const pendingWorkerActivations = new WeakMap<ServiceWorker, () => void>();

const STATUS_MESSAGES: Readonly<Record<OfflineStatusCode, string>> = {
  unsupported: 'Offline support is unavailable in this browser.',
  registering: 'Preparing offline access.',
  registered: 'Offline access is being prepared.',
  update_ready: 'A verified poetry collection update is ready.',
  activating: 'Applying the verified offline update.',
  active: 'The verified offline experience is ready.',
  error: 'Offline preparation could not finish. The online experience is still available.',
};

export function parseOfflineStatusDetail(
  value: unknown,
): OfflineStatusDetail | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.keys(value).length !== 3 ||
    !('code' in value) ||
    !('message' in value) ||
    !('releaseId' in value) ||
    typeof value.code !== 'string' ||
    !(value.code in STATUS_MESSAGES) ||
    value.message !== STATUS_MESSAGES[value.code as OfflineStatusCode] ||
    !(
      value.releaseId === null ||
      (typeof value.releaseId === 'string' &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.releaseId))
    )
  ) {
    return null;
  }
  return {
    code: value.code as OfflineStatusCode,
    message: value.message,
    releaseId: value.releaseId,
  };
}

function emit(
  target: EventTarget,
  code: OfflineStatusCode,
  releaseId: string | null = null,
): void {
  target.dispatchEvent(
    new CustomEvent<OfflineStatusDetail>(OFFLINE_STATUS_EVENT, {
      detail: { code, message: STATUS_MESSAGES[code], releaseId },
    }),
  );
}

export async function registerOfflineWorker(
  options: RegisterOfflineWorkerOptions = {},
): Promise<ServiceWorkerRegistration | null> {
  const serviceWorker =
    options.serviceWorker === undefined
      ? typeof navigator === 'undefined'
        ? null
        : navigator.serviceWorker
      : options.serviceWorker;
  const eventTarget = options.eventTarget ??
    (typeof window === 'undefined' ? new EventTarget() : window);
  const secureContext = options.secureContext ??
    (typeof globalThis.isSecureContext === 'boolean' &&
      globalThis.isSecureContext);
  if (
    serviceWorker === null ||
    serviceWorker === undefined ||
    !secureContext
  ) {
    emit(eventTarget, 'unsupported');
    return null;
  }
  if (typeof serviceWorker.addEventListener === 'function') {
    serviceWorker.addEventListener('message', (event) => {
      const status = workerStatus(event.data);
      if (
        status !== null &&
        (status.releaseId === null ||
          options.expectedReleaseId === undefined ||
          status.releaseId === options.expectedReleaseId)
      ) {
        emit(eventTarget, status.code, status.releaseId);
      }
    });
  }
  emit(eventTarget, 'registering');
  try {
    const registration = await serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    const emitWaiting = () => {
      if (registration.waiting !== null) {
        emit(
          eventTarget,
          'update_ready',
          options.expectedReleaseId ?? null,
        );
      }
    };
    const watchInstalling = () => {
      const installing = registration.installing;
      if (installing === null || installing === undefined) {
        return;
      }
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') {
          emitWaiting();
        }
      });
    };
    registration.addEventListener?.('updatefound', watchInstalling);
    watchInstalling();
    if (registration.waiting === null) {
      emit(eventTarget, 'registered');
    } else {
      emitWaiting();
    }
    return registration;
  } catch {
    // Registration is an enhancement. Raw exceptions must not reach the UI or logs.
    emit(eventTarget, 'error');
    return null;
  }
}

function workerStatus(
  value: unknown,
): { readonly code: OfflineStatusCode; readonly releaseId: string | null } | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.keys(value).length !== 3 ||
    !('source' in value) ||
    value.source !== 'divan-service-worker' ||
    !('code' in value) ||
    !('releaseId' in value) ||
    !(
      value.releaseId === null ||
      (typeof value.releaseId === 'string' &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.releaseId))
    )
  ) {
    return null;
  }
  return value.code === 'update_ready' ||
    value.code === 'activating' ||
    value.code === 'active' ||
    value.code === 'error'
    ? { code: value.code, releaseId: value.releaseId }
    : null;
}

export function requestOfflineActivation(
  registration: ServiceWorkerRegistration,
  releaseId: string,
  options: OfflineActivationOptions = {},
): boolean {
  if (
    registration.waiting === null ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(releaseId)
  ) {
    return false;
  }
  const waiting = registration.waiting;
  if (
    typeof waiting.addEventListener !== 'function' ||
    typeof waiting.removeEventListener !== 'function'
  ) {
    return false;
  }
  const replace = options.replace ??
    (typeof window === 'undefined'
      ? undefined
      : window.location.replace.bind(window.location));
  const currentUrl = options.currentUrl ??
    (typeof window === 'undefined' ? undefined : window.location.href);
  const setTimer = options.setTimer ??
    ((callback, milliseconds) => setTimeout(callback, milliseconds));
  const clearTimer = options.clearTimer ??
    ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  pendingWorkerActivations.get(waiting)?.();
  let finished = false;
  const cleanup = () => {
    if (finished) {
      return;
    }
    finished = true;
    waiting.removeEventListener('statechange', handleStateChange);
    clearTimer(timeout);
    if (pendingWorkerActivations.get(waiting) === cleanup) {
      pendingWorkerActivations.delete(waiting);
    }
  };
  const handleStateChange = () => {
    if (waiting.state === 'activated') {
      cleanup();
      if (replace !== undefined && currentUrl !== undefined) {
        replace(currentUrl);
      }
    } else if (waiting.state === 'redundant') {
      cleanup();
    }
  };
  waiting.addEventListener('statechange', handleStateChange);
  pendingWorkerActivations.set(waiting, cleanup);
  const timeout = setTimer(cleanup, options.timeoutMs ?? 15_000);
  try {
    waiting.postMessage({
      type: 'ACTIVATE_READY_RELEASE',
      releaseId,
    });
    return true;
  } catch {
    cleanup();
    return false;
  }
}

export async function checkForOfflineUpdate(
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  try {
    await registration.update();
    return true;
  } catch {
    return false;
  }
}
