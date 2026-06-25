# Mini-Wallet — Model Overview 

---

## 1. Bức tranh tổng thể

Mini-Wallet có 4 nhóm model chính:

| Nhóm                    | Model                                                         | Mục đích                                                          |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Danh tính / Đối tác** | `Customer`, `Officer`, `Provider`                             | Ai dùng hệ thống, ai vận hành, ai nhận tiền hóa đơn               |
| **Sổ tiền / Ledger**    | `Pocket`, `PocketEntry`, `Currency`                           | Giữ số dư, ghi dấu vết debit-credit, quản lý loại tiền            |
| **Config nghiệp vụ**    | `Service`, `TransField`, `TransValidation`, `TransDefinition` | Officer mô tả nghiệp vụ bằng dữ liệu để engine chạy               |
| **Runtime giao dịch**   | `TransactionTrail`, `Transaction`                             | Theo dõi 3 bước request-confirm-verify và lưu biên lai thành công |
| **Xác thực phiên**      | `Token` / `Session`                                           | Lưu trạng thái đăng nhập, phục vụ policy bearer                   |

---

## 2. Quy ước chung cho tất cả model

### 2.1 Field nền có

Hầu hết model nên có các field nền sau:

| Field | Gợi ý kiểu      | Vai trò           |
| ----- | --------------- | ----------------- |
| `_id` | ObjectId / UUID | Khóa chính nội bộ |
| `createdAt` | Date | Thời điểm tạo |
| `updatedAt` | Date | Thời điểm cập nhật |
| `createdBy` | Ref | Ai tạo, hữu ích cho admin audit |
| `updatedBy` | Ref | Ai sửa gần nhất |

### 2.2 Quy ước status

Có thể thống nhất các status cơ bản:

| Status      | Dùng cho                                   | Ý nghĩa                                      |
| ----------- | ------------------------------------------ | -------------------------------------------- |
| `active`    | Customer, Officer, Biller, Service, Pocket | Được phép sử dụng                            |
| `inactive`  | Biller, Service, config                    | Tạm tắt, không cho dùng mới                  |
| `locked`    | Customer, Pocket                           | Tạm khóa do giao dịch đang xử lý hoặc rủi ro |
| `pending`   | TransactionTrail                           | Đã request, chờ confirm/verify               |
| `done`      | TransactionTrail, Transaction              | Giao dịch thành công                         |
| `failed`    | TransactionTrail, Transaction              | Giao dịch thất bại                           |
| `cancelled` | TransactionTrail                           | Giao dịch bị hủy hoặc hết hạn                |

---

## 3. Nhóm danh tính / đối tác

## 3.1 `Customer`

### Field

| Field          | Kiểu       | Bắt buộc | Ghi chú                                   |
| -------------- | ---------- | -------- | ----------------------------------------- |
| `phone`        | String     | Có       | Duy nhất, dùng đăng nhập và nhận tiền P2P |
| `passwordHash` | String     | Có       | Password dạng hash                        |
| `pinHash`      | String     | Có       | Không bao giờ lưu PIN thô                 |
| `displayName`  | String     | Không    | Hiển thị cho khách hàng                   |
| `status`       | String     | Có       | `active`, `inactive`, `locked`            |
| `pocketId`     | Ref Pocket | Có       | Ví customer tự sinh khi đăng ký           |

### Quan hệ

- 1 `Customer` có 1 `Pocket` loại `customer`.
- 1 `Customer` có nhiều `TransactionTrail`.
- 1 `Customer` có nhiều `Transaction` trong vai sender hoặc receiver.

### Index / unique

- Unique index: `phone`.
- Index: `status`,`displayName`.

---

## 3.2 `Officer`

### Field

| Field          | Kiểu   | Bắt buộc | Ghi chú                   |
| -------------- | ------ | -------- | ------------------------- |
| `phone`        | String | Có       | Duy nhất, dùng đăng nhập. |
| `passwordHash` | String | Có       | Password dạng hash        |
| `displayName`  | String | Không    | Hiển thị admin            |
| `status`       | String | Có       | `active`, `inactive`      |

