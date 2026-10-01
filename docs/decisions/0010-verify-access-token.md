# 0010: Verify the Cloudflare Access token

Date: 2026-10-01

Status: Accepted.

## Context

The app has no login. It trusts the email header that the proxy sets, and the docs require an authenticating proxy. On the owner's server, the Coolify reverse proxy also answers on the tailnet and the LAN. A request on that path skips Cloudflare Access, reaches the app, and sees the location history.

## Decision

1. `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` turn on a check in `src/proxy.ts`, which runs before every route.
2. The check verifies the `Cf-Access-Jwt-Assertion` token with `jose`: the signature against the team keys at `/cdn-cgi/access/certs`, the issuer, the audience, and the expiry.
3. A request without a valid token gets 403. A valid token sets the email header from the token, so a forged header has no effect.
4. `/api/health` and the static files skip the check. The health route shows no car data, and the container health check calls it without a token.
5. Without the two variables, the proxy does nothing. Other proxies and the demo work as before.

## Alternatives

1. A firewall rule on the server. It changes the network of every other service on the same proxy.
2. An IP allowlist on the reverse proxy for the tunnel only. It depends on labels that Coolify generates, and a redeploy can change them.

## Consequences

The app fetches the team keys from Cloudflare and keeps them in memory. If Cloudflare is down, the app also refuses requests, which is the safe failure.
