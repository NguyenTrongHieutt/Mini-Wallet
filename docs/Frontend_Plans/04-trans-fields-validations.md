# Plan 04 — Trường nhập và kiểm tra nghiệp vụ

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 04**, sau Agent 03. Phải nạp `$react-frontend-coder`; không có skill thì dừng/báo blocker, chỉ fallback khi được duyệt.

## Quyền sở hữu

- Route: `/services/:serviceId/config/trans-fields`, `/services/:serviceId/config/validations`.
- File: `src/features/services/trans-fields/*`, `src/features/services/validations/*`; dùng catalog biến Agent 03.

## Endpoint và payload

- `POST /api/v1/officer/services/trans-fields/list`: `{ serviceId, status?:'active'|'inactive' }`.
- `POST /api/v1/officer/services/trans-fields/insert`: `{ serviceId, fieldName, fieldFormat, minLength?, maxLength?, regex?, isRequired, needSecured, order, errorCode?, status }`.
- `POST /api/v1/officer/services/trans-fields/update`: như insert nhưng thêm `transFieldId`; chỉ gửi field thay đổi.
- `POST /api/v1/officer/services/trans-validations/list`: `{ serviceId, status?:'active'|'inactive' }`.
- `POST /api/v1/officer/services/trans-validations/insert`: `{ serviceId, validateFunc, validateFields, order, errorCode?, status }`.
- `POST /api/v1/officer/services/trans-validations/update`: như insert nhưng thêm `transValidationId`; chỉ gửi field thay đổi.

`fieldFormat`: `string|number|boolean|object|phone|text|integer|int|float|decimal|bool|array|json`; order nguyên dương; min/max không âm; regex hợp lệ. Validator canonical: `validateReceiverIsNotSender`, `validateSenderAccountSufficiency`, `validateRole` (UI có thể đọc alias cũ nhưng luôn ghi canonical). `validateFields` là chuỗi hoặc JSON object string.

## UX và hành vi

- Hai màn list + drawer insert/update, filter trạng thái, reorder, bật/tắt bằng `status`; không có delete.
- TransField chọn biến từ field builder nhưng vẫn cho nhập tay; template “Số điện thoại / Số tiền / Văn bản / JSON”, regex có tester, secured giải thích che dữ liệu log.
- Validation trình bày 3 lựa chọn: người nhận khác người gửi, đủ số dư, đúng vai trò. Field picker sinh chuỗi canonical; role builder sinh JSON rồi stringify. Có chế độ advanced nhập `validateFields` trực tiếp.
- Active Service khóa mutation. Cảnh báo TransField active không tồn tại trong field builder vì publish sẽ từ chối.

## Edge cases và test

- Duplicate field; duplicate `(validateFunc,validateFields)`; order trùng; min > max; regex sai; config JSON sai; inactive item; alias đọc cũ; server conflict và lỗi theo item.
- Test schema, canonical mapping, insert/update partial payload, filter, cache invalidation, read-only active và accessibility drawer.

## Hoàn thành và ranh giới

Hoàn thành khi list/insert/update/status của cả hai loại config hoạt động và test/build đạt. Không sửa field builder, Service Actions, Provider hay publish readiness.

