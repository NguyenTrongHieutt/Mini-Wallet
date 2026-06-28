# Danh sách API tổng hợp

> Tất cả API sử dụng method `POST`.

> Quy ước dự án phải tuân thủ.

**Response & mã lỗi**

- **HTTP status luôn là 200**, kể cả khi nghiệp vụ lỗi. Client phân biệt thành/bại bằng trường `err`, **không** bằng HTTP status.
- **Envelope thống nhất:** mọi API trả về dạng `{ err, message, ...data }`. Quy ước: `err === 200` là thành công; `err !== 200` là mã lỗi nghiệp vụ.
- Việc đóng gói response được tập trung ở `api/responses/` (ví dụ `res.ok(data)`, `res.error(...)`, `res.badRequest()`, `res.serverError()`), không tự `res.json` rải rác trong controller. `return` khi gọi response để dừng luồng xử lý.
- **Mã lỗi tập trung** ở một service dùng chung (ví dụ `respCode`), không hard-code chuỗi/số lỗi rải rác.

**Routing**

- **Blueprint tắt** (`actions`, `rest`, `shortcuts` đều `false`) → Sails không tự sinh API; mọi endpoint phải **tự khai** trong `config/routes.js`.
- **Mọi API dùng method `POST`**.

**Policy & xác thực**

- **Deny-by-default:** `config/policies.js` đặt `'*': false`; action nào không được khai báo policy sẽ bị chặn. Chỉ API công khai mới đặt `true`.

---

## 1. Public APIs

| API                                   | Mục đích                   |
| ------------------------------------- | -------------------------- |
| `POST /api/v1/customer/auth/register` | Đăng ký customer và tạo ví |
| `POST /api/v1/customer/auth/login`    | Đăng nhập customer         |
| `POST /api/v1/officer/auth/login`     | Đăng nhập officer          |

---

## 2. Customer Protected APIs

### 2.1. Tài khoản customer

| API                                 | Mục đích                       |
| ----------------------------------- | ------------------------------ |
| `POST /api/v1/customer/me`          | Xem thông tin profile customer |
| `POST /api/v1/customer/auth/logout` | Đăng xuất customer             |

### 2.2. Ví customer

| API                                    | Mục đích                                  |
| -------------------------------------- | ----------------------------------------- |
| `POST /api/v1/customer/wallet/balance` | Xem số dư ví, chỉ xem được của chính mình |

### 2.3. Service và Provider

| API                                    | Mục đích                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `POST /api/v1/customer/services/list`  | Xem danh sách service đang active, không trả về fieldBuilder, auth,actions, fee |
| `POST /api/v1/customer/providers/list` | Xem danh sách provider có status active, không trả về các URL, PocketID         |

### 2.4. Giao dịch

| API                                 | Mục đích                   |
| ----------------------------------- | -------------------------- |
| `POST /api/v1/transactions/request` | Bước 1: Khởi tạo giao dịch |
| `POST /api/v1/transactions/confirm` | Bước 2: Xác nhận giao dịch |
| `POST /api/v1/transactions/verify`  | Bước 3: Thực thi giao dịch |
| `POST /api/v1/transactions/cancel`  | Hủy giao dịch đang pending |

### 2.5. Lịch sử giao dịch

| API                                         | Mục đích                        |
| ------------------------------------------- | ------------------------------- |
| `POST /api/v1/customer/transactions/list`   | Xem lịch sử giao dịch           |
| `POST /api/v1/customer/transactions/detail` | Xem chi tiết biên lai giao dịch |

---

## 3. Officer Protected APIs

### 3.1. Tài khoản officer

| API                                | Mục đích                      |
| ---------------------------------- | ----------------------------- |
| `POST /api/v1/officer/me`          | Xem thông tin profile officer |
| `POST /api/v1/officer/auth/logout` | Đăng xuất officer             |

### 3.2. Quản lý customer

| API                                     | Mục đích                 |
| --------------------------------------- | ------------------------ |
| `POST /api/v1/officer/customers/list`   | Xem danh sách khách hàng |
| `POST /api/v1/officer/customers/detail` | Xem chi tiết khách hàng  |
| `POST /api/v1/officer/customers/lock`   | Khóa khách hàng          |
| `POST /api/v1/officer/customers/unlock` | Mở khóa khách hàng       |

### 3.3. Quản lý ví

