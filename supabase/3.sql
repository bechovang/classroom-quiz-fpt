-- Xóa publication cũ nếu tồn tại để đảm bảo lệnh chạy được nhiều lần
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Tạo một publication mới tên là supabase_realtime
-- và ra lệnh cho nó THEO DÕI TẤT CẢ CÁC BẢNG (FOR ALL TABLES)
-- trong schema public của bạn.
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;