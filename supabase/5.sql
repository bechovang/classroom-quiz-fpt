-- Xóa bảng cũ (nếu tồn tại)
DROP TABLE IF EXISTS public.quiz_bank CASCADE;

-- Tạo lại bảng với các cột điểm cộng/trừ
CREATE TABLE public.quiz_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Nội dung chính của câu hỏi
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  
  -- Thông tin bổ sung
  explanation TEXT,
  tags TEXT[],
  
  -- Điểm số
  points_correct INTEGER DEFAULT 1 NOT NULL CHECK (points_correct >= 0),
  points_incorrect INTEGER DEFAULT 1 NOT NULL CHECK (points_incorrect >= 0)
);

-- Thêm các comment (chú thích) cho bảng và các cột
COMMENT ON TABLE public.quiz_bank IS 'Một thư viện các câu hỏi trắc nghiệm có thể tái sử dụng.';
COMMENT ON COLUMN public.quiz_bank.options IS 'Lưu các lựa chọn A, B, C, D. Ví dụ: {"A": "Hà Nội", "B": "TP.HCM"}';
COMMENT ON COLUMN public.quiz_bank.tags IS 'Giúp phân loại và tìm kiếm câu hỏi dễ dàng hơn.';
COMMENT ON COLUMN public.quiz_bank.points_correct IS 'Số điểm được cộng khi trả lời đúng (mặc định: 1).';
COMMENT ON COLUMN public.quiz_bank.points_incorrect IS 'Số điểm bị trừ khi trả lời sai (mặc định: 1).';