-- Bảng 1: Lưu trữ thông tin các phiên học
CREATE TABLE public.class_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  class_code VARCHAR(10) UNIQUE NOT NULL,
  is_quiz_locked BOOLEAN DEFAULT FALSE NOT NULL,
  quiz_stats JSONB DEFAULT '{"A": 0, "B": 0, "C": 0, "D": 0, "total": 0}' NOT NULL
);
COMMENT ON TABLE public.class_sessions IS 'Mỗi hàng đại diện cho một buổi học được giáo viên khởi tạo.';

-- Bảng 2: Lưu trữ danh sách học sinh cho mỗi phiên
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  student_code VARCHAR(20),
  score INTEGER DEFAULT 0 NOT NULL,
  class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Danh sách sinh viên được nhập vào cho mỗi phiên.';

-- Bảng 3: Lưu trữ các câu trả lời trong một phiên quiz
CREATE TABLE public.answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  UNIQUE(class_session_id, student_id) -- Giả định mỗi học sinh chỉ trả lời 1 lần mỗi câu hỏi
);
COMMENT ON TABLE public.answers IS 'Bảng tạm thời chứa các phiếu bầu cho mỗi câu hỏi quiz.';