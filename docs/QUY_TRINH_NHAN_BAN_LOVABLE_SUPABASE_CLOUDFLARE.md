# Quy Trình Nhân Bản Landing Page + Login + Dashboard Admin

Tài liệu này dùng để nhân bản một website theo luồng:

Lovable -> GitHub -> Cloudflare Workers/Pages -> Supabase -> Dashboard Admin.

Mục tiêu: tạo landing page, trang đăng nhập học viên, dashboard học viên, và khu vực admin có thể thêm bài giảng + cấp tài khoản học viên mà không lặp lại lỗi cấu hình.

## 1. Kiến Trúc Chuẩn

Một dự án ổn định cần có 4 phần:

1. Lovable
   - Dùng để tạo giao diện ban đầu: landing page, login, dashboard.
   - Sau khi ổn, đẩy source code lên GitHub.

2. GitHub
   - Là nơi lưu source code chính.
   - Cloudflare lấy source từ repo này để deploy.

3. Cloudflare
   - Chạy bản production.
   - Cần khai báo đúng biến môi trường Supabase.

4. Supabase
   - Quản lý Authentication.
   - Lưu bảng `profiles`, `user_roles`, `courses`, `lessons`.
   - Cấp quyền admin bằng `service_role key` ở server.

## 2. Biến Môi Trường Bắt Buộc

Trong Cloudflare, dự án bắt buộc cần các biến sau:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Ý nghĩa:

- `SUPABASE_URL`: URL của Supabase project, ví dụ `https://xxxx.supabase.co`.
- `SUPABASE_PUBLISHABLE_KEY`: anon/publishable key, dùng cho client đăng nhập và đọc dữ liệu theo RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: key quyền cao, chỉ dùng ở server để tạo học viên, thêm/sửa/xóa bài giảng, cấp role.

Lưu ý cực quan trọng:

- Không đưa `SUPABASE_SERVICE_ROLE_KEY` vào frontend.
- Không commit `SUPABASE_SERVICE_ROLE_KEY` lên GitHub.
- Nên thêm `SUPABASE_SERVICE_ROLE_KEY` trong Cloudflare bằng Secret/Environment Variable.
- Ba key phải thuộc cùng một Supabase project. Nếu `SUPABASE_URL` thuộc project A mà key thuộc project B thì admin sẽ lỗi.

## 3. Checklist Tạo Dự Án Mới

### Bước 1: Tạo project Supabase

1. Tạo Supabase project mới.
2. Vào Project Settings -> API.
3. Lấy:
   - Project URL
   - anon/publishable key
   - service_role key
4. Ghi lại project ref trong URL/key để đối chiếu.

### Bước 2: Tạo database schema

Cần có các bảng tối thiểu:

- `profiles`
- `user_roles`
- `courses`
- `lessons`

Cần có role:

```text
admin
student
```

Cần có function/policy:

- `has_role(user_id, role)`
- RLS cho học viên chỉ đọc dữ liệu cần thiết.
- Server admin dùng service role để bypass RLS khi cần.

### Bước 3: Tạo landing page trên Lovable

1. Tạo landing page.
2. Tạo `/login`.
3. Tạo `/dashboard`.
4. Kết nối Supabase trong code.
5. Test đăng nhập trên Lovable preview.

### Bước 4: Đẩy code lên GitHub

1. Tạo repo GitHub mới.
2. Push source code.
3. Đảm bảo không push file chứa secret.
4. Kiểm tra repo có các file deploy cần thiết:
   - `package.json`
   - config build/deploy
   - source app
   - Supabase migrations nếu có

### Bước 5: Kết nối Cloudflare với GitHub

1. Tạo Worker/Pages project trên Cloudflare.
2. Kết nối repo GitHub.
3. Chọn branch production.
4. Khai báo biến môi trường:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

5. Deploy.

### Bước 6: Tạo tài khoản admin

Có 2 cách:

1. Tạo user trong Supabase Auth, sau đó insert role `admin` vào bảng `user_roles`.
2. Tạo route tạm thời `/create-admin`, chạy xong thì xóa route này khỏi production.

Khuyến nghị:

- Chỉ dùng `/create-admin` trong lúc setup.
- Sau khi admin đã tạo xong, xóa route này để tránh rủi ro bảo mật.

### Bước 7: Test dashboard admin

Đăng nhập bằng tài khoản admin và test theo thứ tự:

1. Vào `/dashboard`.
2. Kiểm tra có badge ADMIN.
3. Thêm 1 bài giảng test.
4. Sửa bài giảng test.
5. Xóa bài giảng test.
6. Cấp 1 tài khoản học viên test.
7. Đăng xuất admin.
8. Đăng nhập bằng học viên test.
9. Kiểm tra học viên xem được bài học nhưng không thấy khu admin.

