# Protect the dashboard

The dashboard has no login. It shows a location history: where the car parks, where it charges, and every route. Put an authenticating proxy in front of it, and never publish port 3000 to the internet.

## The rules

1. Bind the container port to `127.0.0.1`, or keep it on a private Docker network. The examples in [Installation](installation.md) do this.
2. Let only the proxy reach the app.
3. Make the proxy remove any identity header that the client sends. The app trusts the identity header that it receives.

## Identity and saved settings

The app saves Settings for each user. It reads the user's email from one request header:

| Proxy | Header | `IDENTITY_HEADER` value |
|---|---|---|
| Cloudflare Access | `Cf-Access-Authenticated-User-Email` | Default, no setting needed |
| Authelia, Authentik (forward auth) | `Remote-Email` | `remote-email` |
| oauth2-proxy | `X-Forwarded-Email` | `x-forwarded-email` |
| Tailscale Serve | `Tailscale-User-Login` | `tailscale-user-login` |

Without a valid email in the header, all users share one set of settings, saved under the key `owner`. This is fine for a dashboard that only you use.

## Cloudflare Access with a Cloudflare Tunnel

1. Run `cloudflared` on the host, and route a host name such as `tesla.example.com` to `http://127.0.0.1:3000`, or to `http://dashboard:3000` on the Docker network.
2. In Cloudflare Zero Trust, add a self-hosted application for the same host name.
3. Add a policy that allows only your email address.
4. Open the host name. Cloudflare asks for the login first, then sends the request with the email header.

The app needs no setting for this proxy.

## Tailscale

For a dashboard that stays on your tailnet:

1. Run the app on `127.0.0.1:3000`.
2. Publish it on the tailnet only:

   ```bash
   tailscale serve --bg 3000
   ```

3. Set `IDENTITY_HEADER=tailscale-user-login` so that each tailnet user gets their own settings.

Do not use `tailscale funnel`. It publishes the app to the internet.

## Forward authentication (Authelia, Authentik, oauth2-proxy)

1. Configure the reverse proxy (Caddy, Traefik, or nginx) to ask the authentication server before each request.
2. Forward the email header from the authentication server to the app.
3. Remove the same header from the client request.
4. Set `IDENTITY_HEADER` to the header name from the table above.

## Server actions and the host name

The Settings page saves through Next.js server actions. Next.js accepts an action only when the `Origin` header matches the `Host` header, or `X-Forwarded-Host`. Most proxies send the correct headers. If a save fails with "Not saved", make the proxy forward the original host.
