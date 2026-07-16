import { useNavigate, useParams } from 'react-router-dom'
import { useProvider, useUpdateProvider } from '../api/providerQueries'
import { providerErrorMessage } from '../api/providerApi'
import { ProviderForm, type ProviderFormValues } from '../components/ProviderForm'
import { ProviderErrorState, ProviderLoading, ProviderPage } from '../components/ProviderPage'

export function ProviderEditPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const navigate = useNavigate()
  const query = useProvider(providerId)
  const mutation = useUpdateProvider()

  if (query.isPending) return <ProviderPage backTo={`/providers/${providerId ?? ''}`} title="Chỉnh sửa Provider"><ProviderLoading /></ProviderPage>
  if (query.isError || !query.data) return <ProviderPage backTo="/providers" title="Chỉnh sửa Provider"><ProviderErrorState message={providerErrorMessage(query.error)} onRetry={() => void query.refetch()} /></ProviderPage>
  const provider = query.data

  async function submit(values: ProviderFormValues) {
    const result = await mutation.mutateAsync({
      providerId: provider.id,
      type: values.type,
      providerCode: values.providerCode,
      serviceCode: values.serviceCode,
      name: values.name,
      category: values.category,
      requestUrl: values.requestUrl,
      confirmUrl: values.confirmUrl,
      verifyUrl: values.verifyUrl,
    })
    navigate(`/providers/${provider.id}`, { state: { notice: result.changed === false ? 'Không có thông tin nào thay đổi.' : 'Đã cập nhật Provider.' } })
  }

  return (
    <ProviderPage backTo={`/providers/${provider.id}`} backLabel="Về chi tiết Provider" title="Chỉnh sửa Provider" description={`${provider.serviceCode} / ${provider.code}`}>
      <ProviderForm mode="edit" onCancel={() => navigate(`/providers/${provider.id}`)} onSubmit={submit} pending={mutation.isPending} provider={provider} serverError={mutation.isError ? providerErrorMessage(mutation.error) : undefined} />
    </ProviderPage>
  )
}

