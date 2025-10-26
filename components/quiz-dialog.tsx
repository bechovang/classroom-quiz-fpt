"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { QRCodeSVG } from "qrcode.react"
import { useClassroom } from "@/contexts/classroom-context"
import { Lock, Unlock, QrCode, RefreshCw, CheckCircle2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogFooter, AlertDialogHeader as ADHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabaseClient"
 

interface QuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuizDialog({ open, onOpenChange }: QuizDialogProps) {
  const { state, setCorrectAnswer, lockQuiz, openQuizForEveryone, callRandomStudent, startRandomQuizFromBank, clearAnswers, resetAnswersAndLock, clearBlockedStudent, awardPoints } = useClassroom()
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [resultText, setResultText] = useState("")
  const [othersChecked, setOthersChecked] = useState(false)
  const [othersResultOpen, setOthersResultOpen] = useState(false)
  const [othersResultText, setOthersResultText] = useState("")
  const [revealShown, setRevealShown] = useState(false)

  const current = state.currentClass
  const quiz = current?.currentQuiz
  const stats = current?.quizStats || { A: 0, B: 0, C: 0, D: 0, total: 0 }
  const totalStudents = current?.students.length || 0
  const answered = stats.total || 0
  const isLocked = !!current?.isQuizLocked
  const isReady = Boolean(current && quiz)
  const blockedName = current?.blockedStudentId
    ? current?.students.find((s) => s.id === current.blockedStudentId)?.name || null
    : null

  useEffect(() => {
    if (!open) return
    setSelected(null)
    setChecked(false)
    setOthersChecked(false)
    setOthersResultOpen(false)
    setOthersResultText("")
    setRevealShown(false)
    // Reset answers when opening the quiz dialog to start a fresh round
    if (state.currentClass?.id) {
      resetAnswersAndLock(state.currentClass.id).catch(() => {})
    }
  }, [open, quiz?.id])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (!isReady) return
      if (!checked) {
        if (e.key === "1") { handleSelect("A") }
        if (e.key === "2") { handleSelect("B") }
        if (e.key === "3") { handleSelect("C") }
        if (e.key === "4") { handleSelect("D") }
      }
      if (e.key.toLowerCase() === "l") { toggleLock() }
      if (e.key.toLowerCase() === "q") { setQrOpen((v) => !v) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, selected, isLocked, isReady, checked])

  const handleSelect = (opt: "A" | "B" | "C" | "D") => {
    if (!isReady || !current || checked) return
    // Allow selecting while locked only if a blocked student exists (teacher selecting on their behalf)
    if (isLocked && !current.blockedStudentId) return
    setSelected(opt)
  }

  const toggleLock = async () => {
    if (!current) return
    try {
      if (isLocked) await openQuizForEveryone(current.id)
      else await lockQuiz(current.id)
    } catch (e) {
      toast({ title: "Error", description: String(e) })
    }
  }

  const handleCheck = async () => {
    if (!isReady || !current) return
    try {
      // Determine correct answer from bank if available; fallback to teacher's selection
      const answerKey = (quiz as any)?.correctAnswer || selected
      if (!answerKey) {
        toast({ title: "Thiếu đáp án đúng", description: "Không có đáp án đúng để chấm." })
        return
      }
      setChecked(true)
      // Grade only the blocked student using the teacher's selection vs answer key
      try {
        if (current.blockedStudentId) {
          if (!selected) {
            toast({ title: "Chọn đáp án cho học sinh đang gọi", description: "Nhấn A/B/C/D để chọn hộ học sinh." })
          } else {
            // Persist answer and award points based on per-question settings
            await import("@/lib/supabaseApi").then((m) =>
              m.submitAnswerAsTeacher(current.id, current.blockedStudentId as string, selected),
            )
            const { correctPts, wrongPts } = pointsForCurrent()
            const pc = (quiz as any)?.pointsCorrect ?? correctPts
            const pw = (quiz as any)?.pointsIncorrect != null ? -Math.abs((quiz as any).pointsIncorrect) : wrongPts
            const delta = selected === answerKey ? pc : pw
            if (delta !== 0) await awardPoints(current.id, current.blockedStudentId as string, delta)
          }
        }
      } catch (err) {
        console.error("Failed to grade blocked student:", err)
      }
      // Prepare result dialog comparing teacher selection (if any) with the answer key
      if (selected) {
        const isMatch = selected === answerKey
        setResultText(isMatch ? `Bạn chọn ${selected}. Kết quả: Đúng.` : `Bạn chọn ${selected}. Kết quả: Sai. Đáp án: ${answerKey}.`)
      } else {
        setResultText(`Đáp án đúng là: ${answerKey}.`)
      }
      setResultOpen(true)
    } catch (e) {
      toast({ title: "Error", description: String(e) })
    }
  }

  const pointsForCurrent = () => {
    const idx = current?.currentQuestionIndex ?? 0
    const correctPts = current?.questionPoints?.[idx] ?? 10
    const wrongPts = current?.wrongPoints?.[idx] ?? 0
    return { correctPts, wrongPts }
  }

  // Removed manual Done flow; grading happens automatically on Check

  const joinUrl = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : ""
    const classIdOrCode = current?.classCode || current?.id || ""
    return `${base}/student?class=${classIdOrCode}`
  }, [current?.classCode, current?.id])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && state.currentClass?.id) {
          // When dialog closes after a random round, clear the blocked student
          clearBlockedStudent(state.currentClass.id).catch(() => {})
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-none w-[92vw] max-w-[92vw] h-[88vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span>{current?.name || "Class"}</span>
              <span className="text-muted-foreground">·</span>
              <span>Câu hiện tại: {((current?.currentQuestionIndex ?? 0) + 1)}</span>
              {blockedName && (
                <span className="text-muted-foreground">·</span>
              )}
              {blockedName && (
                <Badge variant="secondary" className="whitespace-nowrap">Đang gọi: {blockedName}</Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Popover open={qrOpen} onOpenChange={setQrOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!isReady}>
                    <QrCode className="h-4 w-4 mr-2" /> QR
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto">
                  <div className="flex flex-col items-center gap-2">
                    <QRCodeSVG value={joinUrl} size={160} />
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={toggleLock} disabled={!current}>
                {isLocked ? (<><Unlock className="h-4 w-4 mr-2" /> Unlock</>) : (<><Lock className="h-4 w-4 mr-2" /> Lock</>)}
              </Button>
              <Button size="sm" onClick={handleCheck} disabled={!isReady || checked}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Check
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRevealShown(true)}
                disabled={!isReady || revealShown}
                title="Show correct answer & explanation"
              >
                Show
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const current = state.currentClass
                  if (!isReady || !current) return
                  const answerKey = (quiz as any)?.correctAnswer || selected
                  if (!answerKey) {
                    toast({ title: "Chọn đáp án đúng trước", description: "Nhấn A/B/C/D để chọn hoặc dùng đáp án từ bank." })
                    return
                  }
                  try {
                    // Determine per-question points (auto-negative for wrong when from bank)
                    const { correctPts, wrongPts } = pointsForCurrent()
                    const pc = (quiz as any)?.pointsCorrect ?? correctPts
                    const pw = (quiz as any)?.pointsIncorrect != null ? -Math.abs((quiz as any).pointsIncorrect) : wrongPts

                    // Fetch all answers for this session
                    const { data: rows, error } = await supabase
                      .from("answers")
                      .select("student_id, selected_answer")
                      .eq("class_session_id", current.id)
                    if (error) throw error

                    const blockedId = current.blockedStudentId || null
                    const others = (rows || []).filter((r: any) => r.student_id !== blockedId)
                    const correctIds = others.filter((r: any) => r.selected_answer === answerKey).map((r: any) => r.student_id)
                    const wrongIds = others.filter((r: any) => r.selected_answer !== answerKey).map((r: any) => r.student_id)
                    const unansweredCount = (current.students?.length || 0) > 0
                      ? current.students.filter((s) => s && s.id !== blockedId && !(others || []).some((r: any) => r.student_id === s.id)).length
                      : 0

                    await Promise.all([
                      ...correctIds.map((sid: string) => awardPoints(current.id, sid, pc)),
                      ...(pw !== 0 ? wrongIds.map((sid: string) => awardPoints(current.id, sid, pw)) : []),
                    ])

                    setOthersChecked(true)
                    const pwDisplay = Math.abs(pw)
                    setOthersResultText(`Đúng: ${correctIds.length} (+${pc})\nSai: ${wrongIds.length} (-${pwDisplay})\nKhông trả lời: ${unansweredCount}`)
                    setOthersResultOpen(true)
                  } catch (e) {
                    toast({ title: "Error", description: String(e) })
                  }
                }}
                disabled={!isReady || othersChecked}
                title="Check Ans Others"
              >
                Check Ans Others
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[30%_40%_30%] gap-6 h-[calc(88vh-4.5rem)] px-1 pb-2 overflow-hidden">
          {/* Left: Question */}
          <div className="overflow-auto space-y-3">
            {isReady ? (
              <>
                <div className="text-xl font-semibold leading-relaxed break-words">{quiz!.question}</div>
                {(quiz as any)?.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {(quiz as any).tags.map((t: string) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                ) : null}
                {/* Points summary: show per-question points if present, otherwise fallback */}
                {(() => {
                  const { correctPts, wrongPts } = pointsForCurrent()
                  const pc = (quiz as any)?.pointsCorrect ?? correctPts
                  const pwBase = (quiz as any)?.pointsIncorrect ?? wrongPts
                  const pwDisplay = Math.abs(pwBase)
                  return (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>Điểm cộng:</span>
                        <Badge variant="outline">+{pc}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Điểm trừ:</span>
                        <Badge variant="outline">-{pwDisplay}</Badge>
                      </div>
                    </div>
                  )
                })()}
                {(quiz as any)?.explanation ? (
                  <details className="text-sm" open={revealShown}>
                    <summary className="cursor-pointer text-muted-foreground">Giải thích</summary>
                    <div className="mt-2 whitespace-pre-wrap break-words">{(quiz as any).explanation}</div>
                  </details>
                ) : null}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Waiting for quiz…</div>
            )}
          </div>

          {/* Center: Options */}
          <div className="overflow-auto">
            {isReady ? (
              <div className="grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const correctKey = (quiz as any)?.correctAnswer || null
                  const willReveal = revealShown && correctKey
                  const isCorrect = willReveal ? correctKey === opt : checked && selected === opt
                  const baseVariant = isCorrect ? "default" : selected === opt ? "default" : "outline"
                  const colorClass = willReveal
                    ? (isCorrect ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" : "bg-red-500/10 hover:bg-red-500/20 text-red-700 border-red-500/40")
                    : ""
                  return (
                    <Button
                      key={opt}
                      variant={baseVariant as any}
                      className={`h-24 text-left justify-start text-base ${selected === opt ? "ring-2 ring-primary" : ""} ${colorClass}`}
                      disabled={checked || (isLocked && !current?.blockedStudentId)}
                      onClick={() => handleSelect(opt)}
                    >
                      <Badge variant="outline" className="mr-3">{opt}</Badge>
                      <span className="line-clamp-2 break-words">{quiz!.options[opt]}</span>
                    </Button>
                  )
                })}
              </div>
            ) : null}
          </div>

          {/* Right: Stats */}
          <div className="overflow-auto space-y-3">
            <div className="text-sm text-muted-foreground">Answered {answered}/{totalStudents}</div>
            {(["A", "B", "C", "D"] as const).map((opt) => {
              const count = (stats as any)[opt] || 0
              const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0
              const label = isReady ? (quiz as any)?.options?.[opt] : "—"
              return (
                <div key={opt} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={checked && selected === opt ? "default" : "outline"}>{opt}</Badge>
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })}

            <Separator />
            <div className="text-xs text-muted-foreground">State: {isLocked ? "Locked" : "Open"}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => current && openQuizForEveryone(current.id)} disabled={!current}>Re-open</Button>
              <Button variant="outline" size="sm" onClick={toggleLock} disabled={!current}>{isLocked ? "Unlock" : "Lock"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Manual Done flow removed: grading is automatic on Check */}
      {/* Result dialog after auto grading */}
      <AlertDialog open={resultOpen} onOpenChange={setResultOpen}>
        <AlertDialogContent>
          <ADHeader>
            <AlertDialogTitle>Kết quả</AlertDialogTitle>
          </ADHeader>
          <div className="text-sm">{resultText}</div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResultOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result dialog for "Check Ans Others" */}
      <AlertDialog open={othersResultOpen} onOpenChange={setOthersResultOpen}>
        <AlertDialogContent>
          <ADHeader>
            <AlertDialogTitle>Kết quả (các học sinh khác)</AlertDialogTitle>
          </ADHeader>
          <div className="text-sm whitespace-pre-wrap">{othersResultText}</div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOthersResultOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
