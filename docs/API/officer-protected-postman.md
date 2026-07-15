# Test Officer Protected APIs bằng Postman

## Chuẩn bị dữ liệu

Khởi động MongoDB và ứng dụng, sau đó seed currency và tài khoản officer:

```powershell
docker compose up -d mongo
npm run seed:currencies
npm run seed:officer
npm start
```

Tài khoản officer mặc định:

```text
phone: 0900000000
password: Officer123
```

Có thể đổi tài khoản seed bằng biến môi trường `OFFICER_PHONE`,
`OFFICER_PASSWORD`, `OFFICER_DISPLAY_NAME`.

Import file `docs/API/officer-protected.postman_collection.json` vào Postman.
Collection tự lưu `accessToken` sau request login. Chạy các request theo thứ tự từ
trên xuống. Sau request list, collection tự lấy customer đầu tiên làm
`customerId`; cũng có thể nhập thủ công biến này trong collection.

## Request mẫu

Tất cả protected API dùng header:

```text
Authorization: Bearer {{officerAccessToken}}
Content-Type: application/json
```

### Login officer

`POST {{baseUrl}}/api/v1/officer/auth/login`

```json
{
  "phone": "{{officerPhone}}",
  "password": "{{officerPassword}}"
}
```

### Profile officer

`POST {{baseUrl}}/api/v1/officer/me`

```json
{}
```

### Danh sách customer

`POST {{baseUrl}}/api/v1/officer/customers/list`

```json
{
  "page": 1,
  "pageSize": 20,
  "q": "",
  "status": "active",
  "sortBy": "createdAt",
  "sortOrder": "DESC"
}
```

`status` nhận `active`, `locked` hoặc bỏ trống. `sortBy` nhận `phone`,
`displayName`, `status`, `createdAt`, `updatedAt`.

### Chi tiết customer

`POST {{baseUrl}}/api/v1/officer/customers/detail`

```json
{
  "customerId": "{{customerId}}"
}
```

Có thể dùng `phone` thay cho `customerId`.

### Khóa customer

`POST {{baseUrl}}/api/v1/officer/customers/lock`

```json
{
  "customerId": "{{customerId}}"
}
```

Khi khóa, mọi session đang active của customer bị revoke ngay.

### Mở khóa customer

`POST {{baseUrl}}/api/v1/officer/customers/unlock`

```json
{
  "customerId": "{{customerId}}"
}
```

### Logout officer

`POST {{baseUrl}}/api/v1/officer/auth/logout`

```json
{}
```

Lưu ý: dự án luôn trả HTTP 200; kiểm tra `err === 200` để xác định request thành
công.
