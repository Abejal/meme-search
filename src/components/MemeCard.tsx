import { Meme } from "@/lib/memeApi";

interface Props {
  meme: Meme;
  onClick: () => void;
}

export const MemeCard = ({ meme, onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-ring animate-fade-in"
    >
      <img
        src={meme.url}
        alt={meme.title}
        loading="lazy"
        className="h-auto w-full object-cover"
        onError={(e) => {
          (e.currentTarget.parentElement as HTMLElement).style.display = "none";
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="line-clamp-2 text-left text-sm font-medium text-foreground">{meme.title}</p>
        <span className="mt-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
          {meme.source}
        </span>
      </div>
    </button>
  );
};
