# Plan 03 — Trình dựng biến trực quan

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 03**, sau Agent 02. Bắt buộc nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, fallback chỉ khi được duyệt.

## Quyền sở hữu

- Route: `/services/:serviceId/config/field-builder`.
- File: `src/features/services/field-builder/*`, schema/adapter/test riêng. Đọc Service query/type của Agent 02, không tạo wrapper detail thứ hai.

## Endpoint và cấu hình

- Đọc `POST /api/v1/officer/services/detail` với `{ serviceId }` để lấy `service.fieldBuilder`.
- Ghi `POST /api/v1/officer/services/field-builder/update` với `{ serviceId, fieldBuilder }`; mảng bắt buộc không rỗng khi save.
- Mỗi item bắt buộc: `order` nguyên dương duy nhất, `name` uppercase duy nhất theo `[A-Z][A-Z0-9_]{0,99}`, `role`, `rule`, `source`, `datatype` thuộc `string|number|boolean|object`, `errorCode`.
- Rule: fixed = `{rule:'fixed',source:'constant',value}`; mapping = `{rule:'mapping',source:'body'|'user',variable}`; query = `{rule:'query',source:'database',query,params,output?}`. Chỉ gợi ý `Customer.getActiveCustomerByPhone` và `Pocket.getActivePocketByOwner`; param là string, `{source:'constant',value}` hoặc `{source:'field',name}`.

## UX và hành vi

- Dùng card có drag/reorder, tên hiển thị “Biến kết quả”, role có gợi ý nghiệp vụ, nguồn được mô tả “Giá trị cố định / Dữ liệu người nhập / Hồ sơ đăng nhập / Tra cứu hệ thống”.
- Form thay đổi theo rule; query helper có mô tả đầu vào/đầu ra, params dạng chip, output path tùy chọn. Cho nhập tự do role/path/error code.
- “Cấu hình nâng cao” JSON cho toàn mảng, parse + format + đồng bộ hai chiều và giữ unknown keys. Hiển thị diff trước khi JSON ghi đè form.
- Active Service chỉ đọc; save thành công cập nhật query `['service', id]` và cung cấp catalog biến cho Agent 04/06/07.

## Edge cases và test

- Trùng name/order, order hở, datatype/value không tương thích, query ngoài allowlist, param tham chiếu field chưa dựng, JSON sai, chuyển rule làm mất unknown key, server trả `{data:{index}}`.
- Unit test form↔JSON round-trip và preservation; integration test add/reorder/change rule/save/no-op/read-only.

## Hoàn thành và ranh giới

Hoàn thành khi tạo/sửa/reorder và JSON advanced cùng sinh payload backend hợp lệ, test/build đạt. Không tự tạo TransField, không thêm query helper ngoài allowlist, không sửa API Service cơ bản/actions/ledger.

