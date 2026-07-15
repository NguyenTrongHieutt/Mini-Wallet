import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export function PlaceholderPage({ title, description = "Module này đang được xây dựng." }: { title: string; description?: string }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><Construction className="mb-4 size-10 text-primary" /><p className="font-medium">Khu vực làm việc đã sẵn sàng</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Nội dung nghiệp vụ sẽ được bổ sung bởi module tương ứng.</p></CardContent></Card>
    </>
  );
}
