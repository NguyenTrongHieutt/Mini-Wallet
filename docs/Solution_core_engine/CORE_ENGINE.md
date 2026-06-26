# Core Engine Components - Mini Wallet

---

## 1. Mục tiêu của Core Engine

Core Engine là lớp xử lý nghiệp vụ giao dịch ví theo mô hình cấu hình động. Thay vì viết riêng luồng xử lý cho từng nghiệp vụ như chuyển tiền, nạp tiền hay thanh toán hóa đơn, engine đọc cấu hình từ các model nghiệp vụ và chạy cùng một pipeline:

1. `Request`: dựng dữ liệu giao dịch, validate đầu vào, gọi inquiry nếu cần và trả preview.
2. `Confirm`: kiểm tra giao dịch đang pending, xác định phương thức xác thực, gọi api bên ngoài nếu có.
3. `Verify`: xác thực, khóa ví, validate lại, chạy bút toán debit-credit và tạo biên lai, gọi api bên ngoài nếu có.

Các thành phần chính của engine gồm API/Orchestrator, Transaction facade, NeonMessage router, Runtime Process, nhóm model cấu hình nghiệp vụ, nhóm model ledger và nhóm model runtime giao dịch.

---

## 2. Sơ đồ trách nhiệm tổng quát

| Thành phần                 | Vai trò chính                                             | Dữ liệu đọc                                                                   | Dữ liệu trả                        |
| -------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `Controller`               | Nhận request từ client hoặc officer                       | Request body, user info                                                       | Response envelope                  |
| `TransactionOrchestrator`  | Tự động chạy đủ 3 bước cho nghiệp vụ server-trigger       | Input nghiệp vụ, kết quả từng bước                                            | Response cuối cùng                 |
| `Transaction.js`           | Facade chuẩn hóa input và gán `TRANSTEP`                  | Request body, user info                                                       | `transInput`                       |
| `NeonMessage.js`           | Router theo `TRANSTEP` hoặc dựng message runtime          | `transInput`                                                                  | Message có trail                   |
| `Runtime Process`          | Trung tâm xử lý nghiệp vụ ví                              | Service config gồm `fieldBuilder`, `actions`, `fee`, `auth`, message có trail | Preview, receipt, trạng thái trail |
| `Service`                  | Cấu hình nghiệp vụ tổng                                   | `serviceCode`                                                                 | Service config                     |
| `Provider`                 | Cấu hình đối tác ngoài                                    | `providerCode`                                                                | URL/action config, `pocketId`      |
| `TransField`               | Luật validate field trong `TRANSBODY`, thực hiện validate | `serviceCode`,`TRANSBODY`                                                     | Kết quả validate                   |
| `TransValidation`          | Luật validate nghiệp vụ, thực hiện validate               | `serviceCode`,`TRANSBODY`                                                     | Kết quả validate                   |
| `TransDefinition`          | Định nghĩa bút toán ledger                                | `serviceCode`                                                                 | `glSteps`                          |
| `TransactionTrail`         | Lưu trạng thái tạm của giao dịch, check trạng thái trail  | ` TRANSREFID`                                                                 | `TransactionTrail`                 |
| `MongoTransactionExecutor` | Thực thi atomic ledger transaction                        | Lệnh ghi database                                                             | kết quả transaction                |

---

## 3. Thành phần tiếp nhận và điều phối

## 3.1 `Controller`

Controller là điểm vào HTTP của giao dịch. Nó không xử lý nghiệp vụ ví trực tiếp mà chỉ:

- Nhận request từ customer hoặc officer.
- Lấy thông tin người dùng đã xác thực từ `req.info.user`.
- Gọi đúng hàm engine theo endpoint:
  - `/transaction/request` gọi `engineRequestTransaction`.
  - `/transaction/confirm` gọi `engineConfirmTransaction`.
  - `/transaction/verify` gọi `engineVerifyTransaction`.
  - `/transaction/trigger` gọi `TransactionOrchestrator`.
- Trả kết quả theo envelope thống nhất gồm `err`, `message`, `data`.

Controller nên giữ mỏng để nghiệp vụ tập trung trong core engine.

## 3.2 `TransactionOrchestrator`

Orchestrator phục vụ các nghiệp vụ do server hoặc officer trigger một lần, ví dụ `CASH_IN`.

Nhiệm vụ:

