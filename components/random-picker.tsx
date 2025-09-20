"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Play, RotateCcw, Zap, Trophy } from "lucide-react"
import { useState } from "react"

interface RandomPickerProps {
  selectedStudent: string | null
  onStudentSelected: (studentId: string | null) => void
}

export function RandomPicker({ selectedStudent, onStudentSelected }: RandomPickerProps) {
  const { state, callRandomStudent, shuffleQueue, resetQueue } = useClassroom()
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinningName, setSpinningName] = useState("")
  const [spinProgress, setSpinProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  if (!state.currentClass) return null

  const availableStudents = state.currentClass.students.filter((s) => !s.isCalled)
  const selectedStudentData = selectedStudent ? state.currentClass.students.find((s) => s.id === selectedStudent) : null
  const totalStudents = state.currentClass.students.length
  const calledStudents = state.currentClass.students.filter((s) => s.isCalled).length
  const progressPercentage = totalStudents > 0 ? (calledStudents / totalStudents) * 100 : 0
  const currentQuestionIndex = (state.currentClass.currentQuestionIndex ?? 0)
  const totalQuestions = state.currentClass.questionPoints?.length
  const currentQuestionLabel = totalQuestions ? `${currentQuestionIndex + 1}/${totalQuestions}` : `${currentQuestionIndex + 1}`
  const currentQuestionPoints = state.currentClass.questionPoints?.[currentQuestionIndex] ?? 10

  const handleRandomPick = async () => {
    if (availableStudents.length === 0) return

    setIsSpinning(true)
    setSpinProgress(0)
    onStudentSelected(null)
    setShowConfetti(false)

    // Simulate spinning animation with progress
    const spinDuration = 3000
    const spinInterval = 80
    let elapsed = 0
    const totalSteps = spinDuration / spinInterval

    const spinTimer = setInterval(() => {
      const randomStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)]
      setSpinningName(randomStudent.name)
      elapsed += spinInterval
      setSpinProgress((elapsed / spinDuration) * 100)

      if (elapsed >= spinDuration) {
        clearInterval(spinTimer)

        // Pick the actual student
        const pickedStudent = callRandomStudent(state.currentClass!.id)
        if (pickedStudent) {
          onStudentSelected(pickedStudent.id)
          setSpinningName("")
          setShowConfetti(true)

          // Hide confetti after animation
          setTimeout(() => setShowConfetti(false), 3000)
        }
        setIsSpinning(false)
        setSpinProgress(0)
      }
    }, spinInterval)
  }

  const handleShuffle = () => {
    shuffleQueue(state.currentClass!.id)
  }

  const handleReset = () => {
    resetQueue(state.currentClass!.id)
    onStudentSelected(null)
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-center">
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="font-semibold">Câu hiện tại: {currentQuestionLabel}</span>
            <span className="opacity-70">·</span>
            <span>Điểm nhận: <span className="font-semibold">{currentQuestionPoints}</span></span>
          </Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ lớp học</span>
          <span className="text-muted-foreground">
            {calledStudents}/{totalStudents} đã gọi
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Current Selection Display */}
      <Card
        className={`border-2 border-dashed transition-all duration-300 ${
          showConfetti ? "border-accent shadow-lg shadow-accent/20" : "border-primary/20"
        }`}
      >
        <CardContent className="p-8 text-center relative overflow-hidden">
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-0 left-1/4 w-2 h-2 bg-accent rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="absolute top-0 right-1/4 w-2 h-2 bg-secondary rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
              <div
                className="absolute top-1/2 left-1/3 w-2 h-2 bg-chart-1 rounded-full animate-bounce"
                style={{ animationDelay: "0.6s" }}
              />
              <div
                className="absolute top-1/2 right-1/3 w-2 h-2 bg-chart-2 rounded-full animate-bounce"
                style={{ animationDelay: "0.8s" }}
              />
            </div>
          )}

          {isSpinning ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="animate-spin w-20 h-20 mx-auto">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-2xl border-2 border-primary/30">
                      ?
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-accent animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-primary animate-pulse mb-2">{spinningName}</h3>
                <Progress value={spinProgress} className="w-32 mx-auto h-1" />
                <p className="text-muted-foreground mt-2">Đang chọn...</p>
              </div>
            </div>
          ) : selectedStudentData ? (
            <div className="space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 mx-auto ring-4 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl">
                    {selectedStudentData.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {showConfetti && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-accent text-accent-foreground animate-pulse">Đã chọn!</Badge>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-4xl font-bold text-primary mb-2">{selectedStudentData.name}</h3>
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-sm">
                    MSSV: {selectedStudentData.studentId}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
                <Play className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-muted-foreground mb-2">Sẵn sàng chọn</h3>
                <p className="text-muted-foreground">{availableStudents.length} học sinh có sẵn</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          size="lg"
          onClick={handleRandomPick}
          disabled={isSpinning || availableStudents.length === 0}
          className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Play className="w-5 h-5 mr-2" />
          {isSpinning ? "Đang chọn..." : "Chọn ngẫu nhiên"}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleShuffle}
          disabled={isSpinning || availableStudents.length === 0}
          className="px-6 py-4 bg-transparent hover:bg-accent/10 hover:border-accent hover:text-accent transition-all duration-200"
        >
          <Shuffle className="w-5 h-5 mr-2" />
          Xáo trộn
        </Button>

        {calledStudents > 0 && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            disabled={isSpinning}
            className="px-6 py-4 bg-transparent hover:bg-secondary/10 hover:border-secondary hover:text-secondary transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Đặt lại
          </Button>
        )}
      </div>

      {/* Next Up Preview */}
      {!isSpinning && !selectedStudent && availableStudents.length > 0 && state.currentClass.randomQueue.length > 0 && (
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Tiếp theo trong hàng đợi:</span>
              </div>
              <div className="flex -space-x-2">
                {state.currentClass.randomQueue.slice(0, 3).map((studentId, index) => {
                  const student = state.currentClass!.students.find((s) => s.id === studentId)
                  if (!student) return null
                  return (
                    <Avatar key={studentId} className="w-6 h-6 border-2 border-background">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )
                })}
                {state.currentClass.randomQueue.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">+{state.currentClass.randomQueue.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {availableStudents.length === 0 && calledStudents > 0 && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-accent">
              <Zap className="w-5 h-5" />
              <p className="font-medium">Tất cả học sinh đã được gọi!</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Nhấn "Đặt lại" để bắt đầu vòng mới với tất cả học sinh.
            </p>
          </CardContent>
        </Card>
      )}

      {availableStudents.length === 0 && calledStudents === 0 && (
        <Card className="border-muted bg-muted/20">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">Không có học sinh. Thêm học sinh để bắt đầu chọn tên.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
