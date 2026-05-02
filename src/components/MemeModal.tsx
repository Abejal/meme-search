import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Meme } from "@/lib/memeApi";
import { ExternalLink } from "lucide-react";

interface Props {
  meme: Meme | null;
  onClose: () => void;
}

export const MemeModal = ({ meme, onClose }: Props) => {
  return (
    <Dialog open={!!meme} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl border-border bg-card p-0 overflow-hidden">
        {meme && (
          <div className="flex flex-col">
            <img src={meme.url} alt={meme.title} className="max-h-[75vh] w-full object-contain bg-background" />
            <div className="p-4">
              <DialogTitle className="text-base font-semibold leading-snug">{meme.title}</DialogTitle>
              <div className="mt-3 flex items-center gap-3">
                <span className="rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                  {meme.source}
                </span>
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
