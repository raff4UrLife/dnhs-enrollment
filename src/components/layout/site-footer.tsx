import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground/80">
      <div className="h-1 bg-primary" />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logo.png"
              alt="Dimasalang National High School seal"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-serif text-base font-semibold text-primary">
              Dimasalang National High School
            </span>
          </div>
          <p className="mt-3 text-sm">Poblacion, Dimasalang, Masbate</p>
          <p className="text-sm">Founded 1952</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-primary">
            Quick Links
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/enrollment-form" className="hover:text-white">
                Pre-Enrollment Form
              </Link>
            </li>
            <li>
              <Link href="/developers" className="hover:text-white">
                Developer Team
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-primary">
            Contact
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Dimasalang National High School</li>
            <li>Office hours: Mon–Fri, 8:00 AM – 4:00 PM</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Dimasalang National High School. All rights
        reserved.
      </div>
    </footer>
  );
}
