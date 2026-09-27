"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const close = () => router.back();

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

          <p className="mt-4 text-sm text-muted-foreground">
            Only Google accounts that have been added to the system whitelist
            can access the administrator (Admin/Staff) dashboard.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            If your account is not authorized, access will be denied even if you
            successfully sign in with Google.
          </p>

          <Button
            size="lg"
            className="mt-6 w-full rounded-md border-2 border-input bg-white text-foreground hover:bg-muted"
          >
            <FcGoogle className="h-4 w-4" />
            Continue with Google
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Need access?{" "}
            <span className="font-medium text-foreground">
              Contact the system administrator.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
