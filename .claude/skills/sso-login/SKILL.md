---
name: sso-login
description: Build Single Sign-On (SSO) login for a Next.js (App Router) app with Auth.js / NextAuth v5 — Google OAuth, LINE Login, and an email form — including the provider-console setup (Google Cloud, LINE Developers), the exact code files, env vars, redirect URIs, a protected dashboard, and logout. Use when the user wants to add login / sign-in / "เข้าสู่ระบบ" / SSO / OAuth / "Google login" / "LINE login" / auth to a Next.js app, or hits auth errors like redirect_uri_mismatch or "InvalidCheck: state". Do NOT use for non-Next.js stacks or for designing the data model.
---

# SSO login (Google + LINE + email) with NextAuth v5

A battle-tested recipe for adding SSO to a **Next.js 14 App Router** app. Two
halves must line up through ONE value — the **redirect URI**: the provider
(Google/LINE) only trusts the exact callback URL you register, and NextAuth only
sends that exact URL. Most failures are this mismatch.

## Architecture (why these choices)

- **Auth.js (NextAuth v5, `next-auth@beta`)** — App-Router-native: one config
  exports `handlers, auth, signIn, signOut`.
- **JWT session (no database)** — the session lives in a signed cookie. You do
  NOT need Supabase/Postgres for basic login. Add an adapter only when you need
  to persist users/accounts server-side.
- **Server-side protection** — a page calls `auth()`; if no session, `redirect('/login')`.

## The 3 methods at a glance

| Method | Backend | Creds you need | Works out of the box? |
|---|---|---|---|
| **Google** | `next-auth/providers/google` | Client ID + Secret (Google Cloud) | ✅ yes |
| **LINE** | `next-auth/providers/line` | Channel ID + Channel secret (LINE Developers) | ✅ yes |
| **Email/password** | `Credentials` provider | your own user store + password hashing | ⚠️ needs a user store — ship the UI, gate the handler honestly |

Email/password has no "provider dashboard" — it needs a database of users and
password verification. Until that exists, render the form but have the handler
say so plainly; never fake a success.

## Step 1 — install + env

```bash
npm i next-auth@beta
```

`.env.local` (git-ignore it!). `AUTH_SECRET` is **self-generated** (`npx auth secret`
or `openssl rand -base64 33`) — it signs the session cookie, not from any dashboard.
NextAuth v5 auto-reads `AUTH_<PROVIDER>_ID` / `AUTH_<PROVIDER>_SECRET`.

```bash
AUTH_SECRET=<random 32+ chars>
AUTH_GOOGLE_ID=<...apps.googleusercontent.com>
AUTH_GOOGLE_SECRET=<GOCSPX-...>
AUTH_LINE_ID=<Channel ID, numeric>
AUTH_LINE_SECRET=<Channel secret, hex>
```

Add to `.gitignore`: `.env.local` + `.env*.local`.

## Step 2 — the code (5 files)

**`src/auth.ts`** — central config:
```ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Line from 'next-auth/providers/line';
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, Line],
  pages: { signIn: '/login' },
});
```

**`app/api/auth/[...nextauth]/route.ts`** — handles every `/api/auth/*` endpoint:
```ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```
(NextAuth's own callback `/api/auth/callback/<provider>` is created automatically —
you do NOT write a callback route yourself in v5.)

**Login buttons** (client component) — the app's provider id **equals** the NextAuth id:
```ts
'use client';
import { signIn } from 'next-auth/react';
// Google / LINE:
signIn('google', { callbackUrl: '/dashboard' });
signIn('line',   { callbackUrl: '/dashboard' });
// email: no provider yet → show a notice, do not fake login
```

**`app/providers.tsx`** + wrap in `app/layout.tsx` so `useSession()` works anywhere:
```tsx
'use client';
import { SessionProvider } from 'next-auth/react';
export default function Providers({ children }) { return <SessionProvider>{children}</SessionProvider>; }
```

**Protected page** (server component) + **logout**:
```tsx
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (<>
    {session.user.name} / {session.user.email}
    <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
      <button>ออกจากระบบ</button>
    </form>
  </>);
}
```
Client-side logout anywhere: `import { signOut } from 'next-auth/react'; signOut({ callbackUrl: '/login' })`.

**`middleware.ts`** (optional route guard):
```ts
import { auth } from '@/auth';
export default auth((req) => {
  // const guarded = ['/add','/settings'];
  // if (!req.auth && guarded.some(p => req.nextUrl.pathname.startsWith(p)))
  //   return Response.redirect(new URL('/login', req.nextUrl));
});
export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
```

