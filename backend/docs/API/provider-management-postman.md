# Test API quản lý provider bằng Postman (không dùng Docker)

## 1. Chạy dự án trực tiếp trên máy

Dự án dùng SailsJS 0.12 và MongoDB driver cũ. Cài MongoDB Community 4.4 và
đảm bảo MongoDB đang chạy tại `127.0.0.1:27017`.

Nếu MongoDB được cài dưới dạng Windows Service, mở PowerShell với quyền
Administrator:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

Trong thư mục dự án, chạy:

```powershell
npm install
$env:MONGO_URI="mongodb://127.0.0.1:27017/mini_wallet"
npm run seed:currencies
npm run seed:officer
npm run seed:p2p
npm start
```

Giữ cửa sổ `npm start` đang chạy. API mặc định là
`http://localhost:1337`. Các endpoint quản lý provider không cần MongoDB
replica set và không cần Docker.

Tài khoản officer mặc định:

```text
phone: 0900000000
password: Officer123
```

## 2. Chạy collection Postman

Import file `docs/API/provider-management.postman_collection.json`, sau đó
chọn **Run collection** và chạy theo thứ tự từ trên xuống.

Collection tự động:

- Đăng nhập và lưu `officerAccessToken`.
- Sinh `providerCode` mới ở request create để tránh trùng khi chạy lại.
- Lưu `providerId` và `pocketId` cho các request tiếp theo.
- Kiểm tra `err === 200` và dữ liệu chính của từng response.

Dự án luôn trả HTTP status 200. Kết quả nghiệp vụ nằm trong trường `err` của
JSON response.

## 3. Request mẫu

Trừ login, mọi request đều cần header:

```text
Authorization: Bearer {{officerAccessToken}}
Content-Type: application/json
```

### Đăng nhập officer

`POST {{baseUrl}}/api/v1/officer/auth/login`

```json
{
  "phone": "{{officerPhone}}",
  "password": "{{officerPassword}}"
}
```

### Tạo provider và ví provider

`POST {{baseUrl}}/api/v1/officer/providers/create`

```json
{
  "type": "biller",
  "providerCode": "{{providerCode}}",
  "serviceCode": "P2P_TRANSFER",
  "name": "Postman Electricity Provider",
  "category": "electricity",
  "requestUrl": "http://localhost:1337/api/v1/mock/biller/inquiry",
  "confirmUrl": "",
  "verifyUrl": "http://localhost:1337/api/v1/mock/biller/payment",
  "currency": "VND",
  "balance": 0,
  "pocketName": "Postman Provider Wallet"
}
```

`serviceCode` phải tồn tại; lệnh `npm run seed:p2p` tạo service mẫu
`P2P_TRANSFER`. `currency` mặc định là `VND`, `balance` mặc định là `0`.
Provider mới có status `active`; API đồng thời tạo pocket có
`ownerType = provider` và liên kết vào `provider.pocketId`.

Mỗi cặp `serviceCode + providerCode` là duy nhất. Nếu tạo trùng, response có
`err: 409` và trả lại `providerId` đã tồn tại.

### Danh sách provider

`POST {{baseUrl}}/api/v1/officer/providers/list`

```json
{
  "page": 1,
  "pageSize": 20,
  "q": "",
  "serviceCode": "P2P_TRANSFER",
  "providerCode": "{{providerCode}}",
  "type": "biller",
  "category": "electricity",
  "status": "active",
  "sortBy": "createdAt",
  "sortOrder": "DESC"
}
```

Tất cả filter đều có thể bỏ trống. `q` tìm theo code, service code, name, type
hoặc category. `pageSize` tối đa 100.

### Chi tiết provider

`POST {{baseUrl}}/api/v1/officer/providers/detail`

```json
{
  "providerId": "{{providerId}}"
}
```

Cũng có thể định danh bằng cặp code:

```json
{
  "serviceCode": "P2P_TRANSFER",
  "providerCode": "{{providerCode}}"
}
```

### Cập nhật provider

`POST {{baseUrl}}/api/v1/officer/providers/update`

```json
{
  "providerId": "{{providerId}}",
  "name": "Postman Electricity Provider Updated",
  "category": "utility",
  "requestUrl": "http://localhost:1337/api/v1/mock/biller/inquiry-v2",
  "confirmUrl": "",
  "verifyUrl": "http://localhost:1337/api/v1/mock/biller/payment"
}
```

Các field có thể cập nhật: `type`, `providerCode`/`code`, `serviceCode`, `name`,
`category`, `requestUrl`, `confirmUrl`, `verifyUrl`. Chỉ cần gửi field muốn
đổi. Không cập nhật `status`, currency hoặc balance tại endpoint này.

### Tắt provider

`POST {{baseUrl}}/api/v1/officer/providers/deactivate`

```json
{
  "providerId": "{{providerId}}"
}
```

### Kích hoạt provider

`POST {{baseUrl}}/api/v1/officer/providers/activate`

```json
{
  "providerId": "{{providerId}}"
}
```

Hai API status có tính idempotent: gọi lại khi provider đã ở đúng trạng thái
vẫn trả thành công với `changed: false`. Tắt provider không khóa pocket; runtime
ngừng dùng provider vì chỉ tìm provider có status `active`.

