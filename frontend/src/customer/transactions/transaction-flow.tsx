import type { ServiceInputFieldsData } from "./types";
import {
  TransactionInputStep,
  TransactionPreviewStep,
  TransactionVerificationStep,
} from "./transaction-flow-steps";
import {
  BackToServices,
  StepIndicator,
  TransactionReceiptView,
} from "./transaction-flow-ui";
import { useTransactionFlow } from "./use-transaction-flow";

export function TransactionFlow({
  definition,
  serviceCode,
}: {
  definition: ServiceInputFieldsData;
  serviceCode: string;
}) {
  const controller = useTransactionFlow(definition, serviceCode);

  if (controller.receipt) {
    return (
      <TransactionReceiptView
        receipt={controller.receipt}
        onRestart={controller.restart}
      />
    );
  }

  return (
    <section>
      <BackToServices />
      <header className="mt-4">
        <p className="font-mono text-sm font-semibold text-blue-400">
          {definition.service.code}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{definition.service.name}</h1>
        {definition.service.description && (
          <p className="mt-1 text-sm text-slate-400">{definition.service.description}</p>
        )}
      </header>

      <StepIndicator step={controller.confirmation ? 3 : controller.preview ? 2 : 1} />

      {!controller.preview && (
        <TransactionInputStep
          controller={controller}
          definition={definition}
          serviceCode={serviceCode}
        />
      )}
      {controller.preview && !controller.confirmation && (
        <TransactionPreviewStep controller={controller} />
      )}
      {controller.confirmation && (
        <TransactionVerificationStep controller={controller} />
      )}
    </section>
  );
}
