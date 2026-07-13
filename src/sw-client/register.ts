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
}

export interface RegisterOfflineWorkerOptions {
  readonly serviceWorker?: ServiceWorkerContainer | null;
  readonly eventTarget?: EventTarget;
}

const STATUS_MESSAGES: Readonly<Record<OfflineStatusCode, string>> = {
  unsupported: 'Offline support is unavailable in this browser.',
  registering: 'Preparing offline access.',
  registered: 'Offline access is being prepared.',
  update_ready: 'A verified poetry collection update is ready.',
  activating: 'Applying the verified offline update.',
  active: 'The verified offline experience is ready.',
  error: 'Offline preparation could not finish. The online experience is still available.',
};

function emit(
  target: EventTarget,
  code: OfflineStatusCode,
): void {
  target.dispatchEvent(
    new CustomEvent<OfflineStatusDetail>(OFFLINE_STATUS_EVENT, {
      detail: { code, message: STATUS_MESSAGES[code] },
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
  if (serviceWorker === null || serviceWorker === undefined) {
    emit(eventTarget, 'unsupported');
    return null;
  }
  if (typeof serviceWorker.addEventListener === 'function') {
    serviceWorker.addEventListener('message', (event) => {
      const code = workerStatusCode(event.data);
      if (code !== null) {
        emit(eventTarget, code);
      }
    });
  }
  emit(eventTarget, 'registering');
  try {
    const registration = await serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    emit(eventTarget, registration.waiting === null ? 'registered' : 'update_ready');
    return registration;
  } catch {
    // Registration is an enhancement. Raw exceptions must not reach the UI or logs.
    emit(eventTarget, 'error');
    return null;
  }
}

function workerStatusCode(value: unknown): OfflineStatusCode | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    Object.keys(value).length !== 2 ||
    !('source' in value) ||
    value.source !== 'divan-service-worker' ||
    !('code' in value)
  ) {
    return null;
  }
  return value.code === 'update_ready' ||
    value.code === 'active' ||
    value.code === 'error'
    ? value.code
    : null;
}

export function requestOfflineActivation(
  registration: ServiceWorkerRegistration,
): void {
  if (registration.waiting === null) {
    return;
  }
  registration.waiting.postMessage({ type: 'ACTIVATE_READY_RELEASE' });
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
