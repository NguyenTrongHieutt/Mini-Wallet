# Test Officer Protected APIs bằng Postman (không dùng Docker)

## 1. Chạy MongoDB và ứng dụng trực tiếp trên máy

Dự án dùng Sails 0.12 và driver MongoDB cũ, vì vậy nên dùng MongoDB Community
4.4. MongoDB phải đang lắng nghe tại `127.0.0.1:27017`.

Nếu MongoDB đã được cài dưới dạng Windows Service, mở PowerShell với quyền
Administrator và chạy:

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

Trong thư mục dự án, cài dependency và tạo dữ liệu nền:

```powershell
npm install
$env:MONGO_URI="mongodb://127.0.0.1:27017/mini_wallet"
npm run seed:currencies
npm run seed:officer
npm start
```

Giữ cửa sổ `npm start` đang chạy. API mặc định ở
`http://localhost:1337`. Luồng API quản lý ví không yêu cầu MongoDB replica set.

Tài khoản officer mặc định:

```text
phone: 0900000000
password: Officer123
```

Có thể đổi tài khoản seed bằng các biến `OFFICER_PHONE`, `OFFICER_PASSWORD` và
`OFFICER_DISPLAY_NAME` trước khi chạy `npm run seed:officer`.

## 2. Import collection Postman

Import file `docs/API/officer-protected.postman_collection.json` vào Postman,
sau đó chạy request theo thứ tự từ trên xuống. Request đăng nhập tự lưu
`officerAccessToken`; request tạo/list ví tự lưu `pocketId` cho các request sau.

Mọi protected API dùng:

```text
Authorization: Bearer {{officerAccessToken}}
Content-Type: application/json
```

Dự án luôn trả HTTP status 200. Cần kiểm tra `err === 200` trong JSON để xác
định request thành công.

## 3. Request quản lý ví

### Đăng nhập officer

`POST {{baseUrl}}/api/v1/officer/auth/login`

```json
{
  "phone": "{{officerPhone}}",
  "password": "{{officerPassword}}"
}
```

### Tạo ví System/Bank

`POST {{baseUrl}}/api/v1/officer/pockets/create`

```json
{
  "ownerType": "system",
  "ownerId": "POSTMAN_SYSTEM",
  "name": "Postman System Wallet",
  "currency": "VND",
  "balance": 5000000
}
```

`ownerType` chỉ nhận `system` hoặc `bank`. `currency` mặc định là `VND` nếu
không truyền. `balance` phải là số nguyên không âm và mặc định là `0` nếu không
truyền. Mỗi bộ `ownerType + ownerId + currency` là duy nhất.

Ví dụ tạo ví Bank:

```json
{
  "ownerType": "bank",
  "ownerId": "VCB_SETTLEMENT",
  "name": "VCB Settlement Wallet",
  "currency": "VND",
  "balance": 10000000
}
```

### Danh sách ví

`POST {{baseUrl}}/api/v1/officer/pockets/list`

```json
{
  "page": 1,
  "pageSize": 20,
  "q": "POSTMAN_SYSTEM",
  "ownerType": "system",
  "status": "active",
  "currency": "VND",
  "sortBy": "createdAt",
  "sortOrder": "DESC"
}
```

Các filter đều có thể bỏ trống. `q` tìm theo `name` hoặc `ownerId`;
`ownerType` nhận `customer`, `provider`, `system`, `bank`; `status` nhận
`active`, `locked`. `pageSize` tối đa 100.

### Chi tiết ví

`POST {{baseUrl}}/api/v1/officer/pockets/detail`

```json
{
  "pocketId": "{{pocketId}}"
}
```

### Khóa ví

`POST {{baseUrl}}/api/v1/officer/pockets/lock`

```json
{
  "pocketId": "{{pocketId}}"
}
```

Gọi lại khi ví đã được officer khóa vẫn thành công với `changed: false`. Nếu ví
đang bị transaction engine khóa tạm thời, API trả `err: 422` và không can thiệp
vào giao dịch.

### Mở khóa ví

`POST {{baseUrl}}/api/v1/officer/pockets/unlock`

```json
{
  "pocketId": "{{pocketId}}"
}
```

Gọi lại khi ví đã active vẫn thành công với `changed: false`. Endpoint chỉ mở
khóa do officer tạo, không mở khóa tạm thời của transaction engine.

## 4. Các request officer/customer có sẵn

Collection vẫn bao gồm các request quản lý officer và customer trước đó.

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

### Chi tiết, khóa và mở khóa customer

Các endpoint tương ứng:

```text
POST {{baseUrl}}/api/v1/officer/customers/detail
POST {{baseUrl}}/api/v1/officer/customers/lock
POST {{baseUrl}}/api/v1/officer/customers/unlock
```

Body:

```json
{
  "customerId": "{{customerId}}"
}
```

Khi khóa customer, mọi session active của customer bị revoke ngay.

### Đăng xuất officer

`POST {{baseUrl}}/api/v1/officer/auth/logout`

```json
{}
```

## 5. Response mẫu

Tạo ví thành công:

```json
{
  "err": 200,
  "message": "Pocket created",
  "data": {
    "pocket": {
      "id": "...",
      "ownerType": "system",
      "ownerId": "POSTMAN_SYSTEM",
      "name": "Postman System Wallet",
      "balance": 5000000,
      "currency": {
        "code": "VND",
        "name": "Vietnamese Dong",
        "minorUnit": 0
      },
      "status": "active",
      "lock": null
    }
  }
}
```
