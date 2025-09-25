# ClassroomPro – Hướng dẫn sử dụng hoàn chỉnh (cho giáo viên)


---


## Danh sách lớp
**Giao diện danh sách lớp (sidebar):** 
- Hiển thị rõ ràng mọi thông tin: Tên, MSSV, Điểm, trạng thái "Đã gọi" (nếu đã được quay)
- Học sinh đang được gọi được làm nổi bật (viền amber, ping nhẹ)

**Quản lý học sinh:**
- **Xóa học sinh**: bấm biểu tượng thùng rác ở dòng học sinh
- **Xóa lớp**: bấm thùng rác ở dòng lớp học

**Thêm học sinh:**
- **Thêm thủ công**: bấm "Thêm SV"
- **Import Excel/CSV/TSV**: bấm "Import" - thầy cô có thể thêm nhanh hoặc nhập file excel 
- ví dụ
```
Nguyễn Kim Anh	21120001
Trần Minh Tuấn	21120015
Lê Thị Thu Thảo	21120023
Phạm Đức Huy	21120038
Võ Ngọc Lan Anh	21120042
Đặng Quang Vinh	21120059
Hoàng Bảo Châu	21120067
Bùi Thế Hiển	21120074
Ngô Phương Linh	21120081
Đào Duy Hải	21120096

```


**Edit (cập nhật):**
- **Sửa tên, MSSV**: bấm nút sửa ở dòng học sinh (hình cây bút chì) - tính năng này nhìn hơi cùi, chưa hoàn thiện
- **Chỉnh điểm**: không có edit điểm trực tiếp, phải dùng mục "Edit Score" (chỉnh thủ công theo học sinh) - chức năng này cũng cần cải thiện

**Export dữ liệu:**
- **Tải xuống TSV**: không có dòng header; mỗi dòng `Tên <TAB> MSSV <TAB> Điểm`
- **Sao chép vào Clipboard (TSV)** cùng định dạng trên
- **"Copy cột điểm"**: chỉ copy vào clipboard duy nhất cột điểm, 1 dòng/điểm, đúng thứ tự hiện tại, chỉ cần paste vào DS lớp là xong

---

## Edit Points (điểm từng câu, wrong points)
- Mở "Edit Points" để nhập nhanh điểm cộng và điểm trừ của từng câu
- Import/Export dạng từng dòng: `được cộng <tab> bị trừ` (ngăn cách bởi tab), ví dụ:
```
10    -10
10    -10
10    -10
10    -10
20    -10
20    -10
```

---

## Quy trình "Chọn ngẫu nhiên" và làm quiz

### 1) Chọn ngẫu nhiên
- Nhấn "Chọn ngẫu nhiên"
- Hệ thống quay animation rồi chọn ngẫu nhiên 1 học sinh **chưa được gọi**
- Học sinh được gọi sẽ được đánh dấu rõ ràng trong danh sách lớp để biết là đã được gọi
- Nếu muốn xóa trạng thái đã gọi thì ấn `reset`

### 2) Nếu học sinh trả lời **đúng**:
- Học sinh sẽ được cộng điểm

### 3) Nếu học sinh trả lời **sai**:
- Nhấn `Wrong` để nhường lượt cho cả lớp
- Học sinh vừa bị gọi sẽ bị chặn trả lời trong lượt này; lớp được mở để tất cả tham gia
- Màn hình giáo viên hiển thị realtime số lượng người chọn từng đáp án A/B/C/D

### 4) Màn hình học sinh (Student Portal)
- Học sinh vào Student Portal, tìm tên (có tìm theo tên hoặc mssv) và chọn đáp án A/B/C/D
- Nếu lỡ chọn đáp án và muốn xóa, bấm "Xóa câu trả lời"

### 5) Khóa/mở quiz và chốt đáp án
- Nhấn "Khóa ngay" (Lock) để dừng nhập câu trả lời
- Giáo viên chọn đáp án đúng, sau đó hệ thống sẽ tự cập nhật điểm:
  - Ai chọn đúng được cộng điểm
  - Ai chọn sai sẽ bị trừ điểm  
  - Ai không chọn: không thay đổi điểm

