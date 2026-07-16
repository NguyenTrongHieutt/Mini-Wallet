import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateProvider } from '../api/providerQueries'
import { ProviderApiError, providerErrorMessage } from '../api/providerApi'
import { ProviderForm, type ProviderFormValues } from '../components/ProviderForm'
import { ProviderPage } from '../components/ProviderPage'

export function ProviderCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateProvider()
  const [duplicateId, setDuplicateId] = useState<string>()

  async function submit(values: ProviderFormValues) {
    setDuplicateId(undefined)
    try {
      const result = await mutation.mutateAsync({
        type: values.type,
        providerCode: values.providerCode,
        serviceCode: values.serviceCode,
        name: values.name,
        category: values.category || undefined,
        requestUrl: values.requestUrl || undefined,
        confirmUrl: values.confirmUrl || undefined,
        verifyUrl: values.verifyUrl || undefined,
        currency: values.currency,
        balance: values.balance,
        pocketName: values.pocketName || undefined,
      })
      navigate(`/providers/${result.provider.id}`, { state: { notice: 'Provider và ví đã được tạo thành công.' } })
    } catch (error) {
      if (error instanceof ProviderApiError) {
        const id = error.data && typeof error.data === 'object'
          ? (error.data as { providerId?: unknown }).providerId
          : undefined
        if (typeof id === 'string') setDuplicateId(id)
      }
    }
  }

  const error = mutation.isError ? providerErrorMessage(mutation.error) : undefined
  return (
    <ProviderPage backTo="/providers" title="Tạo Provider" description="Khai báo đơn vị kết nối và khởi tạo ví Provider.">
      {duplicateId && (
        <div className="provider-alert provider-alert--warning">
          Provider trùng đã tồn tại. <Link to={`/providers/${duplicateId}`}>Xem Provider hiện có</Link>
        </div>
      )}
      <ProviderForm mode="create" onCancel={() => navigate('/providers')} onSubmit={submit} pending={mutation.isPending} serverError={error} />
    </ProviderPage>
  )
}
