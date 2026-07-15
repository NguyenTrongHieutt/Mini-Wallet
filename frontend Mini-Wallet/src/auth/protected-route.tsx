import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/auth-context";

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.status === "loading") return <LoadingScreen />;

  if (auth.status === "error") {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Không thể kiểm tra phiên đăng nhập</h1>
          <p className="mt-2 text-sm text-muted-foreground">Kiểm tra kết nối tới máy chủ rồi thử lại.</p>
          <Button className="mt-5" onClick={() => void auth.retrySession()}>Thử lại</Button>
        </div>
      </main>
    );
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}
