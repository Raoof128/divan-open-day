# Synthetic operations fixtures

Every file in this directory is synthetic test input. The reserved `.invalid`
hostnames, zero identifiers, example image digests, mock commands, and sentinel
text cannot authenticate to a service or identify a deployment.

`synthetic-not-a-credential.json` contains a test sentinel used to prove that
deployment scripts do not print file contents. It is not a Cloudflare tunnel
credential and must not be replaced with one. Tests must use temporary files
for permission and ownership cases, and those files must contain synthetic data
only.
