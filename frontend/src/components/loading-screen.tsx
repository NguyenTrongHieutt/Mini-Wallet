import { WalletCards } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><WalletCards /></span>
        <span className="flex items-center gap-2 text-sm"><Spinner /> Đang khôi phục phiên làm việc…</span>
      </div>
    </main>
  );
}
