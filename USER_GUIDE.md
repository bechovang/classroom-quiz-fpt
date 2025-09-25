# ClassroomPro – Hướng dẫn sử dụng nhanh (cho giáo viên)

> Disable spell check: `teh`

## Nỗi đau hiện tại (Painpoints)
- Cộng điểm cho nhiều học sinh thủ công thì lâu, dễ sai; học sinh có thể thiếu trung thực
- Khi thao tác từ xa thì khó, phải ngồi ngay máy tính để làm

---

## Lời chào
Em chào thầy, trong video này (và tài liệu này) em sẽ trình bày về web ClassroomPro – công cụ hỗ trợ thầy quản lý lớp, quay ngẫu nhiên, làm trắc nghiệm và chấm điểm theo thời gian thực.

---

## Danh sách lớp
- **Danh sách lớp (sidebar)**: hiển thị rõ Tên, MSSV, Điểm, trạng thái “Đã gọi” (nếu đã được quay). Học sinh đang được gọi được làm nổi bật (viền amber, ping nhẹ).
- **Xóa học sinh**: bấm biểu tượng thùng rác ở dòng học sinh.
- **Xóa lớp**: bấm thùng rác ở dòng lớp học.
- **Thêm học sinh**:
  - Thêm thủ công: bấm “Thêm SV”.
  - Import Excel/CSV/TSV: bấm “Import”.
- **Edit (cập nhật)**:
  - Sửa tên, MSSV: bấm nút sửa ở dòng học sinh.
  - Chỉnh điểm: dùng mục “Edit Score” (chỉnh thủ công theo học sinh) hoặc để hệ thống tự chấm khi làm quiz.
- **Export**:
  - Tải xuống TSV: không có dòng header; mỗi dòng “Tên<TAB>MSSV<TAB>Điểm”.
  - Sao chép vào Clipboard (TSV) cùng định dạng trên.
  - “Copy cột điểm”: chỉ copy duy nhất cột điểm, 1 dòng/điểm, đúng thứ tự hiện tại.

---

## Edit Points (điểm từng câu, wrong points)
- Mở “Edit Points” để nhập nhanh điểm của từng câu (`questionPoints`) và điểm trừ khi sai (`wrongPoints`).
- Gợi ý:
  - `questionPoints[i]`: điểm cộng cho câu i (mặc định 10 nếu không cấu hình).
  - `wrongPoints[i]`: điểm áp dụng cho người chọn sai ở câu i (nhập số âm để trừ; số 0 là không trừ).
- Import/Export dạng từng dòng: `positive, wrong` (ngăn cách bởi dấu phẩy/khoảng trắng/tab), ví dụ:
```
1, 0
2, -1
3, 0
4, -2
5, 0
```

---

## Quy trình “Chọn ngẫu nhiên” và làm quiz
1) Nhấn “Chọn ngẫu nhiên”
   - Hệ thống quay animation rồi chọn ngẫu nhiên 1 học sinh **chưa được gọi**.
   - Học sinh được gọi sẽ được đánh dấu rõ ràng trong danh sách lớp.
2) Nếu học sinh trả lời **đúng**:
   - Với câu đang mở và đã chốt đáp án, học sinh chọn đúng được cộng `questionPoints` của câu hiện tại.
3) Nếu học sinh trả lời **sai**:
   - Nhấn “Wrong” để nhường lượt cho cả lớp: học sinh vừa bị gọi bị chặn trả lời trong lượt này; lớp được mở để tất cả tham gia.
   - Màn hình giáo viên hiển thị realtime số lượng A/B/C/D.
   - Học sinh bị gọi sai không được trả lời nữa trong lượt đó.
4) Màn hình học sinh
   - Học sinh vào `Student Portal`, chọn tên rồi chọn A/B/C/D.
   - Nếu lỡ chọn và muốn bỏ, bấm “Xóa câu trả lời”.
5) Khóa/mở quiz và chốt đáp án
   - Nhấn “Khóa ngay” (Lock) để dừng nhập.
   - Giáo viên chọn đáp án đúng, sau đó “Kết thúc câu hỏi” (End question):
     - Ai chọn đúng được cộng `questionPoints` của câu.
     - Ai chọn sai được áp dụng `wrongPoints` của câu.
     - Ai không chọn: không thay đổi điểm.
6) Reset nhanh
   - **Reset Answers**: xóa các câu trả lời của câu hiện tại.
   - **Reset Scores**: đưa điểm của toàn bộ học sinh trong lớp về 0.

Lưu ý hiển thị điểm:
- Teacher view: hiển thị “Câu hiện tại”, “Điểm câu hiện tại” và “Điểm trừ”.
- Student view: chỉ hiển thị “Câu hiện tại” để tập trung vào làm bài (không hiển thị điểm).

---

## Shortcut (phím tắt)
- R: Random pick (chọn ngẫu nhiên)
- C: Mark Correct (đánh dấu đúng)
- W: Mark Wrong (nhường cơ hội cho lớp)
- L: Lock/Unlock quiz (khóa/mở)
- E: End Question (chốt câu)
- A: Reset Answers (xóa câu trả lời)
- S: Reset Scores (đưa điểm về 0)

Mở nút “Shortcut” (bên cạnh Light/Dark) trong giao diện để xem các phím tắt ngay trong ứng dụng.

---

## Triển khai (Deploy)
- Nền tảng: **Vercel** (frontend) + **Supabase** (Postgres + Realtime) – dùng free tier.
- Realtime: hỗ trợ tốt cho nhiều thiết bị (thực tế lớp > 100 vẫn OK theo cấu hình hợp lý).
- Dữ liệu lưu ở DB nên an toàn hơn so với lưu cục bộ.
- Cấu hình `.env` (xem `.env.sample`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (tuỳ chọn) `NEXT_PUBLIC_TEACHER_USERNAME`, `NEXT_PUBLIC_TEACHER_PASSWORD`

---

## Điểm yếu & cải tiến đề xuất
- **Edit ở danh sách lớp**
  - Hiện sửa tên/MSSV; chỉnh điểm phải dùng “Edit Score”. Có thể bổ sung chỉnh điểm trực tiếp tại dòng học sinh.
- **Bảo mật phiên học sinh**
  - Hiện học sinh có thể vào trang học sinh và chọn bất kỳ tên nào.
  - Hướng cải tiến (cần thêm DB/Auth):
    - Tạo tài khoản/mật khẩu riêng cho học sinh (hỗ trợ làm bài ở nhà);
    - Tạo code theo buổi học, chỉ ai có code mới vào (không cấp code cho người ở nhà);
    - Cơ chế “single-login lock”: khi 1 tài khoản đã vào, khoá phiên đó không cho ai khác dùng lại cùng tài khoản.

---

## Lời kết
Dạ em cảm ơn thầy đã xem ạ. Nếu thầy thấy hệ thống hữu ích, mong thầy dùng thử và cho em nhận xét để em tiếp tục cải thiện. Em rất trân trọng các góp ý từ thầy ạ!