### 6) Reset nhanh
- **Reset Answers**: xóa các câu trả lời của câu hiện tại
- **Reset Scores**: đưa điểm của toàn bộ học sinh trong lớp về 0

---

## Shortcut (phím tắt)
Mở nút "Shortcut" (bên cạnh Light/Dark) trong giao diện để xem các phím tắt ngay trong ứng dụng:

- **R**: Random pick (chọn ngẫu nhiên)
- **C**: Mark Correct (đánh dấu đúng)
- **W**: Mark Wrong (nhường cơ hội cho lớp)
- **L**: Lock/Unlock quiz (khóa/mở)
- **E**: End Question (chốt câu)
- **A**: Reset Answers (xóa câu trả lời)
- **S**: Reset Scores (đưa điểm về 0)

*Workflow có thể dùng tay cầm/ bàn phím để thao tác nhanh hơn, vừa thao tác bên web để cho điểm cộng và thao tác bên word để hiện đề và show đáp án*

---

## Triển khai (Deploy)
**Nền tảng:** **Vercel** (frontend) + **Supabase** (Postgres + Realtime) 
- Sử dụng free tier - hoàn toàn miễn phí
- Supabase cung cấp realtime + backend
- Dữ liệu lưu ở DB nên an toàn hơn so với lưu cục bộ, khó bị mất
- Dễ deploy, ai cũng có thể tự host được
- Hỗ trợ realtime tốt cho nhiều thiết bị, tối đa 200 thiết bị cho bản free (thực tế lớp > 100 học sinh vẫn hoạt động OK theo cấu hình hợp lý)

---

## Những điểm yếu & đề xuất cải tiến

### 1. **Edit ở danh sách lớp** (cần cải thiện)
- Hiện chỉ sửa được tên/MSSV
- Chỉnh điểm phải dùng "Edit Score" riêng biệt

### 2. **Bảo mật phiên học sinh** (vấn đề lớn)
**Vấn đề hiện tại**: Học sinh có thể vào trang học sinh và chọn bất kỳ tên nào, có thể vào tài khoản của học sinh khác

**Các hướng cải tiến** (cần thêm DB/Auth):

#### Phương án 1: Tài khoản riêng
- Tạo tài khoản/mật khẩu riêng cho từng học sinh
- **Ưu điểm**: Học sinh ở nhà cũng có thể vào làm bài
- **Nhược điểm**: Phức tạp, cần quản lý nhiều tài khoản

#### Phương án 2: Code theo buổi học  
- Tạo code riêng để vào cho mỗi buổi học
- Chỉ ai có code mới vào được
- Không tạo code cho học sinh ở nhà (kiểm soát được ai tham gia)

#### Phương án 3: Single-login lock (khuyến nghị)
- Check xem học sinh đã vào chưa
- Khi 1 tài khoản đã vào, khóa phiên đó không cho ai khác dùng lại cùng tài khoản  
- **Ưu điểm**: Học sinh không cần nhập gì, giáo viên không phải tạo gì
- **Nhược điểm**: Khó, phức tạp, phải nghiên cứu thêm

---

## Nỗi đau hiện tại (Painpoints)
- Cộng điểm cho nhiều học sinh thủ công thì lâu, dễ sai; học sinh có thể thiếu trung thực
=> web này sẽ giải quyết được phần lớn
- Khi thao tác từ xa thì khó, phải ngồi ngay máy tính để làm
=> tính năng shortcut của web + tay cầm/ bàn phím bluetooth (KO QUẢNG CÁO) sẽ giải quyết được

---

## Lời kết
Dạ em cảm ơn thầy đã xem ạ. Nếu thầy thấy web này hay và có ích, em mong thầy dùng thử và cho em nhận xét để em tiếp tục cải thiện. Em rất trân trọng và mong nhận được các lời góp ý từ thầy ạ!