### Index / unique

- Unique index: `phone`.
- Index: `status`, `displayName`.

---

## 3.3 `Provider`

### Field

| Field        | Kiểu       | Bắt buộc | Ghi chú                                                           |
| ------------ | ---------- | -------- | ----------------------------------------------------------------- |
| `type`       | String     | Có       | Loại provider, ví dụ `biller`, `telco`, `bank`, `voucher`         |
| `code`       | String     | Có       | Mã provider, duy nhất theo `type`, ví dụ `EVN`, `WATER_HN`        |
| `name`       | String     | Có       | Tên provider hiển thị                                             |
| `category`   | String     | Không    | Nhóm provider, ví dụ `electricity`, `water`, `internet`, `mobile` |
| `requestUrl` | String     | Không    | URL gọi ở bước Request; ví dụ URL tra hóa đơn                     |
| `confirmUrl` | String     | Không    | URL gọi ở bước Confirm;                                           |
| `verifyUrl`  | String     | Không    | URL gọi ở bước Verify; ví dụ URL thanh toán hóa đơn               |
| `pocketId`   | Ref Pocket | Không    | Ví nhận tiền của provider; bắt buộc nếu provider cần nhận tiền    |
| `status`     | String     | Có       | `active`, `inactive`                                              |

### Quan hệ

- 1 `ActionProvider` có thể có 1 `Pocket`.
- 1 `Service` có thể dùng `ActionProvider` tại runtime thông qua `Service.actions.provider`.
- Với `type = 'biller'`, `pocketId` là ví nhận tiền khi khách thanh toán hóa đơn.

### Index / unique

- Unique compound index: `type`, `code`.
- Index: `status`.
- Index: `type`.
- Index: `category`.

---

## 4. Nhóm sổ tiền / Ledger

## 4.1 `Currency`

### Field

| Field       | Kiểu   | Bắt buộc | Ghi chú                            |
| ----------- | ------ | -------- | ---------------------------------- |
| `code`      | String | Có       | Ví dụ `VND`, `MMK`                 |
| `name`      | String | Có       | Tên loại tiền                      |
| `minorUnit` | Number | Có       | Số chữ số thập phân, ví dụ VND = 0 |
| `status`    | String | Có       | `active`, `inactive`               |

### Index / unique

- Unique index: `code`.

---

## 4.2 `Pocket`

### Field

| Field       | Kiểu                  | Bắt buộc | Ghi chú                                     |
| ----------- | --------------------- | -------- | ------------------------------------------- |
| `ownerId`   | Ref / String          | Không    | Customer/Biller id; System/Bank có thể null |
| `ownerType` | String                | Có       | `customer`, `biller`, `system`, `bank`      |
| `currency`  | Ref Currency / String | Có       | Loại tiền                                   |
| `balance`   | Number                | Có       | Số dư hiện tại                              |
| `checksum`  | String                | Có       | Dấu vân tay chống sửa tay                   |
| `status`    | String                | Có       | `active`, `locked`, `inactive`              |
| `name`      | String                | Không    | Dễ nhìn cho ví System/Bank                  |

### Index / unique

- Index: `ownerType`, `status`, `currency`.

---

## 4.3 `PocketEntry`

### Field

| Field            | Kiểu                 | Bắt buộc | Ghi chú                   |
| ---------------- | -------------------- | -------- | ------------------------- |
| `transRefId`     | Ref TransactionTrail | Có       | Nối với Trail/Transaction |
| `stepOrder`      | Number               | Có       | Thứ tự glStep             |
| `debitPocketId`  | Ref Pocket           | Có       | Ví bị trừ                 |
| `creditPocketId` | Ref Pocket           | Có       | Ví được cộng              |
| `amount`         | Number               | Có       | Số tiền của step          |
| `currency`       | Ref Currency         | Có       | Loại tiền                 |
| `status`         | String               | Có       | Thường là `settled`       |

