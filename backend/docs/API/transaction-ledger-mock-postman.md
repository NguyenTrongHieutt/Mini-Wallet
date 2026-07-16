# Test Transaction, Trail, Ledger và Mock Biller không dùng Docker

## 1. Yêu cầu

- Node.js và dependencies của dự án (`npm install`).
- MongoDB Community 4.4 cài trực tiếp trên máy. Engine ledger dùng MongoDB transaction nên MongoDB phải chạy ở chế độ replica set, dù chỉ có một node.

## 2. Chạy MongoDB local dạng single-node replica set

PowerShell cửa sổ thứ nhất:

```powershell
New-Item -ItemType Directory -Force D:\mongodb\mini-wallet | Out-Null
& "C:\Program Files\MongoDB\Server\4.4\bin\mongod.exe" `
  --dbpath D:\mongodb\mini-wallet `
  --replSet rs0 `
  --bind_ip 127.0.0.1 `
  --port 27017
```

Chỉ trong lần khởi tạo đầu tiên, mở PowerShell thứ hai:

```powershell
& "C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe" `
  --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

Kiểm tra replica set đã sẵn sàng:

```powershell
& "C:\Program Files\MongoDB\Server\4.4\bin\mongo.exe" --eval "rs.status().ok"
```

Kết quả cần là `1`.

## 3. Seed và chạy API

PowerShell tại thư mục dự án:

```powershell
$env:MONGO_URI="mongodb://127.0.0.1:27017/mini_wallet?replicaSet=rs0"
npm run seed:currencies
npm run seed:officer
npm run seed:cash-in
npm start
```

Tài khoản officer mặc định:

```text
phone: 0900000000
password: Officer123
```

Seed `CASH_IN` tạo ví bank có số dư và service `CASH_IN` với bút toán debit bank, credit ví customer. Có thể chạy lại các lệnh seed an toàn.

## 4. Chạy collection Postman

Import file `transaction-ledger-mock.postman_collection.json`, sau đó chạy toàn bộ collection theo thứ tự. Collection tự thực hiện:

1. Đăng ký customer test.
2. Đăng nhập officer và lưu access token.
3. Trigger giao dịch `CASH_IN`, lưu `transRefId` và `transactionId`.
4. Gọi list/detail cho Trail và Transaction.
5. Gọi list PocketEntry, lưu `entryId` và xem chi tiết Entry.
6. Tạo, inquiry và payment một mock bill.

Tất cả API trả HTTP 200. Kiểm tra nghiệp vụ bằng `err`: `err === 200` là thành công.

## 5. Request mẫu quan trọng

Header cho API officer:

```http
Authorization: Bearer <officerAccessToken>
Content-Type: application/json
```

Trigger cash-in:

```json
{
  "serviceCode": "CASH_IN",
  "customerPhone": "0912345678",
  "amount": 50000,
  "currency": "VND",
  "message": "Cash-in tại quầy"
}
```

List Trail/Transaction hỗ trợ `page`, `pageSize`, `serviceCode`, `status`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`. Transaction còn hỗ trợ khoảng `amountFrom`, `amountTo`; Trail hỗ trợ `customerId`, `officerId`.

Detail Trail:

```json
{ "transRefId": "<transRefId>" }
```

Detail Transaction:

```json
{ "transactionId": "<transactionId>" }
```

List ledger theo một giao dịch:

```json
{ "transRefId": "<transRefId>" }
```

Detail một ledger entry:

```json
{ "entryId": "<entryId>" }
```

API list chỉ trả dữ liệu tóm tắt. API detail trả đầy đủ Entry, thông tin debit pocket, credit pocket và currency.

Mock bill create:

```json
{
  "providerCode": "EVN",
  "billCode": "BILL-20260715-001",
  "amount": 125000,
  "billInfo": {
    "customerName": "Nguyen Van A",
    "period": "2026-07"
  }
}
```

Inquiry:

```json
{
  "providerCode": "EVN",
  "billCode": "BILL-20260715-001"
}
```

Payment:

```json
{
  "providerCode": "EVN",
  "billCode": "BILL-20260715-001",
  "amount": 125000,
  "transRefId": "<transRefId>"
}
```

Payment có idempotency: gọi lại cùng `transRefId` vẫn thành công với `idempotent: true`; dùng `transRefId` khác cho bill đã thanh toán trả lỗi `409` trong trường `err`. Mock APIs tự bị chặn khi app chạy với `NODE_ENV=production`.
