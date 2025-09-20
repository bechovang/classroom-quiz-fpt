import { supabase } from "@/lib/supabaseClient"

export interface SupabaseClassSession {
  id: string
  created_at: string
  class_code: string
  is_quiz_locked: boolean
  quiz_stats: { A: number; B: number; C: number; D: number; total: number } | null
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
  onChange: (isLocked: boolean) => void,
) {
  const channel = supabase
    .channel(`class_session_lock_${sessionId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "class_sessions", filter: `id=eq.${sessionId}` },
      (payload) => {
        const record = payload.new as SupabaseClassSession
        onChange(!!record?.is_quiz_locked)
      },
    )
    .subscribe()

  // Seed
  ;(async () => {
    const { data } = await supabase
      .from("class_sessions")
      .select("is_quiz_locked")
      .eq("id", sessionId)
      .single()
    onChange(!!data?.is_quiz_locked)
  })()

  return () => {
    supabase.removeChannel(channel)
  }
}

// Open quiz for everyone: clear answers, unlock, reset stats to zero
export async function openQuizForEveryone(sessionId: string): Promise<SupabaseClassSession> {
  // 1) Clear prior answers of this session
  const del = await supabase.from("answers").delete().eq("class_session_id", sessionId)
  if (del.error) throw del.error

  // 2) Unlock and reset stats
  const { data, error } = await supabase
    .from("class_sessions")
    .update({
      is_quiz_locked: false,
      quiz_stats: { A: 0, B: 0, C: 0, D: 0, total: 0 },
    })
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

function generateClassCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}