## Step 3 — provider consoles (the redirect URI is everything)

**Google Cloud** (console.cloud.google.com → APIs & Services):
- OAuth consent screen → External → add yourself under **Test users** (else "Access blocked").
- Credentials → Create OAuth client ID → **Web application**:
  - Authorized **JavaScript origins**: `http://localhost:3000` (origin only, no path, no trailing slash)
  - Authorized **redirect URIs**: `http://localhost:3000/api/auth/callback/google`
- Copy Client ID + Client Secret.

**LINE Developers** (developers.line.biz):
- Create a Provider → create a **LINE Login** channel (App type: Web app).
- Basic settings → **Channel ID** + **Channel secret**.
- LINE Login tab → **Callback URL**: `http://localhost:3000/api/auth/callback/line`
- (Email needs separate "Email address permission" approval; login works without it.)
- "Developing" status = only channel admins can log in (fine for dev).

## Step 4 — go to production (custom domain)

Everything above is `http://localhost:3000`. For a real domain, **ADD** the
production values — keep the localhost ones so dev still works (providers and
hosts accept multiple URLs).

**Host env vars** — set in the hosting dashboard (Vercel/Netlify/…), NOT `.env.local`:
- same keys: `AUTH_SECRET` (generate a **fresh** one for prod), `AUTH_GOOGLE_ID/SECRET`, `AUTH_LINE_ID/SECRET`
- `AUTH_TRUST_HOST=true`  — or `AUTH_URL=https://yourdomain.com`. Tells NextAuth the
  real origin when it runs behind a proxy/CDN. On Vercel it auto-detects, but set
  this explicitly for custom domains or any non-Vercel host, or the callback
  builds the wrong (internal) URL and OAuth breaks.

**Add production redirect URIs at each provider** (add, don't replace localhost):
```
Google  JS origins   : https://yourdomain.com
Google  redirect URIs: https://yourdomain.com/api/auth/callback/google
LINE    Callback URL : https://yourdomain.com/api/auth/callback/line
```

**Publish the apps** so non-testers can log in:
- Google **OAuth consent screen: Testing → Production** (Publish). A public app
  requesting profile/email may require Google's app verification before launch.
- LINE channel: **Developing → Published**.

**https is automatic** — on https NextAuth switches to secure (`__Secure-`) cookies
on its own; no code change. `signIn(…, { callbackUrl: '/dashboard' })` is relative,
so it works on any domain. Never commit prod secrets; rotate if leaked.

> Mental model: `localhost` and `yourdomain.com` are **two separate deployments**
> sharing the same code — each needs its own env on its host AND its own callback
> URL registered at every provider.

## Troubleshooting (the ones that actually happen)

| Symptom | Cause / fix |
|---|---|
| **`redirect_uri_mismatch`** (Error 400) | The exact callback URL isn't registered on that provider. Open the error's "error details" to see the URI it sent, paste THAT into the provider. Must match char-for-char: `http` (not https) for localhost, port, path `/api/auth/callback/<provider>`, no trailing slash. Check you edited the right OAuth client. |
| **`InvalidCheck: state value could not be parsed`** / "Server error: problem with the server configuration" | The state/PKCE cookie couldn't be read at callback — usually a stale cookie or the dev server **restarted mid-flow**. Fix: keep the server stable and retry in an **incognito window** (or clear localhost cookies). |
| **`error=Configuration`** | Missing/placeholder creds, or `AUTH_SECRET` unset. |
| Styles/JS 404 after a change | Running `next build` **while `next dev` is running** corrupts `.next`. Stop dev, `rm -rf .next`, restart dev. Never build against a live dev dir. |
| Env change ignored | `NEXT_PUBLIC_*` and `AUTH_*` are read at **startup** — restart `npm run dev`. |
| Secrets | Google Client Secret / LINE Channel secret are real secrets (stay server-side; NextAuth keeps them off the client). A Supabase `anon` key is public by design; a `service_role` key is NOT — never ship or paste it. |

## Adding more providers
`next-auth/providers/*` has Apple, Twitter(X=`twitter`), GitHub, etc. — each is
`import X from 'next-auth/providers/x'`, add to `providers[]`, set `AUTH_X_ID/SECRET`,
and register `http://localhost:3000/api/auth/callback/x`. **Only add providers the
spec asks for** — extra ones are scope creep; raise a change request first.
