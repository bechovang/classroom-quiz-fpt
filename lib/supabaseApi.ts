import { supabase } from "@/lib/supabaseClient"

export interface SupabaseClassSession {
  id: string
  created_at: string
  class_code: string
  is_quiz_locked: boolean
  quiz_stats: { A: number; B: number; C: number; D: number; total: number } | null
  blocked_student_id?: string | null
}

export interface SupabaseStudent {
  id: string
  created_at: string
  student_name: string
  student_code: string | null
  score: number
  class_session_id: string
}

export async function createClassSession(): Promise<SupabaseClassSession> {
  const classCode = generateClassCode()
  const { data, error } = await supabase
    .from("class_sessions")
    .insert({ class_code: classCode })
    .select()
    .single()

  if (error) throw error
  return data as SupabaseClassSession
}

export async function listClassSessions(): Promise<SupabaseClassSession[]> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("id, created_at, class_code, is_quiz_locked, quiz_stats")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []) as SupabaseClassSession[]
}

export async function getClassSessionByCode(classCode: string): Promise<SupabaseClassSession | null> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("id, created_at, class_code, is_quiz_locked, quiz_stats")
    .eq("class_code", classCode)
    .maybeSingle()

  if (error) throw error
  return (data as SupabaseClassSession) || null
}

export async function getClassSessionById(sessionId: string): Promise<SupabaseClassSession | null> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("id, created_at, class_code, is_quiz_locked, quiz_stats")
    .eq("id", sessionId)
    .maybeSingle()

  if (error) throw error
  return (data as SupabaseClassSession) || null
}

export async function fetchStudents(sessionId: string): Promise<SupabaseStudent[]> {
  const { data, error } = await supabase
    .from("students")
    .select("id, created_at, student_name, student_code, score, class_session_id")
    .eq("class_session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data || []) as SupabaseStudent[]
}

export async function addStudentToSession(
  sessionId: string,
  studentName: string,
  studentCode?: string,
): Promise<SupabaseStudent> {
  const { data, error } = await supabase
    .from("students")
    .insert({ class_session_id: sessionId, student_name: studentName, student_code: studentCode || null })
    .select()
    .single()

  if (error) throw error
  return data as SupabaseStudent
}

export async function addStudentsBulk(
  sessionId: string,
  students: { name: string; code?: string }[],
): Promise<SupabaseStudent[]> {
  if (students.length === 0) return []
  const payload = students.map((s) => ({
    class_session_id: sessionId,
    student_name: s.name,
    student_code: s.code || null,
  }))

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select()

  if (error) throw error
  return (data || []) as SupabaseStudent[]
}

export async function updateStudentScore(sessionId: string, studentId: string, newScore: number): Promise<void> {
  const { error } = await supabase
    .from("students")
    .update({ score: newScore })
    .eq("id", studentId)
    .eq("class_session_id", sessionId)

  if (error) throw error
}

export async function updateStudent(
  sessionId: string,
  studentId: string,
  fields: Partial<{ student_name: string; student_code: string | null; score: number }>,
): Promise<SupabaseStudent> {
  const { data, error } = await supabase
    .from("students")
    .update(fields)
    .eq("id", studentId)
    .eq("class_session_id", sessionId)
    .select()
    .single()

  if (error) throw error
  return data as SupabaseStudent
}

export async function deleteStudent(sessionId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("class_session_id", sessionId)

  if (error) throw error
}

export async function deleteClassSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("class_sessions")
    .delete()
    .eq("id", sessionId)

  if (error) throw error
}

export async function submitAnswer(
  sessionId: string,
  studentId: string,
  selected: "A" | "B" | "C" | "D",
): Promise<void> {
  // Verify lock state from server to prevent race conditions if UI hasn't updated yet
  const lockRes = await supabase
    .from("class_sessions")
    .select("is_quiz_locked")
    .eq("id", sessionId)
    .single()
  if (lockRes.error) throw lockRes.error
  if (lockRes.data?.is_quiz_locked) throw new Error("Quiz is locked")

  const { error } = await supabase
    .from("answers")
    .upsert(
      [{ class_session_id: sessionId, student_id: studentId, selected_answer: selected }],
      { onConflict: "class_session_id,student_id" },
    )

  if (error) throw error
}

// Submit an answer bypassing the client-side lock check (teacher-driven assignment)
export async function submitAnswerAsTeacher(
  sessionId: string,
  studentId: string,
  selected: "A" | "B" | "C" | "D",
): Promise<void> {
  const { error } = await supabase
    .from("answers")
    .upsert(
      [{ class_session_id: sessionId, student_id: studentId, selected_answer: selected }],
      { onConflict: "class_session_id,student_id" },
    )

  if (error) throw error
}

// Clear all answers for a session (does not change lock state)
export async function clearAnswers(sessionId: string): Promise<void> {
  const { error } = await supabase.from("answers").delete().eq("class_session_id", sessionId)
  if (error) throw error
}

// Reset all scores to zero for a session's students
export async function resetAllScores(sessionId: string): Promise<void> {
  const { error } = await supabase.from("students").update({ score: 0 }).eq("class_session_id", sessionId)
  if (error) throw error
}

