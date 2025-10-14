// components/Footer.tsx
"use client";

import Link from "next/link";
import data from "@/data/socials.json";
import { siTiktok } from "simple-icons/icons";

/* minimal types (no `any`) */
type Platform = "instagram" | "facebook" | "tiktok" | "youtube";
type Profile = { url: string } | string;
type SocialData = { profiles: Record<Platform, Profile[]> };

const socialsData = data as unknown as SocialData;

function urlFor(platform: Platform) {
  const first = socialsData.profiles?.[platform]?.[0];
  return typeof first === "string" ? first : first?.url;
}

/* crisp SVG icons (same style as header) */
function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M14.5 8H16V5.2c-.5-.1-1.4-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9V11H7.5v2.8h2.4V22h3V13.8h2.5l.4-2.8h-2.9V8.9c0-.8.2-1.1 1.1-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconTiktok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d={siTiktok.path} fill="currentColor" />
    </svg>
  );
}
function IconYoutube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="10,9 16,12 10,15" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  const icons = [
    { href: urlFor("instagram"), label: "Instagram", Icon: IconInstagram },
    { href: urlFor("facebook"), label: "Facebook", Icon: IconFacebook },
    { href: urlFor("tiktok"), label: "TikTok", Icon: IconTiktok },
    { href: urlFor("youtube"), label: "YouTube", Icon: IconYoutube },
  ].filter((x) => !!x.href) as { href: string; label: string; Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element }[];

  return (
    <footer className="mt-24 mb-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Icons row */}
        <div className="flex items-center justify-center gap-6 text-app">
          {icons.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="hover:opacity-80"
              title={label}
            >
              <Icon className="w-7 h-7" />
            </a>
          ))}
        </div>

        {/* Links row */}
        <div className="mt-6 flex items-center justify-center gap-16 text-app">
          <Link
            href="/social"
            className="underline underline-offset-4 decoration-1 hover:opacity-80 text-xl"
          >
            Socials
          </Link>
          <Link
            href="/portfolio"
            className="underline underline-offset-4 decoration-1 hover:opacity-80 text-xl"
          >
            Portfolio
          </Link>
        </div>
      </div>
    </footer>
  );
}
