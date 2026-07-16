import { useParams } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { transactionErrorMessage } from "./customer-transaction-api";
import { useServiceInputFields } from "./customer-transaction-queries";
import { TransactionFlow } from "./transaction-flow";
import {
  BackToServices,
  TransactionLoading,
} from "./transaction-flow-ui";

export function DynamicTransactionPage() {
  const serviceCode = decodeURIComponent(useParams().serviceCode ?? "").toUpperCase();
  const fieldsQuery = useServiceInputFields(serviceCode);

  if (fieldsQuery.isPending) {
    return <TransactionLoading />;
  }

  if (fieldsQuery.isError) {
    return (
      <section>
        <BackToServices />
        <Alert className="mt-6 border-red-500/30 bg-red-500/10 text-red-200">
          <p>{transactionErrorMessage(fieldsQuery.error)}</p>
          <Button
            className="mt-3 border-red-400/40 bg-transparent text-red-100 hover:bg-red-500/20"
            onClick={() => void fieldsQuery.refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            Thử lại
          </Button>
        </Alert>
      </section>
    );
  }

  return (
    <TransactionFlow
      definition={fieldsQuery.data}
      key={fieldsQuery.data.service.code}
      serviceCode={serviceCode}
    />
  );
}
