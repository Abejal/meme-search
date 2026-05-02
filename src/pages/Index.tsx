import { useEffect, useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Meme, searchMemes } from "@/lib/memeApi";
import { MemeCard } from "@/components/MemeCard";
import { MemeModal } from "@/components/MemeModal";

const Index = () => {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Meme | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchMemes(submitted).then((res) => {
      if (!cancelled) {
        setMemes(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [submitted]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <header className="mb-8 text-center sm:mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3 text-primary" />
          Powered by Reddit & Giphy
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          <span className="gradient-text">Meme</span> Search
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Find the perfect meme. Type anything, get instant results.
        </p>
      </header>

      <form onSubmit={onSubmit} className="mx-auto mb-10 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-14 rounded-full border-border bg-card pl-12 pr-4 text-base shadow-card focus-visible:ring-primary"
          />
        </div>
      </form>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm">Hunting for memes...</p>
        </div>
      ) : memes.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>No memes found. Try a different search.</p>
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
          {memes.map((m) => (
            <div key={m.id} className="mb-3 break-inside-avoid sm:mb-4">
              <MemeCard meme={m} onClick={() => setActive(m)} />
            </div>
          ))}
        </div>
      )}

      <MemeModal meme={active} onClose={() => setActive(null)} />
    </main>
  );
};

export default Index;