// Adjust a student's score by student_code (MSSV) within a session
export async function adjustScoreByStudentCode(
  sessionId: string,
  studentCode: string,
  delta: number,
): Promise<SupabaseStudent | null> {
  const { data: found, error: findErr } = await supabase
    .from("students")
    .select("id, created_at, student_name, student_code, score, class_session_id")
    .eq("class_session_id", sessionId)
    .eq("student_code", studentCode)
    .maybeSingle()
  if (findErr) throw findErr
  if (!found) return null

  const newScore = (found.score || 0) + delta
  const { data, error } = await supabase
    .from("students")
    .update({ score: newScore })
    .eq("id", found.id)
    .eq("class_session_id", sessionId)
    .select()
    .single()
  if (error) throw error
  return data as SupabaseStudent
}

// Delete a single student's answer row for the current session
export async function clearStudentAnswer(sessionId: string, studentId: string): Promise<void> {
  const { error } = await supabase
    .from("answers")
    .delete()
    .eq("class_session_id", sessionId)
    .eq("student_id", studentId)
  if (error) throw error
}

export type QuizStats = { A: number; B: number; C: number; D: number; total: number }

export function subscribeToQuizStats(
  sessionId: string,
  onChange: (stats: QuizStats | null) => void,
) {
  const channel = supabase
    .channel(`class_session_${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "class_sessions", filter: `id=eq.${sessionId}` },
      (payload) => {
        const record = payload.new as SupabaseClassSession
        onChange((record?.quiz_stats as QuizStats) || null)
      },
    )
    .subscribe()

  // Initial fetch to seed current stats
  ;(async () => {
    const { data } = await supabase
      .from("class_sessions")
      .select("quiz_stats")
      .eq("id", sessionId)
      .single()
    onChange((data?.quiz_stats as QuizStats) || null)
  })()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Subscribe to lock state only
export function subscribeToQuizLock(
  sessionId: string,
  onLockChange: (isLocked: boolean) => void,
  onBlockedChange?: (blockedStudentId: string | null) => void,
) {
  const channel = supabase
    .channel(`class_session_lock_${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "class_sessions", filter: `id=eq.${sessionId}` },
      (payload) => {
        const record = payload.new as SupabaseClassSession
        onLockChange(!!record?.is_quiz_locked)
        if (onBlockedChange) onBlockedChange((record as any)?.blocked_student_id ?? null)
      },
    )
    .subscribe()

  // Seed
  ;(async () => {
    const { data } = await supabase
      .from("class_sessions")
      .select("is_quiz_locked, blocked_student_id")
      .eq("id", sessionId)
      .single()
    onLockChange(!!data?.is_quiz_locked)
    if (onBlockedChange) onBlockedChange((data as any)?.blocked_student_id ?? null)
  })()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Open quiz for everyone: clear answers, unlock, reset stats to zero
export async function openQuizForEveryone(sessionId: string, excludedStudentId?: string): Promise<SupabaseClassSession> {
  // 1) Clear prior answers of this session
  const del = await supabase.from("answers").delete().eq("class_session_id", sessionId)
  if (del.error) throw del.error

  // 2) Unlock and reset stats; only touch blocked_student_id when explicitly provided
  const updates: Record<string, any> = {
    is_quiz_locked: false,
    quiz_stats: { A: 0, B: 0, C: 0, D: 0, total: 0 },
  }
  if (typeof excludedStudentId !== "undefined") {
    updates.blocked_student_id = excludedStudentId || null
  }

  const { data, error } = await supabase
    .from("class_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single()

  if (error) throw error
  return data as SupabaseClassSession
}

// Lock the current quiz to stop receiving more answers
export async function lockCurrentQuiz(sessionId: string): Promise<SupabaseClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .update({ is_quiz_locked: true })
    .eq("id", sessionId)
    .select()
    .single()

  if (error) throw error
  return data as SupabaseClassSession
}

// Clear the blocked student so no one is blocked from answering
export async function clearBlockedStudent(sessionId: string): Promise<SupabaseClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .update({ blocked_student_id: null })
    .eq("id", sessionId)
    .select()
    .single()

  if (error) throw error
  return data as SupabaseClassSession
}

// Grade quiz and award points using a Postgres function (RPC)
export async function gradeQuizAndAwardPoints(
  sessionId: string,
  correctAnswer: "A" | "B" | "C" | "D",
  points: number,
): Promise<{ updated_student_id: string; new_score: number }[]> {
  const { data, error } = await supabase.rpc("grade_and_award_points", {
    session_id_param: sessionId,
    correct_answer_param: correctAnswer,
    points_param: points,
  })

  if (error) throw error
  return (data || []) as { updated_student_id: string; new_score: number }[]
}

