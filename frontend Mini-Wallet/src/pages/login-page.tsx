import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/auth/auth-context";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const loginSchema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại phải gồm 9–15 chữ số."),
  password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự.").max(72, "Mật khẩu không được vượt quá 72 ký tự."),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  if (auth.status === "authenticated") return <Navigate to="/" replace />;

  const from = (location.state as { from?: string } | null)?.from || "/";
  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await auth.login(values);
      navigate(from, { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Đăng nhập không thành công.");
    }
  });

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-lg font-semibold"><WalletCards className="text-teal-400" /> Mini Wallet</div>
        <div className="max-w-lg">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-400">Officer Portal</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight">Vận hành dịch vụ ví rõ ràng, an toàn và nhất quán.</h1>
          <p className="mt-5 text-slate-300">Quản lý cấu hình dịch vụ, nhà cung cấp và theo dõi giao dịch trong cùng một không gian làm việc.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-400"><ShieldCheck className="size-4" /> Phiên làm việc được bảo vệ bằng cookie HttpOnly.</p>
      </section>

      <section className="grid place-items-center p-6 sm:p-12">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-slate-200/70 sm:border">
          <CardHeader>
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground lg:hidden"><WalletCards /></div>
            <CardTitle className="text-2xl">Đăng nhập Officer</CardTitle>
            <CardDescription>Dùng tài khoản vận hành Mini Wallet của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              {submitError ? <Alert>{submitError}</Alert> : null}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" inputMode="tel" autoComplete="username" placeholder="0900000000" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
                {errors.phone ? <p className="text-sm text-destructive">{errors.phone.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...register("password")} />
                {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
              </div>
              <Button className="w-full" type="submit" disabled={auth.isLoggingIn}>
                {auth.isLoggingIn ? <><Spinner /> Đang đăng nhập…</> : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