### Index

- Index: `transRefId`.
- Index: `debitPocketId`, `creditPocketId`.
- Index: `createdAt`.

---

## 5. Nhóm config nghiệp vụ

## 5.1 `Service`

### Field

| Field           | Kiểu   | Bắt buộc | Ghi chú                                                                       |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `code`          | String | Có       | Ví dụ `P2P_TRANSFER`, duy nhất                                                |
| `name`          | String | Có       | Tên hiển thị                                                                  |
| `description`   | String | Không    | Mô tả ngắn                                                                    |
| `fieldBuilder`  | Array  | Có       | Danh sách rule dựng biến vào `TRANSBODY`                                      |
| `actions`       | Object | Không    | Cấu hình action ngoài theo từng giai đoạn runtime                             |
| `fee`           | Object | Có       | { type: 'fixed', value: 100 } hoặc { type: 'percent', value: 0.5, max: 5000 } |
| `auth`          | Object | Có       | `{ method: 'PIN' }` hoặc `{ method: 'NONE' }`                                 |
| `status`        | String | Có       | `draft`, `active`, `inactive`                                                 |

### `actions`

| Field      | Kiểu   | Bắt buộc | Ghi chú                                      |
| ---------- | ------ | -------- | -------------------------------------------- |
| `provider` | Object | Không    | Quy định lấy provider nào để gọi action      |
| `request`  | Object | Không    | Action chạy ở bước Request                   |
| `confirm`  | Object | Không    | Action chạy ở bước Confirm, nếu provider cần |
| `verify`   | Object | Không    | Action chạy ở bước Verify                    |

### Cấu trúc mỗi action

| Field         | Kiểu    | Bắt buộc | Ghi chú                                                                       |
| ------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `enabled`     | Boolean | Có       | Bật/tắt action ở giai đoạn đó                                                 |
| `urlField`    | String  | Không    | Tên field URL trong `Provider`, ví dụ `requestUrl`, `confirmUrl`, `verifyUrl` |
| `method`      | String  | Không    | HTTP method, mặc định có thể là `POST`                                        |
| `requestMap`  | Object  | Không    | Map dữ liệu từ `TRANSBODY` sang request body gửi provider                     |
| `responseMap` | Object  | Không    | Map dữ liệu từ response của provider vào lại `TRANSBODY`                      |
| `successRule` | Object  | Không    | Điều kiện xác định provider trả thành công                                    |

### `provider` trong actions

| Field        | Kiểu   | Bắt buộc | Ý nghĩa                                                           |
| ------------ | ------ | -------- | ----------------------------------------------------------------- |
| `type`       | String | Có       | Loại provider cần tìm, ví dụ `biller`, `telco`, `bank`, `voucher` |
| `codeSource` | String | Có       | Nguồn lấy provider code: `TRANSBODY` hoặc `FIXED`                 |
| `codeField`  | String | Không    | Field trong `TRANSBODY` chứa provider code, ví dụ `PROVIDERCODE`  |
| `codeValue`  | String | Không    | Provider code cố định nếu `codeSource = FIXED`, ví dụ `EVN`       |

### `fieldBuilder[]`

| Field       | Kiểu          | Bắt buộc | Ý nghĩa                                                         |
| ----------- | ------------- | -------- | --------------------------------------------------------------- |
| `order`     | Number        | Có       | Thứ tự chạy                                                     |
| `name`      | String        | Có       | Tên biến output, ví dụ `SENDERID`, `AMOUNT`                     |
| `rule`      | String        | Có       | `fixed`, `mapping`, `query`                                     |
| `source`    | String        | Có       | Nguồn dữ liệu: `body`, `user`, `constant`, `database`           |
| `variable`  | String        | Không    | Đường dẫn biến input nếu là `mapping`                           |
| `value`     | Any           | Không    | Giá trị cố định nếu là `fixed`                                  |
| `query`     | String        | Không    | Tên query/helper nếu là `query`                                 |
| `params`    | Array<String> | Không    | Danh sách biến truyền vào query                                 |
| `output`    | String        | Không    | Field lấy ra từ kết quả query                                   |
| `datatype`  | String        | Có       | Kiểu dữ liệu mong muốn: `string`, `number`, `boolean`, `object` |
| `errorCode` | String        | Có       | Mã lỗi nếu build fail                                           |

