const HIERARCHICAL_RESOURCE_PATTERN =
  /(?:\b[A-Za-z][A-Za-z0-9+.-]*:\/\/|(?:^|[\s("'=])\/\/[A-Za-z0-9])/iu;
const BLOCKED_SCHEME_PATTERN =
  /(?:^|[^\p{L}\p{N}+.-])(?:data|blob|mailto|file|tel|ws|wss|ssh|sftp|https|http|ftp|ftps|javascript):/iu;

export function containsRemoteResource(value: string): boolean {
  return (
    HIERARCHICAL_RESOURCE_PATTERN.test(value) ||
    BLOCKED_SCHEME_PATTERN.test(value)
  );
}
