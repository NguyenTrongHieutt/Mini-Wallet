# Plan 07 — Định khoản, kiểm tra và xuất bản

## Phân công và phụ thuộc

Giao cho **một subagent duy nhất: Agent 07**, thực hiện cuối sau 02–06. Bắt buộc nạp `$react-frontend-coder`; thiếu skill thì dừng/báo blocker, fallback chỉ khi được duyệt.

## Quyền sở hữu

- Route: `/services/:serviceId/config/ledger`, `/services/:serviceId/config/review`.
- File: `src/features/services/ledger/*`, `src/features/services/review/*`, E2E cấu hình Service. Có quyền tích hợp trạng thái hoàn thành stepper nhưng không sửa form của agent khác.

## Endpoint và payload

- `POST /api/v1/officer/services/trans-definition/detail`: `{ serviceId }`; 404 `TRANS_DEFINITION_NOT_FOUND` được hiểu là chưa cấu hình.
- `POST /api/v1/officer/services/trans-definition/update`: `{ serviceId, glSteps, status:'active'|'inactive' }`; upsert một definition/service.
- `POST /api/v1/officer/services/publish`: `{ serviceId }`.
- `POST /api/v1/officer/services/unpublish`: `{ serviceId }`.
- Đọc `POST /api/v1/officer/pockets/list` `{ page:1,pageSize:100,status:'active' }` cho target ví cố định và đọc các endpoint list/detail config qua query contract đã có.
- `glSteps[]`: `{ order:integer>=1 unique, amount:'FIELD_NAME', debit:{level:'productLevel'|'wallet',target}, credit:{...} }`; productLevel target là biến uppercase, wallet target là pocket ID.

## UX và hành vi

- Ledger builder theo từng dòng “Số tiền / Trừ từ / Cộng vào”; chọn ví động từ catalog biến hoặc ví cố định từ Pocket list. Có reorder, duplicate, visual flow và JSON advanced bảo toàn unknown keys.
- Review tổng hợp từng bước với trạng thái Đạt/Cần bổ sung và deep-link: fieldBuilder không rỗng; có TransField active và mỗi field đã build; validation active hợp lệ; TransDefinition active có glSteps; amount/target động tồn tại. Built-in: `TRANSREFID,SERVICEID,SERVICECODE,USERTYPE,USERID,OFFICERID,USERROLE`; amount thêm `DEBITFEE,TOTALAMOUNT`.
- Publish dùng backend làm quyết định cuối; map lỗi publish sang bước/field gần gũi. Active khóa toàn workspace; unpublish có confirm nêu rõ Service sẽ inactive và cho sửa lại.

## Edge cases và test

- Definition 404, order trùng, amount/target unknown, pocket missing/inactive, debit=credit, concurrent publish/unpublish, publish `changed:false`, active read-only.
- Unit test readiness mirror, adapter JSON; integration save/review/error linking/publish/unpublish; Playwright: login → tạo Provider → tạo Service → builder → field/validation → actions → ledger → publish → unpublish.

## Hoàn thành và ranh giới

Hoàn thành khi ledger, review, publish/unpublish và E2E đạt; lint/typecheck/test/build xanh. Client readiness chỉ hướng dẫn, không thay thế response backend; không tạo endpoint readiness, không sửa config module khác.

