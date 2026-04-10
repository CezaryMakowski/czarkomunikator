# NextAuth v5 Configuration Guide

## Co zostało skonfigurowane:

✅ **auth.ts** - Główna konfiguracja NextAuth z:

- Google OAuth
- GitHub OAuth
- Email Provider (magic links)
- Prisma Adapter dla przechowywania sesji w bazie danych
- Callbacki do zarządzania sesją i JWT

✅ **Middleware** - Ochrona tras aplikacji

✅ **API Route** - Handler NextAuth (`/api/auth/[...nextauth]/route.ts`)

✅ **Auth Helpers** - Funkcje pomocnicze do dostępu do danych użytkownika

✅ **Prisma Schema** - Dodany model `VerificationToken`

## Wymagane zmienne środowiskowe (.env.local)

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-32-char-secret
DATABASE_URL=postgresql://...

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...

# Email (optional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=...
EMAIL_SERVER_PASSWORD=...
EMAIL_FROM=noreply@example.com
```

## Jak generować NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Kroki do uruchomienia:

1. **Zainstaluj adapter Prisma dla NextAuth:**

```bash
npm install @auth/prisma-adapter
```

2. **Dodaj zmienne do .env.local** (na podstawie .env.example)

3. **Uruchom migrację Prisma:**

```bash
npx prisma migrate dev --name add_auth_models
```

4. **Generuj Prisma Client:**

```bash
npx prisma generate
```

5. **Uruchom dev server:**

```bash
npm run dev
```

## Korzystanie z autentykacji w komponentach

### Server Component (App Router)

```tsx
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Please sign in</div>;
  }

  return <div>Hello {user.name}</div>;
}
```

### Client Component

```tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <>
        {session.user?.email}
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }

  return <button onClick={() => signIn("google")}>Sign in with Google</button>;
}
```

### API Route

```typescript
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ user });
}
```

## Włączanie/Wyłączanie Providerów

Edytuj `auth.ts` aby dodać lub usunąć providery. Możesz używać:

- Google
- GitHub
- GitHub
- Discord
- Twitch
- Email
- i wielu innych...

Zobacz: https://authjs.dev/getting-started/providers

## Dodatkowe ustawienia

- **Session timeout**: Zmień `maxAge` w sekcji `session` w `auth.ts` (domyślnie 30 dni)
- **Custom pages**: Zmień ścieżki w sekcji `pages` (np. strony logowania)
- **Database strategy**: Aktualnie `strategy: "database"` - sesje są przechowywane w bazie
