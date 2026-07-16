import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/customer/auth/customer-auth-context";

export function CustomerProtectedRoute() {
  const auth = useCustomerAuth();
  const location = useLocation();

  if (auth.status === "loading") return <LoadingScreen />;

  if (auth.status === "error") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Không thể kiểm tra phiên đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-300">
            Kiểm tra kết nối tới máy chủ rồi thử lại. Phiên của bạn chưa bị xóa.
          </p>
          <Button className="mt-5" onClick={() => void auth.retrySession()}>Thử lại</Button>
        </div>
      </main>
    );
  }

  if (auth.status !== "authenticated") {
    return (
      <Navigate
        to="/customer/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
