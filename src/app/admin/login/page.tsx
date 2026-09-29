// src/app/admin/login/page.tsx
"use client";

import { useState, type SyntheticEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

type LoginResult = { ok: true } | { ok: false; error: string };

// Placeholders: replace these two functions once the Supabase project
//  and Google Cloud OAuth client exist. The UI below does not change.

async function signInWithGoogle(): Promise<void> {
  // TODO: supabase.auth.signInWithOAuth({ provider: "google", ... })
}

async function signInWithPassword(
  username: string,
  password: string,
): Promise<LoginResult> {
  // TODO: call the server action that checks whitelisted_users
  // (username match, password_hash verify, status = 'active').
  void username;
  void password;
  return { ok: false, error: "Username login is not connected yet." };
}

const inputClass =
  "h-10 w-full rounded-md border-2 border-input bg-white px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60";

export default function AdminLoginPage() {
  const router = useRouter();
  const close = () => router.back();

  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchView(toPassword: boolean) {
    setShowPasswordLogin(toPassword);
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError(null);
  }

  async function handlePasswordLogin(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setError("Enter your username and password.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await signInWithPassword(cleanUsername, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      onClick={close}
      className="relative isolate flex min-h-[calc(100vh-5rem)] cursor-pointer items-center justify-center overflow-hidden px-6"
    >
      <Image
        src="/assets/gate-hero.jpg"
        alt="Dimasalang National High School main entrance"
        fill
        className="object-cover"
        sizes="100vw"
      />
      {/* <div className="absolute inset-0 bg-secondary/90" /> */}
      <div className="absolute inset-0 bg-linear-to-t from-secondary via-secondary/70 to-secondary/10" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm cursor-auto overflow-hidden rounded-lg border border-white/15 bg-white shadow-xl"
      >
        <div className="h-1 bg-primary" />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8">
          <Image
            src="/assets/logo.png"
            alt="Dimasalang National High School seal"
            width={56}
            height={56}
            className="mx-auto h-14 w-14 rounded-full object-cover"
          />

          <h1 className="mt-4 text-center font-serif text-xl font-semibold text-foreground">
            Administrator Access
          </h1>

          {!showPasswordLogin ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Only Google accounts that have been added to the system
                whitelist can access the administrator (Admin/Staff) dashboard.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                If your account is not authorized, access will be denied even if
                you successfully sign in with Google.
              </p>

              <Button
                type="button"
                size="lg"
                onClick={signInWithGoogle}
                className="mt-6 w-full rounded-md border-2 border-input bg-white text-foreground hover:bg-muted"
              >
                <FcGoogle className="h-4 w-4" />
                Continue with Google
              </Button>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Won&apos;t continue with Google?{" "}
                <button
                  type="button"
                  onClick={() => switchView(true)}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Login here.
                </button>
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                Sign in with the username and password given to you by the
                system administrator.
              </p>

              <form
                onSubmit={handlePasswordLogin}
                noValidate
                className="mt-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={24}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full rounded-md"
                >
                  {submitting ? "Logging in..." : "Login"}
                </Button>
              </form>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => switchView(false)}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Back to Google sign-in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
