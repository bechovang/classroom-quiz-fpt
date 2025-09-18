"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, Lock, Unlock, CheckCircle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface OpportunitySharingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface AnswerOption {
  id: string
  label: string
  count: number
  students: string[]
}

export function OpportunitySharingDialog({ open, onOpenChange, onComplete }: OpportunitySharingDialogProps) {
  const { state, dispatch } = useClassroom()
  const [isLocked, setIsLocked] = useState(false)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState(false)

  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([
    { id: "A", label: "Đáp án A", count: 0, students: [] },
    { id: "B", label: "Đáp án B", count: 0, students: [] },
    { id: "C", label: "Đáp án C", count: 0, students: [] },
    { id: "D", label: "Đáp án D", count: 0, students: [] },
  ])

  const totalStudents = state.currentClass ? state.currentClass.students.length : 0
  const totalSelections = answerOptions.reduce((sum, option) => sum + option.count, 0)

  useEffect(() => {
    if (!isLocked && open) {
      const interval = setInterval(() => {
        setAnswerOptions((prev) =>
          prev.map((option) => ({
            ...option,
            count: Math.floor(Math.random() * (totalStudents / 2)) + option.count * 0.1,
            students: [], // In real implementation, this would track actual student IDs
          })),
        )
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isLocked, open, totalStudents])

  const handleToggleLock = () => {
    setIsLocked(!isLocked)
  }

  const handleSelectCorrectAnswer = (answerId: string) => {
    if (!isLocked) return

    setCorrectAnswer(answerId)

    const correctOption = answerOptions.find((opt) => opt.id === answerId)
    if (correctOption) {
      dispatch({
        type: "BULK_UPDATE_SCORES",
        payload: {
          classId: state.currentClass!.id,
          updates: state.currentClass!.students.map((student) => ({
            studentId: student.id,
            scoreChange: Math.random() > 0.5 ? 10 : -5, // Simulate correct/incorrect
          })),
        },
      })

      setPointsAwarded(true)

      setTimeout(() => {
        onComplete()
        onOpenChange(false)
        setIsLocked(false)
        setCorrectAnswer(null)
        setPointsAwarded(false)
      }, 3000)
    }
  }

  if (!state.currentClass) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-accent" />
            <span>Nhường Cơ Hội Cho Người Khác</span>
          </DialogTitle>
          <DialogDescription>
            Theo dõi lựa chọn của học sinh theo thời gian thực. Khóa khi mọi người đã chọn xong và chọn đáp án đúng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={isLocked ? "destructive" : "secondary"}>{isLocked ? "Đã khóa" : "Đang mở"}</Badge>
              <span className="text-sm text-muted-foreground">
                {totalSelections}/{totalStudents} học sinh đã chọn
              </span>
            </div>

            <Button
              onClick={handleToggleLock}
              variant={isLocked ? "destructive" : "default"}
              className="flex items-center space-x-2"
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{isLocked ? "Mở khóa" : "Khóa lựa chọn"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {answerOptions.map((option) => (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 ${
                  correctAnswer === option.id
                    ? "border-green-500 bg-green-50"
                    : correctAnswer && correctAnswer !== option.id
                      ? "border-red-200 bg-red-50"
                      : isLocked
                        ? "hover:border-primary"
                        : "border-muted"
                }`}
                onClick={() => isLocked && !pointsAwarded && handleSelectCorrectAnswer(option.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{option.label}</span>
                    <div className="flex items-center space-x-2">
                      {correctAnswer === option.id && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {correctAnswer && correctAnswer !== option.id && <XCircle className="w-5 h-5 text-red-500" />}
                      <Badge variant="outline" className="text-lg font-bold">
                        {Math.floor(option.count)}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={totalStudents > 0 ? (option.count / totalStudents) * 100 : 0} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {totalStudents > 0 ? Math.round((option.count / totalStudents) * 100) : 0}% học sinh chọn
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            {!isLocked && (
              <p className="text-sm text-muted-foreground">
                Đợi học sinh chọn đáp án, sau đó nhấn "Khóa lựa chọn" để ngăn thay đổi
              </p>
            )}
            {isLocked && !correctAnswer && (
              <p className="text-sm text-primary font-medium">Nhấn vào đáp án đúng để tính điểm cho học sinh</p>
            )}
            {correctAnswer && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">
                  Đáp án đúng: {answerOptions.find((opt) => opt.id === correctAnswer)?.label}
                </p>
                <p className="text-xs text-muted-foreground">Đang cập nhật điểm số cho học sinh...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