### Quan hệ

- 1 `Service` có nhiều `TransField`.
- 1 `Service` có nhiều `TransValidation`.
- 1 `Service` có 1 `TransDefinition`.
- 1 `Service` có nhiều `TransactionTrail` và `Transaction`.

### Index / unique

- Unique index: `code`.
- Index: `status`, `action`.

## 5.2 `TransField`

### Field

| Field         | Kiểu          | Bắt buộc | Ghi chú                                  |
| ------------- | ------------- | -------- | ---------------------------------------- |
| `service`     | String        | Có       | Theo brief: dùng `String(service._id)`   |
| `fieldName`   | String        | Có       | Ví dụ `SERVICEID`, `AMOUNT`              |
| `fieldFormat` | String        | Có       | `string`, `number`, `phone`, `object`... |
| `minLength`   | Number        | Không    | Với string                               |
| `maxLength`   | Number        | Không    | Với string                               |
| `regex`       | String        | Không    | Kiểm tra định dạng                       |
| `isRequired`  | Boolean       | Có       | Có bắt buộc không                        |
| `needSecured` | Boolean       | Có       | Có cần mask/log kín không                |
| `order`       | Number        | Có       | Thứ tự validate                          |
| `errorCode`   | String/Number | Không    | Mã lỗi                                   |
| `status`      | String        | Có       | `active`, `inactive`                     |

### Index

- Index: `service`, `status`.
- Unique gợi ý: `(service, fieldName)`.

---

## 5.3 `TransValidation`

### Field

| Field            | Kiểu          | Bắt buộc | Ghi chú                           |
| ---------------- | ------------- | -------- | --------------------------------- |
| `service`        | String        | Có       | Theo brief: `String(service._id)` |
| `validateFunc`   | String        | Có       | Tên hàm validator                 |
| `validateFields` | String        | Có       | Ví dụ `SENDERID:RECEIVERID`       |
| `order`          | Number        | Có       | Thứ tự chạy                       |
| `errorCode`      | String/Number | Không    | Mã lỗi                            |
| `status`         | String        | Có       | `active`, `inactive`              |

### Index

- Index: `service`, `status`, `order`.

---

## 5.4 `TransDefinition`

### Field

| Field     | Kiểu   | Bắt buộc | Ghi chú                               |
| --------- | ------ | -------- | ------------------------------------- |
| `code`    | String | Có       | Theo brief dùng `String(service._id)` |
| `glSteps` | Array  | Có       | Danh sách step debit-credit           |
| `status`  | String | Có       | `active`, `inactive`                  |

### `glSteps[]`

| Field    | Kiểu   | Bắt buộc | Ý nghĩa                                                    |
| -------- | ------ | -------- | ---------------------------------------------------------- |
| `order`  | Number | Có       | Thứ tự chạy step                                           |
| `amount` | String | Có       | Biến số tiền trong `TRANSBODY`, ví dụ `AMOUNT`, `DEBITFEE` |
| `debit`  | Object | Có       | Ví bị trừ tiền                                             |
| `credit` | Object | Có       | Ví được cộng tiền                                          |

### `debit` / `credit`

`debit` và `credit` có cùng cấu trúc:

| Field    | Kiểu   | Bắt buộc | Ý nghĩa                                                                       |
| -------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `level`  | String | Có       | Cách xác định ví: `productLevel` hoặc `wallet`                                |
| `target` | String | Có       | Nếu `productLevel` thì là biến runtime; nếu `wallet` thì là pocket id cố định |

