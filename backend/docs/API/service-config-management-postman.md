# Test API service/config bằng Postman (không dùng Docker)

## 1. Chạy dự án trực tiếp trên máy

Yêu cầu Node.js, npm và MongoDB local đang lắng nghe tại `127.0.0.1:27017`.
Trên Windows, kiểm tra MongoDB bằng PowerShell:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

Tại thư mục dự án, chạy:

```powershell
npm install
$env:MONGO_URI="mongodb://127.0.0.1:27017/mini_wallet"
npm run seed:currencies
npm run seed:officer
npm run seed:p2p
npm start
```

API mặc định chạy tại `http://localhost:1337`. Tài khoản officer mẫu:

```text
phone: 0900000000
password: Officer123
```

`seed:p2p` không bắt buộc cho collection service/config, nhưng cần thiết nếu chạy
tiếp collection provider vì collection đó dùng service `P2P_TRANSFER`.

## 2. Import và chạy collection

Import hai file sau vào Postman:

- `docs/API/service-config-management.postman_collection.json`
- `docs/API/provider-management.postman_collection.json`

Chọn **Run collection** và giữ đúng thứ tự request. Mỗi collection tự động:

- đăng nhập officer và lưu `officerAccessToken`;
- sinh code mới theo timestamp để có thể chạy lại;
- lưu `serviceId`, `transFieldId`, `transValidationId` hoặc `providerId`;
- kiểm tra HTTP status, `err === 200` và trạng thái dữ liệu quan trọng.

Ứng dụng luôn dùng HTTP status `200`; mã kết quả nghiệp vụ nằm trong field `err`
của JSON response.

## 3. Header và cách định danh

Trừ request login, mọi request cần:

```text
Authorization: Bearer {{officerAccessToken}}
Content-Type: application/json
```

Các API service chấp nhận một trong hai cách định danh:

```json
{ "serviceId": "{{serviceId}}" }
```

hoặc:

```json
{ "serviceCode": "{{serviceCode}}" }
```

API update `TransField` cần thêm `transFieldId`; API update
`TransValidation` cần thêm `transValidationId`.

## 4. Luồng cấu hình service

Collection chạy luồng đầy đủ sau:

1. Tạo service `draft`.
2. List, xem detail và cập nhật thông tin cơ bản.
3. Cập nhật toàn bộ `fieldBuilder`.
4. Insert, list và update `TransField`.
5. Insert, list và update `TransValidation`.
6. Cập nhật cấu hình `actions`.
7. Tạo/cập nhật và xem `TransDefinition` bằng danh sách `glSteps`.
8. Publish service sang `active`.
9. Unpublish service sang `inactive`.

Service đang `active` không cho sửa cấu hình. Gọi `unpublish` trước khi sửa rồi
`publish` lại. `publish` kiểm tra service có `fieldBuilder`, ít nhất một
`TransField` active và một `TransDefinition` active hợp lệ. Hai API trạng thái có
tính idempotent: gọi lại khi đã đúng trạng thái vẫn thành công với
`changed: false`.

## 5. Request mẫu ngắn

### Tạo service draft

`POST {{baseUrl}}/api/v1/officer/services/create`

```json
{
  "serviceCode": "CASH_TRANSFER",
  "name": "Cash Transfer",
  "description": "Transfer service",
  "fee": { "type": "fixed", "value": 100 },
  "auth": { "method": "NONE" }
}
```

### Thêm TransField

`POST {{baseUrl}}/api/v1/officer/services/trans-fields/insert`

```json
{
  "serviceId": "{{serviceId}}",
  "fieldName": "AMOUNT",
  "fieldFormat": "number",
  "minLength": 1,
  "isRequired": true,
  "needSecured": false,
  "order": 1,
  "errorCode": "AMOUNT_INVALID",
  "status": "active"
}
```

### Cập nhật toàn bộ actions

`POST {{baseUrl}}/api/v1/officer/services/actions/update`

```json
{
  "serviceId": "{{serviceId}}",
  "actions": {
    "provider": {
      "codeSource": "TRANSBODY",
      "codeField": "PROVIDERCODE"
    },
    "request": { "enabled": false },
    "confirm": { "enabled": false },
    "verify": { "enabled": false }
  }
}
```

Gửi `actions` sẽ thay thế toàn bộ cấu hình hiện tại. Để chỉ cập nhật một action
và giữ nguyên các action khác, dùng `actionName` và `action`:

```json
{
  "serviceId": "{{serviceId}}",
  "actionName": "request",
  "action": {
    "enabled": true,
    "urlField": "requestUrl",
    "method": "POST",
    "timeoutMs": 10000
  }
}
```

`actionName` hỗ trợ `provider`, `request`, `confirm`, `verify`, `preview`.

### Xem TransDefinition

`POST {{baseUrl}}/api/v1/officer/services/trans-definition/detail`

```json
{
  "serviceId": "{{serviceId}}"
}
```

Có thể thay `serviceId` bằng `serviceCode`.

### Publish / unpublish

```http
POST {{baseUrl}}/api/v1/officer/services/publish
POST {{baseUrl}}/api/v1/officer/services/unpublish
```

Body cho cả hai:

```json
{ "serviceId": "{{serviceId}}" }
```

Payload đầy đủ cho `fieldBuilder`, `actions`, `TransValidation`,
`TransDefinition` và tất cả request list/update nằm sẵn trong collection Postman.
