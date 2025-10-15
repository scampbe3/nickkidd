// app/social/page.tsx
import data from "@/data/socials.json";
import ProfileCard from "@/components/ProfileCard";
import SocialEmbed from "@/components/SocialEmbed";



const order = ["facebook", "tiktok", "youtube", "instagram"] as const;
type Platform = typeof order[number];

type Profile = { url: string; label?: string; avatar?: string } | string;
const normalize = (p: Profile) => (typeof p === "string" ? { url: p } : p);

export default function Page() {
  // platform-level posts (still fine for prototype; see "postsByProfile" below)
  const postsByPlatform: Record<Platform, string[]> = {
    facebook: (data as any).facebook ?? [],
    tiktok: (data as any).tiktok ?? [],
    youtube: (data as any).youtube ?? [],
    instagram: (data as any).instagram ?? [],
  };

  // profiles per platform
  const profilesRaw: Record<Platform, Profile[]> = ((data as any).profiles ?? {}) as any;

  // OPTIONAL: if you later add per-profile posts, support them here:
  // {
  //   "postsByProfile": {
  //     "youtube":   { "https://youtube.com/@nickkvideos": ["post1", "post2"] },
  //     "instagram": { "https://instagram.com/nickckidd/": ["post1", "post2"] }
  //   }
  // }
  const postsByProfile: Partial<Record<Platform, Record<string, string[]>>> =
    ((data as any).postsByProfile ?? {}) as any;

  // Build one section per profile (instead of one section per platform)
  const sections = order.flatMap((platform) => {
    const profiles = (profilesRaw[platform] ?? []).map(normalize);
    // If no profiles for a platform, still render a single “add profile” section
    if (profiles.length === 0) return [{ platform, profile: null as null }];
    return profiles.map((profile) => ({ platform, profile }));
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 space-y-16">

      {sections.map(({ platform, profile }, idx) => {
        const profileUrl = profile?.url ?? "";
        // prefer per-profile posts if present, otherwise fallback to platform posts (prototype)
        const posts =
          (postsByProfile[platform]?.[profileUrl] ??
            postsByPlatform[platform]?.slice(0, 2)) ?? [];

        const heading =
          profile?.label ? `${platform} — ${profile.label}` : platform;

        return (
          <section
            key={`${platform}-${profileUrl || "none"}-${idx}`}
            className="space-y-6"
          >
            <div className="flex items-end justify-between">
              <h2 className="text-3xl md:text-4xl font-serif capitalize">
                {heading}
              </h2>
              <span className="text-sm text-neutral-500">
                {posts.length
                  ? "Showing latest posts"
                  : "Showing profile card until posts are added"}
              </span>
            </div>

<div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
              {/* Left: single profile card (large) */}
  <div className="w-full max-w-full lg:col-span-1">
                {profile ? (
                  <ProfileCard
                    platform={platform}
                    url={profile.url}
                    label={profile.label}
                    avatar={profile.avatar}
                    size="lg"
                  />
                ) : (
                  <div className="rounded-2xl border bg-surfac p-6 text-sm text-neutral-400">
                    Add a profile link for {platform}.
                  </div>
                )}
              </div>

              {/* Right: two big post wells for this specific profile */}
  <div className="w-full max-w-full space-y-6 lg:col-span-2">
                {posts.length ? (
                  posts.map((url, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border bg-surfac p-3 md:p-4 min-h-[420px] flex items-center justify-center"
                    >
                      <div className="w-full">
                        <SocialEmbed url={url} />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="rounded-2xl border bg-surfac p-8 min-h-[360px] grid place-items-center text-center">
                      <div>
                        <div className="text-xl font-medium mb-2">Post area</div>
                        <p className="text-neutral-400 max-w-md mx-auto">
                          The two newest posts for this profile
                          will appear here automatically.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-surfac p-8 min-h-[360px] grid place-items-center text-neutral-400">
                      Second post slot
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}
