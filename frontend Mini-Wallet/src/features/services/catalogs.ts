export const builderQueries = [
  {
    value: 'Customer.getActiveCustomerByPhone',
    label: 'Tìm khách hàng đang hoạt động theo số điện thoại',
    hint: 'Dùng số điện thoại để lấy thông tin khách hàng, thường lấy kết quả id.',
  },
  {
    value: 'Pocket.getActivePocketByOwner',
    label: 'Tìm ví đang hoạt động theo chủ sở hữu',
    hint: 'Cần loại chủ ví, mã chủ sở hữu và loại tiền; thường lấy kết quả id.',
  },
] as const

export const validationCatalog = [
  {
    value: 'validateReceiverIsNotSender',
    label: 'Người gửi và người nhận phải khác nhau',
    defaultFields: 'SENDERID:RECEIVERID',
  },
  {
    value: 'validateSenderAccountSufficiency',
    label: 'Số dư người gửi phải đủ thanh toán',
    defaultFields: 'SENDERID:AMOUNT:DEBITFEE',
  },
  {
    value: 'validateRole',
    label: 'Giới hạn vai trò được thực hiện giao dịch',
    defaultFields: '{"field":"USERROLE","allowed":["officer"]}',
  },
] as const

export const serviceSteps = [
  ['basic', 'Cơ bản'],
  ['field-builder', 'Dựng biến'],
  ['trans-fields', 'Trường nhập'],
  ['validations', 'Kiểm tra nghiệp vụ'],
  ['actions', 'Actions'],
  ['ledger', 'Định khoản'],
  ['review', 'Xuất bản'],
] as const

export const builtInFields = ['TRANSREFID', 'SERVICEID', 'SERVICECODE', 'USERTYPE', 'USERID', 'OFFICERID', 'USERROLE']
