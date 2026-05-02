import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Meme } from "@/lib/memeApi";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Props {
  meme: Meme | null;
  onClose: () => void;
}

export const MemeModal = ({ meme, onClose }: Props) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!meme) return;
    setDownloading(true);
    try {
      const res = await fetch(meme.url, { mode: "cors" });
      const blob = await res.blob();
      const ext = (meme.url.match(/\.(jpe?g|png|gif|webp)/i)?.[1] || "jpg").toLowerCase();
      const safeTitle = meme.title.replace(/[^a-z0-9]+/gi, "_").slice(0, 60) || "meme";
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `${safeTitle}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: open in new tab if CORS blocks the blob fetch
      window.open(meme.url, "_blank");
      toast({ title: "Opened in new tab", description: "Right-click → Save image to download." });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={!!meme} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl border-border bg-card p-0 overflow-hidden">
        {meme && (
          <div className="flex flex-col">
            <img src={meme.url} alt={meme.title} className="max-h-[75vh] w-full object-contain bg-background" />
            <div className="p-4">
              <DialogTitle className="text-base font-semibold leading-snug">{meme.title}</DialogTitle>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                  {meme.source}
                </span>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {downloading ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Downloading…</>
                  ) : (
                    <><Download className="h-3 w-3" /> Download</>
                  )}
                </button>
                {meme.permalink && (
                  <a
                    href={meme.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