### Quy ước `level`

| `level`        | Ý nghĩa                                       | Ví dụ `target`                    |
| -------------- | --------------------------------------------- | --------------------------------- |
| `productLevel` | Lấy pocket id động từ `TRANSBODY` lúc runtime | `SENDERID`, `RECEIVERID`          |
| `wallet`       | Dùng pocket id cố định đã cấu hình sẵn        | `<SYSTEM_POCKET_ID>`, `<BANK_ID>` |

### Index

- Unique gợi ý: `code`.
- Index: `status`.

---

## 6. Nhóm runtime giao dịch

## 6.1 `TransactionTrail`

### Field

| Field           | Kiểu         | Bắt buộc | Ghi chú                                          |
| --------------- | ------------ | -------- | ------------------------------------------------ |
| `serviceId`     | Ref Service  | Có       | Service đang chạy                                |
| `customerId`    | Ref Customer | Không    | Với giao dịch customer trigger                   |
| `officerId`     | Ref Officer  | Không    | Với cash-in/admin trigger                        |
| `inputMessage`  | Object       | Có       | Request gốc                                      |
| `outputMessage` | Object       | Có       | Có `TRANSBODY`                                   |
| `status`        | String       | Có       | `init`, `pending`, `done`, `failed`, `cancelled` |
| `expiredAt`  | Date         | Có       | Hạn phiên                      |
| `errorCode`     | String       | Không    | Lỗi cuối nếu có                                  |
| `errorMessage`  | String       | Không    | Message lỗi                                      |

### Index

- Index: `serviceId`, `status`, `createdAt`.
- Index: `customerId`, `createdAt`.
- Index: `officerId`, `createdAt`.
- Index: `expiredAt`.

---

## 6.2 `Transaction`

### Field 

| Field         | Kiểu                  | Bắt buộc | Ghi chú                                              |
| ------------- | --------------------- | -------- | ---------------------------------------------------- |
| `code`        | String                | Có       | Mã biên lai hiển thị                                 |
| `serviceId`   | Ref Service           | Có       | Service đang chạy                                    |
| `transRefId`  | Ref TransactionTrail  | Có       | Nối với Trail                                        |
| `senderId`    | Ref                   | Không    | Customer/officer/bank tùy nghiệp vụ                  |
| `receiverId`  | Ref                   | Có       | Customer/biller tùy nghiệp vụ                        |
| `amount`      | Number                | Có       | Số tiền gốc                                          |
| `fee`         | Number                | Có       | Phí debit từ sender                                  |
| `totalAmount` | Number                | Có       | `amount + fee`                                       |
| `currency`    | Ref Currency / String | Có       | Loại tiền                                            |
| `message`     | String                | không    | Ghi chú                                              |
| `status`      | String                | Có       | `done`, hoặc `failed` nếu nhóm muốn lưu fail receipt |

### Index / unique

- Unique index: `code`.
- Index: `serviceId`, `createdAt`.
- Index: `senderId`, `createdAt`.
- Index: `receiverId`, `createdAt`.

---

## 7. Session

### Field 

| Field        | Kiểu         | Bắt buộc | Ghi chú                        |
| ------------ | ------------ | -------- | ------------------------------ |
| `tokenHash`  | String       | Có       | Không nên lưu token thô        |
| `userType`   | String       | Có       | `customer`, `officer`          |
| `userId`     | Ref / String | Có       | Id người đăng nhập             |
| `status`     | String       | Có       | `active`, `revoked`, `expired` |
| `expiredAt`  | Date         | Có       | Hạn phiên                      |
| `lastUsedAt` | Date         | Không    | Theo dõi sử dụng               |

### Index

- Unique index: `tokenHash`.
- Index: `userType`, `userId`.
- Index: `expiredAt`.
