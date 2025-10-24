-- Bảng duy nhất để lưu trữ ngân hàng câu hỏi (ĐÃ SỬA LỖI)
CREATE TABLE public.quiz_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Nội dung chính của câu hỏi
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  
  -- Thông tin bổ sung
  explanation TEXT,
  tags TEXT[] -- << DẤU PHẨY THỪA ĐÃ ĐƯỢC XÓA Ở ĐÂY
);

-- Thêm các comment (chú thích) cho bảng và các cột
COMMENT ON TABLE public.quiz_bank IS 'Một thư viện các câu hỏi trắc nghiệm có thể tái sử dụng.';
COMMENT ON COLUMN public.quiz_bank.options IS 'Lưu các lựa chọn A, B, C, D. Ví dụ: {"A": "Hà Nội", "B": "TP.HCM"}';
COMMENT ON COLUMN public.quiz_bank.tags IS 'Giúp phân loại và tìm kiếm câu hỏi dễ dàng hơn.';