## 4. Lỗi Hay Gặp Và Cách Bắt Bệnh

### Lỗi: Không thêm được học viên

Nguyên nhân thường gặp:

- Thiếu `SUPABASE_SERVICE_ROLE_KEY` trên Cloudflare.
- `SUPABASE_SERVICE_ROLE_KEY` sai project.
- Tài khoản đang đăng nhập chưa có role `admin`.
- Bảng `user_roles` chưa có dòng role admin cho user hiện tại.

Cách kiểm tra:

1. Vào Cloudflare -> Worker/Pages -> Settings -> Variables.
2. Kiểm tra đủ 3 biến Supabase.
3. Vào Supabase -> Authentication -> Users, lấy UID admin.
4. Vào Table Editor -> `user_roles`, kiểm tra UID đó có role `admin`.

### Lỗi: Không thêm/sửa/xóa được bài giảng

Nguyên nhân thường gặp:

- Thiếu service role key.
- Server function không đọc được env.
- Course ID không tồn tại.
- User đang đăng nhập không phải admin.

Cách kiểm tra:

1. Kiểm tra Cloudflare variables.
2. Kiểm tra bảng `courses` có ít nhất 1 khóa học.
3. Kiểm tra bảng `lessons` có cột:
   - `id`
   - `course_id`
   - `title`
   - `description`
   - `video_url`
   - `order_index`
   - `created_at`

### Lỗi: Đăng nhập được nhưng dashboard lỗi

Nguyên nhân thường gặp:

- Client dùng `SUPABASE_PUBLISHABLE_KEY` sai project.
- RLS policy thiếu quyền select cho authenticated.
- User chưa có profile.

Cách kiểm tra:

1. Đối chiếu project ref của URL và anon key.
2. Kiểm tra `profiles` có row của user đang đăng nhập.
3. Kiểm tra RLS policy cho `courses` và `lessons`.

### Lỗi: Lovable chạy được nhưng Cloudflare lỗi

Nguyên nhân thường gặp:

- Lovable có env riêng, Cloudflare chưa có env.
- Cloudflare deploy code cũ.
- Biến môi trường đặt sai tên.

Cách kiểm tra:

1. Tên biến phải đúng 100%:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

2. Redeploy sau khi thêm biến.
3. Kiểm tra deployment mới nhất đang active.

## 5. Chuẩn Bảo Mật

Những việc nên làm:

- Xóa route tạo admin tạm thời sau khi setup.
- Không hiện service role key trên client.
- Không commit `.env` chứa secret.
- Chỉ user có role `admin` mới thấy khu quản lý.
- Mọi thao tác admin phải verify role trên server, không chỉ ẩn UI trên frontend.

Những việc tránh làm:

- Không gán service role key vào `VITE_...`.
- Không đặt service role key trong code.
- Không tin vào nút ẩn/hiện trên frontend để bảo vệ dữ liệu.

## 6. Mẫu Kiểm Tra Trước Khi Bàn Giao

Trước khi coi dự án là xong, tick hết checklist này:

```text
[ ] Landing page mở được
[ ] /login mở được
[ ] Đăng nhập admin được
[ ] Dashboard hiện badge ADMIN
[ ] Thêm bài giảng thành công
[ ] Sửa bài giảng thành công
[ ] Xóa bài giảng thành công
[ ] Cấp học viên thành công
[ ] Học viên mới đăng nhập được
[ ] Học viên không thấy khu admin
[ ] Cloudflare có SUPABASE_URL
[ ] Cloudflare có SUPABASE_PUBLISHABLE_KEY
[ ] Cloudflare có SUPABASE_SERVICE_ROLE_KEY
[ ] 3 biến Supabase thuộc cùng 1 project
[ ] Route tạo admin tạm thời đã được xóa hoặc khóa
```

## 7. Quy Trình Nhân Bản Nhanh Cho Dự Án Kế Tiếp

Khi làm website mới, đi theo thứ tự này:

1. Clone repo mẫu.
2. Tạo Supabase project mới.
3. Chạy migration tạo schema.
4. Cập nhật env local/Lovable/Cloudflare bằng key của project mới.
5. Tạo admin đầu tiên.
6. Test dashboard admin trên Lovable.
7. Push GitHub.
8. Deploy Cloudflare.
9. Test lại trên domain production.
10. Xóa route setup tạm thời.

Nếu có lỗi, không sửa lung tung. Bắt đầu từ 4 câu hỏi:

1. App đang chạy trên môi trường nào: Lovable hay Cloudflare?
2. Môi trường đó đã có đủ 3 biến Supabase chưa?
3. 3 biến đó có cùng project ref không?
4. User đang đăng nhập có role `admin` trong `user_roles` không?