- Nhận input ban đầu từ controller.
- Gọi tuần tự 3 runtime core: request, confirm, verify.
- Sau bước confirm, đọc `authMethod`.
- Nếu `authMethod = NONE`, tự động gọi verify.
- Nếu `authMethod = PIN`, dừng lại và trả trạng thái cần xác thực.

Orchestrator không tự validate nghiệp vụ, không tự ghi ledger và không tự gọi provider. Nó chỉ điều phối lại core engine.

## 3.3 `Transaction.js`

`Transaction.js` đóng vai trò facade trước khi request đi vào runtime.

Nhiệm vụ:

- Chuẩn hóa input từ controller hoặc orchestrator.
- Gắn `TRANSTEP`:
  - `1` cho request.
  - `2` cho confirm.
  - `3` cho verify.
- Đưa `transInput` vào `NeonMessage.routeProcess`.
- Nhận kết quả runtime và trả lại envelope cho controller/orchestrator.

Thành phần này giúp các endpoint bên ngoài không cần biết chi tiết route nội bộ của engine.

## 3.4 `NeonMessage.js`

`NeonMessage.js` là lớp route và dựng message runtime.

Nhiệm vụ:

- Đọc `TRANSTEP` để gọi đúng hàm trong Runtime Process:
  - `processRequestStep`.
  - `processConfirmStep`.
  - `processVerifyStep`.
- Dựng message bằng `NeonMessage.BuildMessage(transInput)`.
- Với step request, tạo mới `TransactionTrail`.
- Với step confirm/verify, tìm `TransactionTrail` theo `TRANSREFID` và status `pending`.
- Trả về message có `trail` cho Runtime Process.

Nói ngắn gọn, `NeonMessage.js` biến input thô thành context runtime có thể xử lý.

---

## 4. Runtime Process

Runtime Process là lõi xử lý nghiệp vụ ví. Nó là nơi quyết định pipeline chạy thế nào dựa trên cấu hình service.

## 4.1 Nhiệm vụ chung

- Load `Service` theo `serviceCode` ở bước request hoặc theo `serviceId` trong trail ở bước confirm/verify.
- Dựng `TRANSBODY` từ `Service.fieldBuilder`.
- Gắn `TRANSREFID = trail.id`.
- Lưu `TRANSBODY` vào `TransactionTrail.outputMessage`.
- Validate field bằng `TransField`.
- Gọi provider action nếu service cấu hình action ở bước tương ứng.
- Tính phí và `TOTALAMOUNT`.
- Validate nghiệp vụ bằng `TransValidation`.
- Kiểm tra xác thực theo `Service.auth`.
- Load `TransDefinition.glSteps`.
- Gọi `MongoTransactionExecutor` để ghi ledger.
- Cập nhật `TransactionTrail` sang `pending`, `done` hoặc `failed`.
- Trả preview hoặc receipt.

## 4.2 Step 1 - Request

Mục tiêu của request là tạo phiên giao dịch pending và trả thông tin preview cho người dùng.

Luồng chính:

1. Tạo `TransactionTrail`.
2. Load `Service` bằng `serviceCode`.
3. Dựng `TRANSBODY` từ `fieldBuilder`.
4. Validate cấu trúc field bằng `TransField`.
5. Nếu `actions.request.enabled = true`, gọi provider để inquiry và map response vào `TRANSBODY`.
6. Tính phí.
7. Validate nghiệp vụ bằng `TransValidation`.
8. Cập nhật trail status thành `pending`.
9. Trả preview gồm amount, fee, totalAmount và `transRefId`.

Ví dụ:

- P2P transfer không có provider action, engine bỏ qua request action.
- Bill payment có request action để lấy thông tin hóa đơn và amount từ biller.

## 4.3 Step 2 - Confirm

Mục tiêu của confirm là xác nhận giao dịch pending còn hợp lệ và cho client biết cần xác thực bằng gì.

Luồng chính:

1. Tìm `TransactionTrail` theo `TRANSREFID` và status `pending`.
2. Load `Service` từ `trail.service`.
3. Nếu `actions.confirm.enabled = true`, gọi provider confirm.
4. Đọc `Service.auth.method`.
5. Trả `authMethod` và `transRefId`.

Kết quả:

- Nếu `auth.method = PIN`, client cần nhập PIN rồi gọi verify.
- Nếu `auth.method = NONE`, orchestrator có thể tự gọi verify.

## 4.4 Step 3 - Verify

Mục tiêu của verify là thực hiện giao dịch thật trên ledger.

Luồng chính:

1. Tìm `TransactionTrail` pending bằng `TRANSREFID`.
2. Khóa ví gửi bằng `validateStateAndLockPocket(SENDERID)`.
3. Kiểm tra lại trạng thái trail để tránh xử lý trùng.
4. Load `Service`.
5. Nếu `auth.method = PIN`, verify PIN.
6. Validate lại `TRANSBODY` bằng `TransField`.
7. Tính lại phí để tránh lệch dữ liệu giữa preview và verify.
8. Validate lại nghiệp vụ bằng `TransValidation`.
9. Load `TransDefinition.glSteps`.
10. Mở MongoDB transaction.
11. Debit/credit các ví theo `glSteps`.
12. Tạo `PocketEntry`.
13. Tạo `Transaction` receipt.
14. Nếu `actions.verify.enabled = true`, gọi provider payment/verify và map response.
15. Cập nhật `TransactionTrail` thành `done`.
16. Commit MongoDB transaction.
17. Mở khóa ví gửi.
18. Trả receipt.

Verify là bước quan trọng nhất vì nó thay đổi số dư ví và tạo dấu vết ledger.

---

## 5. Nhóm cấu hình nghiệp vụ

## 5.1 `Service`

`Service` là model cấu hình trung tâm của mỗi nghiệp vụ.

Nhiệm vụ trong core engine:

- Xác định service đang chạy bằng `code`, ví dụ `P2P_TRANSFER`, `CASH_IN`, `BILL_PAYMENT`.
- Cung cấp `fieldBuilder` để dựng `TRANSBODY`.
- Cung cấp `actions` để biết bước nào cần gọi provider.
- Cung cấp `fee` để engine tính phí.
- Cung cấp `auth.method` để confirm/verify biết cần PIN hay không.
- Liên kết đến `TransField`, `TransValidation`, `TransDefinition`.

`Service` giúp thêm nghiệp vụ mới bằng dữ liệu cấu hình thay vì viết một luồng xử lý mới.

## 5.2 `TransField`

`TransField` mô tả các field bắt buộc và định dạng hợp lệ của `TRANSBODY`.

Nhiệm vụ:

- Kiểm tra field có tồn tại hay không.
- Kiểm tra kiểu dữ liệu, độ dài, regex, format.
- Chạy theo thứ tự `order`.
- Trả lỗi theo `errorCode` nếu field không hợp lệ.
- Xác định field cần bảo mật bằng `needSecured`.

Ví dụ field thường gặp:

- `SERVICEID`
- `SENDERID`
- `RECEIVERID`
- `AMOUNT`
- `RECEIVERPHONE`
- `PROVIDERCODE`
- `BILLCODE`

## 5.3 `TransValidation`

`TransValidation` mô tả các rule nghiệp vụ phải đúng trước khi giao dịch được preview hoặc execute.

Nhiệm vụ:

- Chạy các hàm validate theo `validateFunc`.
- Lấy dữ liệu từ `validateFields`.
- Chạy theo thứ tự `order`.
- Chặn giao dịch nếu rule nghiệp vụ không hợp lệ.

Ví dụ:

- `validateReceiverIsNotSender(SENDERID, RECEIVERID)`.
- `validateSenderAccountSufficiency(SENDERID, AMOUNT, DEBITFEE)`.

Khác với `TransField`, `TransValidation` không chỉ kiểm tra format mà kiểm tra logic nghiệp vụ.

## 5.4 `TransDefinition`

`TransDefinition` định nghĩa cách tiền di chuyển giữa các ví.

Nhiệm vụ:

- Cung cấp `glSteps` cho executor.
- Mỗi `glStep` có `order`, `amount`, `debit`, `credit`.
- Cho phép engine chạy nhiều bút toán trong một giao dịch.

Ví dụ P2P transfer:

| Step | Amount     | Debit      | Credit          |
| ---- | ---------- | ---------- | --------------- |
| 1    | `AMOUNT`   | `SENDERID` | `RECEIVERID`    |
| 2    | `DEBITFEE` | `SENDERID` | `SYSTEM_POCKET` |

Ví dụ cash-in:

| Step | Amount   | Debit         | Credit       |
| ---- | -------- | ------------- | ------------ |
| 1    | `AMOUNT` | `BANK_POCKET` | `RECEIVERID` |

---

## 6. Nhóm provider/action

## 6.1 `Provider`

`Provider` lưu cấu hình đối tác ngoài như biller, telco, bank hoặc voucher provider.

Nhiệm vụ trong runtime:

- Được engine tìm bằng `PROVIDERCODE` hoặc provider code cố định từ `Service.actions.provider`.
- Cung cấp URL gọi ngoài:
  - `requestUrl` cho inquiry.
  - `confirmUrl` cho confirm.
  - `verifyUrl` cho payment/verify.
- Cung cấp `pocketId` nếu provider có ví nhận tiền.
- Cho phép engine map response provider vào `TRANSBODY`.

Provider chỉ là cấu hình. Việc gọi HTTP và xử lý response do Runtime Process thực hiện theo `Service.actions`.

## 6.2 External / Mock Service

External service là hệ thống ngoài được gọi khi service có action enabled.

Vai trò:

- Ở request: trả dữ liệu inquiry, ví dụ thông tin hóa đơn và số tiền.
- Ở confirm: xác nhận bước trung gian nếu provider yêu cầu.
- Ở verify: thực hiện thanh toán hoặc xác nhận giao dịch với provider.

Nếu external action thất bại, engine phải cập nhật trail failed và không trả receipt thành công.

---

## 7. Nhóm runtime giao dịch

## 7.1 `TransactionTrail`

`TransactionTrail` là trạng thái tạm của giao dịch trong 3 bước request-confirm-verify.

Nhiệm vụ:

- Lưu request gốc trong `inputMessage`.
- Lưu dữ liệu runtime trong `outputMessage.TRANSBODY`.
- Lưu `serviceId`, `customerId` hoặc `officerId`.
- Lưu status:
  - `init`: vừa tạo.
  - `pending`: đã preview, chờ confirm/verify.
  - `done`: đã execute thành công.
  - `failed`: xử lý thất bại.
  - `cancelled`: bị hủy hoặc hết hạn.
- Lưu `expiredAt` để tránh confirm/verify giao dịch quá hạn.
- Lưu `errorCode` và `errorMessage` khi thất bại.

Trail là nguồn sự thật của phiên giao dịch trước khi ledger được commit.

## 7.2 `Transaction`

`Transaction` là biên lai cuối cùng sau khi verify thành công.

Nhiệm vụ:

- Lưu mã biên lai `code`.
- Liên kết đến `serviceId` và `transRefId`.
- Lưu sender, receiver, amount, fee, totalAmount, currency.
- Lưu status `done` hoặc `failed` nếu hệ thống chọn lưu cả receipt thất bại.

Khác với `TransactionTrail`, `Transaction` là bản ghi lịch sử giao dịch đã được chốt.

---

## 8. Nhóm ledger

## 8.1 `Pocket`

`Pocket` là ví tiền thực tế của customer, provider, bank hoặc system.

Nhiệm vụ trong core engine:

- Cung cấp số dư hiện tại.
- Bị debit hoặc credit khi executor chạy `glSteps`.
- Có status `active`, `locked`, `inactive`.
- Có thể được khóa tạm thời ở verify để tránh double spending.
- Dùng `checksum` để hỗ trợ chống sửa số dư thủ công.

Các ví quan trọng:

- Customer pocket: ví người dùng.
- Provider/Biller pocket: ví nhận tiền của đối tác.
- System pocket: ví nhận phí.
- Bank pocket: ví nguồn cho cash-in.

## 8.2 `PocketEntry`

`PocketEntry` là nhật ký từng bút toán debit-credit.

Nhiệm vụ:

- Ghi `transRefId` để truy vết về trail/transaction.
- Ghi `stepOrder` tương ứng với `TransDefinition.glSteps`.
- Ghi `debitPocketId`, `creditPocketId`, `amount`, `currency`.
- Là bằng chứng ledger chi tiết cho mỗi lần tiền di chuyển.

Một giao dịch có thể tạo nhiều `PocketEntry`, ví dụ chuyển tiền P2P tạo một entry cho amount và một entry cho fee.

## 8.3 `Currency`

`Currency` định nghĩa loại tiền và đơn vị nhỏ nhất.

