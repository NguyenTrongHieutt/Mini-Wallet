import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { appConfig } from "@/config/app-config";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useCustomerAuth } from "@/customer/auth/customer-auth-context";
import { ApiError } from "@/lib/api";

const phone = z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại phải gồm 9–15 chữ số.");
const password = z.string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự.")
  .max(72, "Mật khẩu không được vượt quá 72 ký tự.")
  .regex(/[A-Za-z]/, "Mật khẩu phải có ít nhất một chữ cái.")
  .regex(/[0-9]/, "Mật khẩu phải có ít nhất một chữ số.");

const loginSchema = z.object({ phone, password });
const registerSchema = z.object({
  displayName: z.string().trim().max(60, "Tên hiển thị không được vượt quá 60 ký tự."),
  phone,
  password,
  confirmPassword: z.string(),
  pin: z.string().regex(/^[0-9]{6}$/, "Mã PIN phải gồm đúng 6 chữ số."),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Mật khẩu xác nhận không khớp.",
}).refine((values) => values.displayName.length === 0 || values.displayName.length >= 2, {
  path: ["displayName"],
  message: "Tên hiển thị phải có ít nhất 2 ký tự.",
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

function resolveDestination(from: unknown) {
  return typeof from === "string" && from.startsWith("/customer/")
    ? from
    : "/customer/services";
}

function CustomerAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-slate-950 text-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden border-r border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <WalletCards className="text-blue-400" /> Mini Wallet
        </div>
        <div className="max-w-lg">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">Customer Portal</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight">
            Thanh toán và quản lý giao dịch trong một ví điện tử gọn nhẹ.
          </h1>
          <p className="mt-5 text-slate-300">
            Chọn dịch vụ, xác nhận giao dịch và theo dõi lịch sử của chính bạn.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="size-4" /> Phiên đăng nhập được bảo vệ bằng cookie HttpOnly.
        </p>
      </section>
      <section className="grid place-items-center p-6 sm:p-12">{children}</section>
    </main>
  );
}

function SessionProbeWarning() {
  const auth = useCustomerAuth();
  if (auth.status !== "error") return null;
  return (
    <Alert className="mb-5 border-amber-400/30 bg-amber-400/10 text-amber-200">
      Không thể kiểm tra phiên hiện tại. Bạn vẫn có thể đăng nhập lại hoặc{" "}
      <button type="button" className="font-semibold underline" onClick={() => void auth.retrySession()}>
        thử kết nối lại
      </button>.
    </Alert>
  );
}

function submitErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError || error instanceof Error ? error.message : fallback;
}

export function CustomerLoginPage() {
  const auth = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const destination = resolveDestination((location.state as { from?: unknown } | null)?.from);
  if (auth.status === "authenticated") return <Navigate to={destination} replace />;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.login(values);
      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(submitErrorMessage(error, "Đăng nhập không thành công."));
    }
  });

  return (
    <CustomerAuthLayout>
      <Card className="w-full max-w-md border-slate-700 bg-slate-900 text-slate-50 shadow-2xl shadow-black/30">
        <CardHeader>
          <div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue-600 text-white lg:hidden"><WalletCards /></div>
          <CardTitle className="text-2xl">Đăng nhập Mini Wallet</CardTitle>
          <CardDescription className="text-slate-400">Dùng tài khoản customer của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionProbeWarning />
          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            {submitError ? <Alert>{submitError}</Alert> : null}
            <div className="space-y-2">
              <Label htmlFor="customer-login-phone">Số điện thoại</Label>
              <Input id="customer-login-phone" className="border-slate-700 bg-slate-950" inputMode="tel" autoComplete="username" placeholder="0900000001" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
              {errors.phone ? <p className="text-sm text-red-400">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-login-password">Mật khẩu</Label>
              <Input id="customer-login-password" className="border-slate-700 bg-slate-950" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
              {errors.password ? <p className="text-sm text-red-400">{errors.password.message}</p> : null}
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-500" type="submit" disabled={auth.isLoggingIn}>
              {auth.isLoggingIn ? <><Spinner /> Đang đăng nhập…</> : "Đăng nhập"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Chưa có tài khoản? <Link className="font-semibold text-blue-400 hover:text-blue-300" to="/customer/register">Đăng ký ngay</Link>
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            Nhân viên vận hành? <Link className="underline" to="/login">Mở Officer Portal</Link>
          </p>
        </CardContent>
      </Card>
    </CustomerAuthLayout>
  );
}

export function CustomerRegisterPage() {
  const auth = useCustomerAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", phone: "", password: "", confirmPassword: "", pin: "" },
  });

  if (auth.status === "authenticated") return <Navigate to="/customer/services" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.register({
        phone: values.phone,
        password: values.password,
        pin: values.pin,
        displayName: values.displayName || undefined,
        currency: appConfig.defaultCurrency,
      });
      navigate("/customer/services", { replace: true });
    } catch (error) {
      setSubmitError(submitErrorMessage(error, "Đăng ký không thành công."));
    }
  });

  return (
    <CustomerAuthLayout>
      <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-slate-50 shadow-2xl shadow-black/30">
        <CardHeader>
          <div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue-600 text-white lg:hidden"><WalletCards /></div>
          <CardTitle className="text-2xl">Tạo tài khoản customer</CardTitle>
          <CardDescription className="text-slate-400">
            Ví mặc định được tạo bằng đơn vị tiền tệ {appConfig.defaultCurrency}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionProbeWarning />
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
            {submitError ? <Alert className="sm:col-span-2">{submitError}</Alert> : null}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer-register-name">Tên hiển thị (không bắt buộc)</Label>
              <Input id="customer-register-name" className="border-slate-700 bg-slate-950" autoComplete="name" placeholder="Nguyễn Văn A" aria-invalid={Boolean(errors.displayName)} {...register("displayName")} />
              {errors.displayName ? <p className="text-sm text-red-400">{errors.displayName.message}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer-register-phone">Số điện thoại</Label>
              <Input id="customer-register-phone" className="border-slate-700 bg-slate-950" inputMode="tel" autoComplete="username" placeholder="0900000001" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
              {errors.phone ? <p className="text-sm text-red-400">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-register-password">Mật khẩu</Label>
              <Input id="customer-register-password" className="border-slate-700 bg-slate-950" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
              {errors.password ? <p className="text-sm text-red-400">{errors.password.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-register-confirm-password">Xác nhận mật khẩu</Label>
              <Input id="customer-register-confirm-password" className="border-slate-700 bg-slate-950" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword")} />
              {errors.confirmPassword ? <p className="text-sm text-red-400">{errors.confirmPassword.message}</p> : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customer-register-pin">Mã PIN giao dịch</Label>
              <Input id="customer-register-pin" className="border-slate-700 bg-slate-950" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} placeholder="6 chữ số" aria-invalid={Boolean(errors.pin)} {...register("pin")} />
              {errors.pin ? <p className="text-sm text-red-400">{errors.pin.message}</p> : null}
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 sm:col-span-2" type="submit" disabled={auth.isRegistering}>
              {auth.isRegistering ? <><Spinner /> Đang tạo tài khoản…</> : "Đăng ký"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-400">
            Đã có tài khoản? <Link className="font-semibold text-blue-400 hover:text-blue-300" to="/customer/login">Đăng nhập</Link>
          </p>
        </CardContent>
      </Card>
    </CustomerAuthLayout>
  );
}
