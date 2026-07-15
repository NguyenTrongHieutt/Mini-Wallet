import { Activity, Settings2, Store, WalletCards } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const quickLinks = [
  { title: "Cấu hình dịch vụ", description: "Tạo và xuất bản luồng giao dịch", icon: Settings2, to: "/services" },
  { title: "Nhà cung cấp", description: "Quản lý kết nối đối tác", icon: Store, to: "/providers" },
  { title: "Theo dõi giao dịch", description: "Tra cứu trạng thái xử lý", icon: Activity, to: "/transactions" },
  { title: "Quản lý ví", description: "Kiểm tra và kiểm soát số dư", icon: WalletCards, to: "/pockets" },
];

export function DashboardPage() {
  const { officer } = useAuth();
  return (
    <>
      <PageHeader title={`Xin chào, ${officer?.displayName || "Officer"}`} description="Chọn một khu vực để bắt đầu công việc vận hành." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(({ title, description, icon: Icon, to }) => (
          <Link key={title} to={to} className="rounded-xl focus-visible:ring-2 focus-visible:ring-primary">
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"><CardContent className="pt-6"><span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></CardContent></Card>
          </Link>
        ))}
      </div>
    </>
  );
}
