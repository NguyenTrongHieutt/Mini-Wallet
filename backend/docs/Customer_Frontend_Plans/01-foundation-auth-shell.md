# Agent 01 — Customer Auth, Session và Shell

## Phân công

Giao toàn bộ kế hoạch này cho **đúng một subagent: Agent 01**. `$react-frontend-coder` chưa tìm thấy nguồn phù hợp trong phiên hiện tại, nên Agent 01 dùng conventions React/TypeScript và dependency sẵn có trong repo; nếu skill được cài về sau thì phải nạp trước khi tiếp tục.

Agent 01 sở hữu customer API client nền tảng, query keys, auth context, protected route, login/register và customer shell. Không thay đổi backend.

## Mục tiêu

Tạo nhánh `/customer/*` độc lập về auth lifecycle với Officer Portal, dùng cookie HttpOnly và `/api/v1/customer/me` làm session probe duy nhất.

## Thay đổi chính

- Tách Officer `AuthProvider` khỏi root nếu hiện tại provider khiến customer route gọi `/api/v1/officer/me`; chỉ bọc nhánh officer.
- Thêm `CustomerAuthProvider` và query `["customer-portal", "me"]`.
- API client luôn dùng `credentials: "include"`, parse envelope và ném business error khi `err !== 200`.
- Không lưu access token, customer profile hoặc trạng thái đăng nhập giả trong localStorage/sessionStorage.
- Khi reload protected route:
  - `/me` thành công: render customer app.
  - `401/403`: xóa customer cache và chuyển tới `/customer/login`, giữ return URL nội bộ an toàn.
  - Lỗi mạng/server tạm thời: hiện retry state, không kết luận phiên đã hết hạn.
- Login/register thành công cập nhật cache `me`; register seed cache wallet từ pocket response nếu backend thực tế trả pocket.
- Logout gọi `/api/v1/customer/auth/logout`, sau đó luôn xóa toàn bộ query có prefix `["customer-portal"]`, kể cả request logout thất bại.

## Màn hình và route

- `/customer/login`: phone, password, submit rõ ràng, link đăng ký.
- `/customer/register`: phone, password, xác nhận password, PIN sáu số, displayName, currency mặc định `VND`.
- Protected shell gồm navigation:
  - Dịch vụ
  - Lịch sử
  - Cá nhân
- Route protected phải chờ session probe kết thúc, tránh flash nội dung hoặc redirect sớm.
- Sau login/register, chuyển đến return URL hợp lệ hoặc `/customer/services`.
- Giữ nguyên route, provider và behavior Officer Portal.

## Validation và UX

- Dùng validation library/form stack có sẵn trong frontend; không thêm framework trùng chức năng.
- Password confirmation phải khớp; PIN đúng sáu chữ số; các rule phone/password bám OpenAPI/backend.
- Disable submit khi đang gửi để chống double-submit.
- Hiển thị business message có thể hành động; không hiển thị raw stack/response.
- UI tiếng Việt, responsive, có loading và retry cho session probe.

## Kiểm thử và nghiệm thu

- `/me` khôi phục phiên sau reload mà không cần localStorage.
- Customer route không phát request `/api/v1/officer/me`.
- Officer route và login officer không bị regression.
- `401/403` redirect đúng; lỗi mạng hiện retry và không xóa phiên một cách giả định.
- Login/register cập nhật cache và redirect đúng.
- Logout thành công hoặc thất bại đều xóa customer cache/local auth state.
- Xác nhận browser storage không chứa token hoặc customer profile.

