# Agent 00 — Customer Protected API

## Phân công

Giao toàn bộ kế hoạch này cho **đúng một subagent: Agent 00**. Trước khi code, Agent 00 phải nạp `$security-best-practices` đã được cài và dùng checklist của skill để rà soát authentication, authorization, IDOR, checksum và lộ dữ liệu. Không sửa frontend ngoài hai bản OpenAPI được yêu cầu.

## Mục tiêu

Thêm hai endpoint protected:

- `POST /api/v1/customer/me`
- `POST /api/v1/customer/wallet/balance`

Cả hai dùng policy `customerAuth`, lấy customer từ `req.info.user`, trả qua response helper hiện có và tuân thủ envelope của dự án.

## Thay đổi backend

### Profile customer

- Thêm route `/api/v1/customer/me` trỏ tới action `CustomerController.me`.
- Giữ wildcard `customerAuth` cho `CustomerController`; nếu controller chưa tồn tại thì tạo theo conventions controller hiện có.
- Action không cần body và không truy vấn bằng ID client gửi lên.
- Trả `data.customer` qua serializer public hiện có hoặc bổ sung serializer tương đương, chỉ gồm:
  - `id`
  - `phone`
  - `displayName`
  - `status`
  - `createdAt`
  - `updatedAt`
- Không trả `passwordHash`, `pinHash`, `createdBy`, `updatedBy` hoặc metadata nội bộ.

Response thành công:

```json
{
  "err": 200,
  "message": "Customer profile",
  "data": {
    "customer": {
      "id": "customer-id",
      "phone": "0900000001",
      "displayName": "Nguyen Van A",
      "status": "active",
      "createdAt": "2026-07-16T00:00:00.000Z",
      "updatedAt": "2026-07-16T00:00:00.000Z"
    }
  }
}
```

### Số dư ví

- Thêm route `/api/v1/customer/wallet/balance` trỏ tới `CustomerWalletController.balance`.
- Khai báo `customerAuth` cho `CustomerWalletController` trong `config/policies.js`.
- Tạo `CustomerWalletService.getBalance(customer, body)` để controller chỉ điều phối request/response.
- `currency` là optional, mặc định `VND`, trim và uppercase; chỉ chấp nhận đúng ba ký tự chữ cái.
- Resolve currency theo conventions/model hiện tại và từ chối currency không tồn tại hoặc không active.
- Truy vấn pocket bằng đúng:
  - `ownerType: "customer"`
  - `ownerId: customer.id`
  - currency đã resolve
- Bỏ qua mọi `customerId`, `ownerId`, `pocketId` trong body.
- Kiểm tra checksum trên record gốc trước khi populate hoặc thay currency ID bằng object.
- Pocket `active` và `locked` đều được phép xem; API không tự mở khóa.
- Trả `{ pocket: AuthService.publicPocket(pocket) }`; không lộ checksum, ownerId hoặc dữ liệu lock nội bộ.

Request:

```json
{
  "currency": "VND"
}
```

### Message và lỗi

Bổ sung message/code theo cơ chế tập trung hiện có, không hard-code rải rác:

- `CUSTOMER_PROFILE`
- `CUSTOMER_PROFILE_FAILED`
- `CUSTOMER_WALLET_BALANCE`
- `CUSTOMER_WALLET_BALANCE_FAILED`
- `CUSTOMER_WALLET_NOT_FOUND`

Tái sử dụng lỗi checksum/currency/auth sẵn có nếu semantics phù hợp, đặc biệt `POCKET_CHECKSUM_INVALID`.

## OpenAPI và tài liệu

Cập nhật đồng bộ:

- `docs/API/customer-openapi.yaml`
- `frontend Mini-Wallet/customer-openapi.yaml`
- `docs/API/api.md`

Bổ sung tag `Customer Account`, `Customer Wallet`; path, cookie/bearer security, request/response example và schema:

- `CustomerProfileData`
- `WalletBalanceRequest`
- `WalletBalanceData`

Schema Pocket public phải phản ánh serializer thực tế, gồm cả `createdAt`, `updatedAt` nếu serializer trả hai field này.

## Kiểm thử và nghiệm thu

- Không token/token hết hạn trả business error `401`; token officer trả `403`.
- `/me` không lộ các field nhạy cảm.
- Body chứa ID của customer/pocket khác vẫn chỉ trả dữ liệu của customer trong token.
- Currency thiếu/rỗng dùng `VND`; currency sai định dạng trả `400`; currency không tồn tại/inactive trả lỗi phù hợp.
- Pocket active và locked đều đọc được; không có pocket trả `CUSTOMER_WALLET_NOT_FOUND`.
- Checksum sai trả `POCKET_CHECKSUM_INVALID` và không trả pocket.
- Chạy `node --check` cho file mới/sửa, boot Sails và kiểm thử flow register → me → balance → logout.