Nhiệm vụ:

- Xác định currency của pocket, pocket entry và transaction.
- Quy định `minorUnit`, ví dụ VND thường không có phần thập phân.

---

## 9. `MongoTransactionExecutor`

`MongoTransactionExecutor` là thành phần ghi dữ liệu tài chính trong MongoDB transaction.

Nhiệm vụ:

- Mở `session.withTransaction()`.
- Đọc `glSteps` từ `TransDefinition`.
- Với từng step:
  - Xác định amount từ `TRANSBODY`.
  - Xác định ví debit.
  - Xác định ví credit.
  - Trừ số dư ví debit.
  - Cộng số dư ví credit.
  - Tạo `PocketEntry`.
- Tạo `Transaction` receipt.
- Cập nhật `TransactionTrail` thành `done` hoặc `failed`.
- Commit nếu tất cả thành công.
- Rollback nếu có lỗi.

Executor là ranh giới atomicity của ledger. Các thay đổi số dư, entry, receipt và trail status phải nhất quán với nhau.

---

## 10. Dữ liệu trung tâm: `TRANSBODY`

`TRANSBODY` là payload nghiệp vụ chuẩn mà engine dùng xuyên suốt request-confirm-verify.

Nguồn tạo:

- Được dựng từ `Service.fieldBuilder`.
- Có thể được bổ sung bởi provider response.
- Được lưu trong `TransactionTrail.outputMessage`.

Field thường gặp:

| Field          | Ý nghĩa                      |
| -------------- | ---------------------------- |
| `TRANSREFID`   | Id của `TransactionTrail`    |
| `SERVICEID`    | Service đang chạy            |
| `USERID`       | Customer thực hiện giao dịch |
| `OFFICERID`    | Officer trigger giao dịch    |
| `SENDERID`     | Ví bị trừ tiền               |
| `RECEIVERID`   | Ví được cộng tiền            |
| `AMOUNT`       | Số tiền gốc                  |
| `DEBITFEE`     | Phí bị trừ từ sender         |
| `PROVIDERCODE` | Mã provider nếu có           |
| `BILLCODE`     | Mã hóa đơn nếu có            |

Engine nên luôn validate và tính lại các field tài chính quan trọng ở verify để tránh dùng dữ liệu preview đã bị stale hoặc bị sửa.

---

## 11. Nguyên tắc thiết kế Core Engine

- Controller và orchestrator không chứa nghiệp vụ ví.
- Runtime Process xử lý theo cấu hình, không hard-code từng service nếu không cần.
- `Service` là điểm mở rộng nghiệp vụ mới.
- `TransactionTrail` giữ state tạm và giúp idempotency.
- `TransField` kiểm tra dữ liệu đúng format.
- `TransValidation` kiểm tra nghiệp vụ đúng logic.
- `TransDefinition` quyết định dòng tiền.
- `MongoTransactionExecutor` là nơi duy nhất ghi ledger.
- Verify phải validate lại toàn bộ dữ liệu quan trọng trước khi trừ tiền.
- Mọi thay đổi số dư phải đi kèm `PocketEntry`.
- Giao dịch đã `done` không được execute lại.
- Ví gửi cần được lock trong lúc verify để tránh xử lý trùng hoặc double spending.

---

## 12. Tóm tắt theo một giao dịch ví

1. API nhận request và chuyển cho `Transaction.js`.
2. `Transaction.js` chuẩn hóa input và gắn `TRANSTEP`.
3. `NeonMessage.js` route vào Runtime Process và chuẩn bị trail.
4. Runtime Process đọc `Service`, dựng `TRANSBODY`, validate field, gọi provider nếu cần.
5. Runtime Process tính phí, validate nghiệp vụ và lưu trail pending.
6. Confirm đọc lại trail và trả phương thức auth.
7. Verify khóa ví, verify PIN nếu cần, validate lại và load `glSteps`.
8. `MongoTransactionExecutor` chạy debit-credit, tạo `PocketEntry`, tạo `Transaction`.
9. Runtime Process cập nhật trail done, release pocket và trả receipt.

Với cách này, Mini Wallet có thể mở rộng thêm nghiệp vụ mới chủ yếu bằng cách thêm cấu hình `Service`, `TransField`, `TransValidation`, `TransDefinition` và `Provider` tương ứng.
