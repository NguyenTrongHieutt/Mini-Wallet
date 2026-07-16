import { Construction } from "lucide-react";

export function CustomerModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-6 text-center">
        <Construction className="mb-4 size-10 text-blue-400" />
        <p className="font-medium">Khu vực {title.toLocaleLowerCase("vi-VN")} đã sẵn sàng</p>
        <p className="mt-1 max-w-md text-sm text-slate-400">
          Module nghiệp vụ sẽ được nối vào route này mà không cần thay đổi lại auth hoặc shell.
        </p>
      </div>
    </section>
  );
}
