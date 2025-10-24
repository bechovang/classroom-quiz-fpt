-- Function: Tính toán lại thống kê quiz cho một phiên học
CREATE OR REPLACE FUNCTION public.update_quiz_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats jsonb;
    session_id_to_update UUID;
BEGIN
    -- Xác định session_id cần cập nhật
    -- Dùng COALESCE để xử lý cả trường hợp INSERT/UPDATE (NEW) và DELETE (OLD)
    session_id_to_update := COALESCE(NEW.class_session_id, OLD.class_session_id);

    -- Tính toán số lượng cho mỗi đáp án và tổng số
    SELECT jsonb_build_object(
        'A', count(*) FILTER (WHERE selected_answer = 'A'),
        'B', count(*) FILTER (WHERE selected_answer = 'B'),
        'C', count(*) FILTER (WHERE selected_answer = 'C'),
        'D', count(*) FILTER (WHERE selected_answer = 'D'),
        'total', count(*)
    )
    INTO stats
    FROM public.answers
    WHERE answers.class_session_id = session_id_to_update;

    -- Cập nhật cột quiz_stats trong bảng class_sessions
    UPDATE public.class_sessions
    SET quiz_stats = stats
    WHERE id = session_id_to_update;

    RETURN NEW;
END;
$$;

-- Trigger: Gắn "công tắc" tự động chạy function trên bảng "answers"
-- Xóa trigger cũ nếu tồn tại để tránh lỗi
DROP TRIGGER IF EXISTS trigger_update_quiz_stats_on_answer_change ON public.answers;

CREATE TRIGGER trigger_update_quiz_stats_on_answer_change
    AFTER INSERT OR UPDATE OR DELETE ON public.answers
    FOR EACH ROW EXECUTE FUNCTION public.update_quiz_statistics();