// components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import data from "@/data/socials.json";
import { siTiktok } from "simple-icons/icons"; // official TikTok path

/* helpers */
function usePageLabel(pathname: string) {
  if (pathname.startsWith("/social")) return "Socials";   // ← fix label
  if (pathname.startsWith("/portfolio")) return "Portfolio";
  return "";
}
function getProfileUrl(platform: "instagram" | "facebook" | "tiktok" | "youtube") {
  const list = (data as any).profiles?.[platform] ?? [];
  const first = list[0];
  return typeof first === "string" ? first : first?.url;
}

/* NK logo */
function Logo() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-label="Site logo" className="icon">
      <circle cx="32" cy="32" r="31" fill="currentColor" opacity="0.08" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        style={{ fontFamily: "var(--font-geist-sans)" }}
        fontSize="26"
        fontWeight="800"
        fill="currentColor"
      >
        NK
      </text>
    </svg>
  );
}

/* crisp icons */
function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className ?? ""}`} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className ?? ""}`} {...rest}>
      <path
        d="M14.5 8H16V5.2c-.5-.1-1.4-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9V11H7.5v2.8h2.4V22h3V13.8h2.5l.4-2.8h-2.9V8.9c0-.8.2-1.1 1.1-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
/* Accurate TikTok glyph (Simple Icons) */
function IconTiktok(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className ?? ""}`} {...rest}>
      <path d={siTiktok.path} fill="currentColor" />
    </svg>
  );
}
function IconYoutube(props: React.SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" className={`icon ${className ?? ""}`} {...rest}>
      <rect x="2" y="6" width="20" height="12" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <polygon points="10,9 16,12 10,15" fill="currentColor" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const label = usePageLabel(pathname);

  const links = [
    { href: "/social", text: "Socials", active: pathname.startsWith("/social") },
    { href: "/portfolio", text: "Portfolio", active: pathname.startsWith("/portfolio") },
  ];

  const socials = [
    { href: getProfileUrl("instagram"), Icon: IconInstagram, label: "Instagram" },
    { href: getProfileUrl("facebook"),  Icon: IconFacebook,  label: "Facebook"  },
    { href: getProfileUrl("tiktok"),    Icon: IconTiktok,    label: "TikTok"    },
    { href: getProfileUrl("youtube"),   Icon: IconYoutube,   label: "YouTube"   },
  ].filter(Boolean) as { href: string; Icon: any; label: string }[];

  return (
    <header>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-12 md:py-14">
        <div className="flex items-start justify-between gap-4">
          {/* Left: logo + section-heading style title (NOT truncated) */}
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/" aria-label="Home" className="text-app"><Logo /></Link>
            {label ? (
              <div className="font-serif font-normal tracking-tight text-5xl md:text-6xl lg:text-7xl">
                {label}
              </div>
            ) : null}
          </div>

         {/* Right: toggle on top; then links; then icons (mobile). Collapses to one row at sm: */}
<div className="flex flex-col items-end gap-2 sm:gap-3">
  {/* Row 1: Theme toggle */}
  <ThemeToggle inline sizePx={26} />

  {/* Row 2+3 on mobile, collapses into a single row on >= sm */}
  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-5">
    {/* Row 2: navigation (right-aligned) */}
    <nav className="flex items-center gap-4 text-[15px] sm:text-base">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={[
            "relative",
            l.active
              ? "after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:bg-current"
              : "hover:opacity-75",
          ].join(" ")}
        >
          {l.text}
        </Link>
      ))}
    </nav>

    {/* Row 3: social icons (right-aligned) */}
    <div className="flex items-center gap-4">
      {socials.map(({ href, Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="rounded hover:opacity-85"
          title={label}
        >
          <Icon
            className={
              label === "TikTok"
                ? "w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" // slightly smaller TikTok on all sizes
                : "w-6 h-6 sm:w-7 sm:h-7"
            }
          />
        </a>
      ))}
    </div>
  </div>
</div>

        </div>
      </div>
    </header>
  );
}
