import { LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TransactionField } from "./transaction-field";
import type { TransactionFlowController } from "./use-transaction-flow";
import { isValidPin } from "./use-transaction-flow";
import type { ServiceInputFieldsData } from "./types";
import {
  ExpiredNotice,
  PreviewCard,
  TransactionError,
} from "./transaction-flow-ui";

interface TransactionInputStepProps {
  controller: TransactionFlowController;
  definition: ServiceInputFieldsData;
  serviceCode: string;
}

export function TransactionInputStep({
  controller,
  definition,
  serviceCode,
}: TransactionInputStepProps) {
  return (
    <form className="mt-6 space-y-4" onSubmit={controller.submitRequest}>
      <Card className="border-slate-700 bg-slate-800 text-slate-50">
        <CardHeader>
          <CardTitle>Thông tin giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {definition.bodyFields.length === 0 && (
            <p className="text-sm text-slate-400">
              Dịch vụ này không yêu cầu thông tin bổ sung.
            </p>
          )}
          {definition.bodyFields.map((field) => (
            <TransactionField
              error={controller.errors[field.name]}
              field={field}
              key={field.name}
              onChange={(value) => controller.setFieldValue(field.name, value)}
              serviceCode={serviceCode}
              value={controller.values[field.name] ?? ""}
            />
          ))}
        </CardContent>
      </Card>
      {controller.mutations.requestMutation.isError && (
        <TransactionError error={controller.mutations.requestMutation.error} />
      )}
      <Button
        className="w-full bg-blue-600 text-white hover:bg-blue-500"
        disabled={controller.mutations.requestMutation.isPending}
        size="lg"
        type="submit"
      >
        {controller.mutations.requestMutation.isPending && (
          <LoaderCircle className="mr-2 size-4 animate-spin" />
        )}
        Xem trước giao dịch
      </Button>
    </form>
  );
}

export function TransactionPreviewStep({
  controller,
}: {
  controller: TransactionFlowController;
}) {
  if (!controller.preview) return null;

  return (
    <div className="mt-6 space-y-4">
      <PreviewCard preview={controller.preview} />
      {controller.expired && <ExpiredNotice onRestart={controller.restart} />}
      {controller.mutations.confirmMutation.isError && (
        <TransactionError error={controller.mutations.confirmMutation.error} />
      )}
      {!controller.expired && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
            onClick={controller.editRequest}
            type="button"
            variant="outline"
          >
            Chỉnh sửa
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-500"
            disabled={controller.mutations.confirmMutation.isPending}
            onClick={() => void controller.confirmTransaction()}
            type="button"
          >
            {controller.mutations.confirmMutation.isPending && (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}
            Xác nhận giao dịch
          </Button>
        </div>
      )}
    </div>
  );
}

export function TransactionVerificationStep({
  controller,
}: {
  controller: TransactionFlowController;
}) {
  if (!controller.confirmation) return null;
  const requiresPin = controller.confirmation.authMethod === "PIN";

  return (
    <form className="mt-6 space-y-4" onSubmit={controller.verifyTransaction}>
      <Card className="border-slate-700 bg-slate-800 text-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-400" />
            Xác thực giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requiresPin ? (
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Mã PIN 6 chữ số
              <Input
                aria-label="Mã PIN 6 chữ số"
                autoComplete="off"
                className="border-slate-700 bg-slate-900 text-center font-mono text-xl tracking-[0.45em] text-slate-50"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  controller.setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                type="password"
                value={controller.pin}
              />
            </label>
          ) : (
            <p className="text-sm text-slate-300">
              Dịch vụ không yêu cầu mã PIN. Bấm nút bên dưới để hoàn tất giao dịch.
            </p>
          )}
        </CardContent>
      </Card>
      {controller.expired && <ExpiredNotice onRestart={controller.restart} />}
      {controller.mutations.verifyMutation.isError && (
        <TransactionError error={controller.mutations.verifyMutation.error} />
      )}
      {!controller.expired && (
        <Button
          className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
          disabled={
            controller.mutations.verifyMutation.isPending ||
            (requiresPin && !isValidPin(controller.pin))
          }
          size="lg"
          type="submit"
        >
          {controller.mutations.verifyMutation.isPending && (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          )}
          {requiresPin ? "Xác thực và thanh toán" : "Hoàn tất giao dịch"}
        </Button>
      )}
    </form>
  );
}
