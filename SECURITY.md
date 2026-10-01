# Security policy

## Report a vulnerability

Do not open a public issue for a security problem.

1. Open the repository on GitHub.
2. Go to Security, then "Report a vulnerability".
3. Describe the problem, the affected version, and the steps to reproduce it.

You get an answer within 7 days. A fix and an advisory follow as soon as possible.

## Supported versions

Only the latest release gets security fixes.

## Security model

- The app has no login. It must run behind an authenticating proxy. Read [Protect the dashboard](docs/authentication.md).
- The app trusts the identity header that the proxy sets. The proxy must remove that header from client requests.
- The app connects to the database with a read-only role. It refuses the TeslaMate superuser. Every session is read-only and has a statement timeout.
- The app never sends database values to the browser outside the rendered pages.
- The container runs as an unprivileged user.

These reports are in scope:

- a way to write to the TeslaMate database through the app,
- a way to read data from the app without passing the proxy, when the deployment follows the docs,
- cross-site scripting or request forgery in the app,
- a leak of secrets or database values into logs, HTML, or client bundles.
