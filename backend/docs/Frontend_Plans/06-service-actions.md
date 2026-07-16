# Plan 06 — Service Actions

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 06**, sau Agent 03 và contract Provider của Agent 05. Phải nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, fallback chỉ khi được duyệt.

## Quyền sở hữu

- Route: `/services/:serviceId/config/actions`.
- File: `src/features/services/actions/*`; đọc Service query (Agent 02), variable catalog (03), Provider query/type (05).

## Endpoint và cấu hình

- Đọc `POST /api/v1/officer/services/detail` `{ serviceId }` để lấy `service.actions`.
- Đọc `POST /api/v1/officer/providers/list` với `{ serviceCode, status:'active', page:1, pageSize:100 }` khi chọn Provider cố định; không cho chọn khác service.
- Ghi `POST /api/v1/officer/services/actions/update`: ưu tiên partial `{ serviceId, actionName:'provider'|'request'|'confirm'|'verify', action:{...} }`; khi advanced toàn bộ dùng `{ serviceId, actions }`. Không gửi `preview` vì service chỉ chấp nhận bốn tên trên.
- Resolver Provider: `{ codeSource:'FIXED', codeValue }` hoặc `{ codeSource:'TRANSBODY', codeField }`.
- Mỗi phase `request|confirm|verify`: `{ enabled, urlField?, method?, timeoutMs?, requestMap?, responseMap?, successRule?, errorCode? }`; mặc định urlField tương ứng `requestUrl|confirmUrl|verifyUrl`, method `POST`, timeout 10 giây. `requestMap` là `{requestKey: transBodyPath}`, `responseMap` là `{TRANSBODY_FIELD: responsePath}`, `successRule` là `{field, equals? | notEquals? | in?}`. Unknown keys phải được giữ.

## UX và hành vi

- Đầu màn chọn “Một Provider cố định” hoặc “Lấy Provider từ dữ liệu giao dịch”; fixed dùng dropdown Provider active cùng `serviceCode`, runtime dùng variable picker.
- Ba card phase bật/tắt độc lập. Mapping builder diễn đạt “Gửi trường nào / lấy từ biến nào”, response mapping “Lưu kết quả vào biến nào”, success rule bằng `field` + một phép so sánh `equals/notEquals/in`; vẫn cho nhập JSON nâng cao theo card.
- Link “Quản lý Provider” sang `/providers?serviceCode=...`, mặc định cùng tab và có affordance mở tab mới. Tuyệt đối không modal tạo/sửa Provider.
- Active Service chỉ đọc; save từng card không ghi đè phase khác, update cache sau thành công.

## Edge cases và test

- Không có Provider phù hợp; Provider bị deactivate sau khi chọn; codeField không tồn tại; phase enabled thiếu URL thực tế; timeout/method sai; JSON lỗi; unknown key round-trip; partial update giữ phase khác.
- Test filtering đúng `serviceCode`, không render CRUD Provider, adapter form↔JSON, save partial/full, read-only active.

## Hoàn thành và ranh giới

Hoàn thành khi resolver và ba phase cấu hình được bằng visual/JSON, test/build đạt. Không gọi endpoint CRUD/status Provider, không hỗ trợ `preview`, không sửa Provider URL từ màn này.