// Attempt an all-in-one grading RPC that awards correct points and applies wrong delta in one transaction
// SQL expected on server:
// create or replace function public.grade_full_quiz(
//   session_id_param uuid,
//   correct_answer_param char(1),
//   points_correct_param int,
//   points_wrong_param int
// ) returns void language plpgsql as $$ ... $$;
export async function gradeFullQuiz(
  sessionId: string,
  correctAnswer: "A" | "B" | "C" | "D",
  pointsCorrect: number,
  pointsWrong: number,
): Promise<void> {
  const { error } = await supabase.rpc("grade_full_quiz", {
    session_id_param: sessionId,
    correct_answer_param: correctAnswer,
    points_correct_param: pointsCorrect,
    points_wrong_param: pointsWrong,
  })
  if (error) throw error
}

export interface SupabaseQuizBankRow {
  id: string
  created_at: string
  question_text: string
  options: { A: string; B: string; C: string; D: string }
  correct_answer: "A" | "B" | "C" | "D"
  explanation: string | null
  tags: string[] | null
  points_correct: number
  points_incorrect: number
}

export async function fetchRandomQuizFromBank(tag?: string): Promise<SupabaseQuizBankRow | null> {
  let query = supabase
    .from("quiz_bank")
    .select("id, created_at, question_text, options, correct_answer, explanation, tags, points_correct, points_incorrect")

  if (tag) {
    // Filter by tag if provided
    query = query.contains("tags", [tag]) as any
  }

  // Fetch up to 50 rows then pick a random client-side to avoid slow ORDER BY RANDOM()
  const { data, error } = await query.limit(50)
  if (error) throw error
  const rows = (data || []) as SupabaseQuizBankRow[]
  if (rows.length === 0) return null
  const picked = rows[Math.floor(Math.random() * rows.length)]
  return picked
}

export async function listQuizBank(params?: { tag?: string; search?: string; limit?: number }): Promise<SupabaseQuizBankRow[]> {
  let query = supabase
    .from("quiz_bank")
    .select("id, created_at, question_text, options, correct_answer, explanation, tags, points_correct, points_incorrect")
    .order("created_at", { ascending: false })

  if (params?.tag) {
    query = query.contains("tags", [params.tag]) as any
  }
  if (params?.search) {
    // Basic ILIKE search on question_text
    query = query.ilike("question_text", `%${params.search}%`) as any
  }
  if (params?.limit) {
    query = query.limit(params.limit) as any
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as SupabaseQuizBankRow[]
}

export async function createQuizBankItem(payload: {
  question_text: string
  options: { A: string; B: string; C: string; D: string }
  correct_answer: "A" | "B" | "C" | "D"
  explanation?: string | null
  tags?: string[] | null
  points_correct?: number
  points_incorrect?: number
}): Promise<SupabaseQuizBankRow> {
  const { data, error } = await supabase
    .from("quiz_bank")
    .insert({
      question_text: payload.question_text,
      options: payload.options,
      correct_answer: payload.correct_answer,
      explanation: payload.explanation ?? null,
      tags: payload.tags ?? null,
      points_correct: payload.points_correct ?? 1,
      points_incorrect: payload.points_incorrect ?? 1,
    })
    .select("id, created_at, question_text, options, correct_answer, explanation, tags, points_correct, points_incorrect")
    .single()
  if (error) throw error
  return data as SupabaseQuizBankRow
}

export async function updateQuizBankItem(
  id: string,
  fields: Partial<{
    question_text: string
    options: { A: string; B: string; C: string; D: string }
    correct_answer: "A" | "B" | "C" | "D"
    explanation: string | null
    tags: string[] | null
    points_correct: number
    points_incorrect: number
  }>,
): Promise<SupabaseQuizBankRow> {
  const { data, error } = await supabase
    .from("quiz_bank")
    .update(fields)
    .eq("id", id)
    .select("id, created_at, question_text, options, correct_answer, explanation, tags, points_correct, points_incorrect")
    .single()
  if (error) throw error
  return data as SupabaseQuizBankRow
}

export async function deleteQuizBankItem(id: string): Promise<void> {
  const { error } = await supabase.from("quiz_bank").delete().eq("id", id)
  if (error) throw error
}

export async function deleteAllQuizBankItems(): Promise<number> {
  // Get count first for reporting
  const { count, error: countErr } = await supabase
    .from("quiz_bank")
    .select("id", { count: "exact", head: true })
  if (countErr) throw countErr

  const { error } = await supabase.from("quiz_bank").delete().neq("id", "")
  if (error) throw error
  return count || 0
}

export async function bulkInsertQuizBank(rows: Array<{
  question_text: string
  options: { A: string; B: string; C: string; D: string }
  correct_answer: "A" | "B" | "C" | "D"
  explanation?: string | null
  tags?: string[] | null
  points_correct?: number
  points_incorrect?: number
}>): Promise<number> {
  if (rows.length === 0) return 0
  const { data, error } = await supabase
    .from("quiz_bank")
    .insert(
      rows.map((r) => ({
        question_text: r.question_text,
        options: r.options,
        correct_answer: r.correct_answer,
        explanation: r.explanation ?? null,
        tags: r.tags ?? null,
        points_correct: r.points_correct ?? 1,
        points_incorrect: r.points_incorrect ?? 1,
      })),
    )
    .select("id")
  if (error) throw error
  return (data || []).length
}

function generateClassCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}


