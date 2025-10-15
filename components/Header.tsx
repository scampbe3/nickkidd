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
<div className="grid grid-cols-2 grid-rows-[auto_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
{/* row 1, col 1 — Logo (top-left on mobile) */}
<div className="justify-self-start self-center">
  <Link href="/" aria-label="Home" className="text-app"><Logo /></Link>
</div>

{/* row 2, col 1 — Big page title (left) */}
<div className="col-span-1 row-start-2">
  {label ? (
    <div className="font-serif font-normal tracking-tight text-5xl md:text-6xl lg:text-7xl">
      {label}
    </div>
  ) : null}
</div>


   {/* row 1, col 2 — Theme toggle (top-right on mobile) */}
<div className="justify-self-end self-start sm:order-2">
  <ThemeToggle inline sizePx={26} />
</div>

{/* row 2, col 2 — Right side: icons row ABOVE links row (both right-aligned on mobile) */}
<div className="col-span-1 row-start-2 justify-self-end self-center flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-5">
  {/* Icons row (first on mobile) */}
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
              ? "w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" // keep TikTok slightly smaller only
              : "w-6 h-6 sm:w-7 sm:h-7"
          }
        />
      </a>
    ))}
  </div>

  {/* Links row (second on mobile), right-aligned */}
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
</div>


        </div>
      </div>
    </header>
  );
}
