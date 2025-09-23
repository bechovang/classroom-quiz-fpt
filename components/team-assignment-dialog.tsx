"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Lock, Unlock, CheckCircle, XCircle } from "lucide-react"
import type { Student } from "@/types/classroom"
import { useState, useEffect } from "react"

interface OpportunitySharingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student
  onComplete: () => void
}

interface AnswerOption {
  id: string
  label: string
  count: number
  students: string[]
}

export function TeamAssignmentDialog({ open, onOpenChange, student, onComplete }: OpportunitySharingDialogProps) {
  const { state, setCorrectAnswer, endQuiz, lockQuiz, openQuizForEveryone } = useClassroom()
  const [isLocked, setIsLocked] = useState(false)
  const [correctAnswer, setLocalCorrectAnswer] = useState<string | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState(false)

  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([
    { id: "A", label: "Đáp án A", count: 0, students: [] },
    { id: "B", label: "Đáp án B", count: 0, students: [] },
    { id: "C", label: "Đáp án C", count: 0, students: [] },
    { id: "D", label: "Đáp án D", count: 0, students: [] },
  ])

  useEffect(() => {
    if (!state.currentClass) return
    const stats = state.currentClass.quizStats || { A: 0, B: 0, C: 0, D: 0, total: 0 }
    setAnswerOptions([
      { id: "A", label: "Đáp án A", count: stats.A, students: [] },
      { id: "B", label: "Đáp án B", count: stats.B, students: [] },
      { id: "C", label: "Đáp án C", count: stats.C, students: [] },
      { id: "D", label: "Đáp án D", count: stats.D, students: [] },
    ])
  }, [state.currentClass?.quizStats])

  // Sync local lock state with realtime isQuizLocked
  useEffect(() => {
    if (!open) return
    setIsLocked(!!state.currentClass?.isQuizLocked)
  }, [open, state.currentClass?.isQuizLocked])

  // Removed fake random updates; counts now come from Supabase realtime (quiz_stats)

  const handleToggleLock = async () => {
    try {
      if (!state.currentClass) return
      if (isLocked) {
        // Unlock for everyone and reset stats
        await openQuizForEveryone(state.currentClass.id, student.id)
      } else {
        // Lock immediately
        await lockQuiz(state.currentClass.id)
      }
      // Optimistic update; realtime will confirm
      setIsLocked((v) => !v)
    } catch (e) {
      console.error("Failed to toggle lock:", e)
    }
  }

  const handleSelectCorrectAnswer = (answerId: string) => {
    if (!isLocked || !state.currentClass) return
    // Use the real flow: set correct answer then end quiz (RPC awards points, context handles wrong points)
    setLocalCorrectAnswer(answerId)
    setCorrectAnswer(state.currentClass.id, answerId as any)
    endQuiz(state.currentClass.id)
    setPointsAwarded(true)
    setTimeout(() => {
      onOpenChange(false)
      onComplete()
      setIsLocked(false)
      setLocalCorrectAnswer(null)
      setPointsAwarded(false)
    }, 1200)
  }

  const totalSelections = state.currentClass?.quizStats?.total || answerOptions.reduce((sum, option) => sum + option.count, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-accent" />
            <span>Nhường Cơ Hội Cho Người Khác</span>
          </DialogTitle>
          <DialogDescription>
            Theo dõi lựa chọn của học sinh theo thời gian thực. Khóa khi mọi người đã chọn xong.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={isLocked ? "destructive" : "default"}>
                {isLocked ? (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    Đã khóa
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3 mr-1" />
                    Đang mở
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">{totalSelections} lượt chọn</span>
            </div>

            <Button
              onClick={handleToggleLock}
              variant={isLocked ? "destructive" : "default"}
              size="sm"
              disabled={pointsAwarded}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Mở khóa
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Khóa lại
                </>
              )}
            </Button>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-4">
            {answerOptions.map((option) => {
              const percentage = totalSelections > 0 ? (option.count / totalSelections) * 100 : 0
              const isCorrect = correctAnswer === option.id
              const isWrong = correctAnswer && correctAnswer !== option.id

              return (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isLocked && !pointsAwarded ? "hover:shadow-md" : ""
                  } ${isCorrect ? "border-green-500 bg-green-50" : isWrong ? "border-red-500 bg-red-50" : ""}`}
                  onClick={() => isLocked && !pointsAwarded && handleSelectCorrectAnswer(option.id)}
                  id={`shortcut-ans-${option.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-lg font-bold">
                          {option.id}
                        </Badge>
                        {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {isWrong && <XCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <span className="text-2xl font-bold text-primary">{option.count}</span>
                    </div>

                    <div className="space-y-2">
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{option.label}</span>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-muted-foreground">
            {!isLocked && <p>Đợi học sinh chọn xong, sau đó nhấn "Khóa lại"</p>}
            {isLocked && !correctAnswer && (
              <p className="text-primary font-medium">Nhấn vào đáp án đúng để tính điểm</p>
            )}
            {pointsAwarded && <p className="text-green-600 font-medium">Đã cộng/trừ điểm thành công!</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