| API                                   | Mục đích           |
| ------------------------------------- | ------------------ |
| `POST /api/v1/officer/pockets/create` | Tạo ví System/Bank |
| `POST /api/v1/officer/pockets/list`   | Xem danh sách ví   |
| `POST /api/v1/officer/pockets/detail` | Xem chi tiết ví    |
| `POST /api/v1/officer/pockets/lock`   | Khóa ví            |
| `POST /api/v1/officer/pockets/unlock` | Mở khóa ví         |

### 3.4. Quản lý provider

| API                                         | Mục đích                    |
| ------------------------------------------- | --------------------------- |
| `POST /api/v1/officer/providers/create`     | Tạo provider và ví provider |
| `POST /api/v1/officer/providers/list`       | Xem danh sách provider      |
| `POST /api/v1/officer/providers/detail`     | Xem chi tiết provider       |
| `POST /api/v1/officer/providers/update`     | Cập nhật thông tin provider |
| `POST /api/v1/officer/providers/activate`   | Kích hoạt provider          |
| `POST /api/v1/officer/providers/deactivate` | Tắt provider                |

### 3.5. Quản lý service/config

| API                                                      | Mục đích                              |
| -------------------------------------------------------- | ------------------------------------- |
| `POST /api/v1/officer/services/create`                   | Tạo Service ở trạng thái draft        |
| `POST /api/v1/officer/services/list`                     | Xem danh sách Service                 |
| `POST /api/v1/officer/services/detail`                   | Xem thông tin cơ bản Service          |
| `POST /api/v1/officer/services/update`                   | Cập nhật thông tin cơ bản của Service |
| `POST /api/v1/officer/services/trans-fields/list`        | Xem danh sách TransField              |
| `POST /api/v1/officer/services/trans-validations/list`   | Xem danh sách TransValidation         |
| `POST /api/v1/officer/services/detail`                   | Xem thông tin cơ bản Service          |
| `POST /api/v1/officer/services/trans-fields/update`      | Cập nhật `TransField`                 |
| `POST /api/v1/officer/services/trans-validations/update` | Cập nhật `TransValidation`            |
| `POST /api/v1/officer/services/field-builder/update`     | Cập nhật `fieldBuilder`               |
| `POST /api/v1/officer/services/trans-fields/insert`      | Thêm `TransField`                     |
| `POST /api/v1/officer/services/trans-validations/insert` | Thêm `TransValidation`                |
| `POST /api/v1/officer/services/trans-definition/update`  | Cập nhật `TransDefinition`            |
| `POST /api/v1/officer/services/publish`                  | Bật Service                           |
| `POST /api/v1/officer/services/unpublish`                | Tắt Service                           |

### 3.6. Trigger giao dịch

| API                                         | Mục đích                                 |
| ------------------------------------------- | ---------------------------------------- |
| `POST /api/v1/officer/transactions/trigger` | Officer trigger giao dịch, ví dụ Cash-in |

### 3.7. Quản lý TransactionTrail

| API                                  | Mục đích            |
| ------------------------------------ | ------------------- |
| `POST /api/v1/officer/trails/list`   | Xem danh sách Trail |
| `POST /api/v1/officer/trails/detail` | Xem chi tiết Trail  |

### 3.8. Quản lý Transaction

| API                                        | Mục đích                 |
| ------------------------------------------ | ------------------------ |
| `POST /api/v1/officer/transactions/list`   | Xem lịch sử Transaction  |
| `POST /api/v1/officer/transactions/detail` | Xem chi tiết Transaction |

### 3.9. Ledger/PocketEntry

| API                                        | Mục đích                  |
| ------------------------------------------ | ------------------------- |
| `POST /api/v1/officer/ledger/entries/list` | Xem danh sách PocketEntry |
| `POST /api/v1/officer/ledger/reconcile`    | Đối soát ledger           |

---

## 4. Mock/Dev APIs

### 4.1. Mock biller

| API                                     | Mục đích          |
| --------------------------------------- | ----------------- |
| `POST /api/v1/mock/biller/bills/create` | Tạo bill mẫu      |
| `POST /api/v1/mock/biller/inquiry`      | Mock inquiry bill |
| `POST /api/v1/mock/biller/payment`      | Mock payment bill |

### 4.2. Dev seed

| API                          | Mục đích         |
| ---------------------------- | ---------------- |
| `POST /api/v1/dev/seed/init` | Seed dữ liệu nền |
