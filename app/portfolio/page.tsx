import photos from "@/data/photos.json";
import Gallery from "@/components/Gallery";

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Gallery photos={photos as any} />
    </main>
  );
}
