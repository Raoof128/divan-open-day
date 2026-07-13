#!/bin/sh
set -eu

release_file=/srv/release.json

[ -f /srv/index.html ] || [ -f "$release_file" ] || exit 1
[ -r "$release_file" ] || exit 1

extract_string() {
  key=$1
  sed -n "s/.*\"${key}\":\"\([^\"]*\)\".*/\1/p" "$release_file"
}

extract_integer() {
  key=$1
  sed -n "s/.*\"${key}\":\([0-9][0-9]*\).*/\1/p" "$release_file"
}

content_path=$(extract_string contentPath)
content_sha=$(extract_string contentSha256)
hafez_count=$(extract_integer hafezCount)
rumi_count=$(extract_integer rumiCount)
item_count=$(extract_integer itemCount)

case "$content_path" in
  /content/????????????????????????????????????????????????????????????????.json) ;;
  *) exit 1 ;;
esac
case "$content_sha" in
  *[!0-9a-f]*|'') exit 1 ;;
esac
[ "${#content_sha}" -eq 64 ] || exit 1
[ "$hafez_count" -ge 24 ] || exit 1
[ "$rumi_count" -ge 16 ] || exit 1
[ "$item_count" -eq $((hafez_count + rumi_count)) ] || exit 1

content_file="/srv${content_path}"
[ -f "$content_file" ] || exit 1
actual_sha=$(sha256sum "$content_file" | awk '{print $1}')
[ "$actual_sha" = "$content_sha" ] || exit 1

wget -q -O /dev/null http://127.0.0.1:8080/healthz
