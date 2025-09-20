"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClassroom } from "@/contexts/classroom-context"
import { QRCodeSVG } from "qrcode.react"
import { CheckCircle, Users, Clock, Trophy, Lock, Unlock } from "lucide-react"

export function QuizDisplay() {
  const { state, setCorrectAnswer, endQuiz, lockQuiz, openQuizForEveryone } = useClassroom()
  const [selectedCorrectAnswer, setSelectedCorrectAnswer] = useState<"A" | "B" | "C" | "D" | null>(null)

  if (!state.currentClass?.currentQuiz) {
    return null
  }

  const quiz = state.currentClass.currentQuiz
  const totalStudents = state.currentClass.students.length
  const stats = state.currentClass.quizStats || { A: 0, B: 0, C: 0, D: 0, total: 0 }
  const answeredStudents = stats.total

  const handleSetCorrectAnswer = (answer: "A" | "B" | "C" | "D") => {
    setSelectedCorrectAnswer(answer)
    setCorrectAnswer(state.currentClass!.id, answer)
  }

  const getPointsForCurrentQuestion = () => {
    const pts = state.currentClass?.questionPoints || []
    const idx = state.currentClass?.currentQuestionIndex ?? 0
    return pts[idx] ?? 10
  }

  const getCurrentQuestionLabel = () => {
    const idx = (state.currentClass?.currentQuestionIndex ?? 0) + 1
    const total = state.currentClass?.questionPoints?.length
    return total ? `${idx}/${total}` : `${idx}`
  }

  const handleEndQuiz = () => {
    endQuiz(state.currentClass!.id)
    setSelectedCorrectAnswer(null)
  }

  const getAnswerCount = (option: "A" | "B" | "C" | "D") => stats[option]

  const getAnswerPercentage = (option: "A" | "B" | "C" | "D") => {
    if (answeredStudents === 0) return 0
    return Math.round((getAnswerCount(option) / answeredStudents) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">Câu hỏi đang hoạt động</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {answeredStudents}/{totalStudents}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Đang diễn ra</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="flex items-center gap-1">
                  Câu hiện tại: {getCurrentQuestionLabel()}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>Điểm câu hiện tại: {getPointsForCurrentQuestion()}</span>
              </div>
              <div className="flex items-center gap-2">
                {state.currentClass?.isQuizLocked ? (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Locked
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1">
                    <Unlock className="h-3 w-3" /> Open
                  </Badge>
                )}
                {state.currentClass?.isQuizLocked ? (
                  <Button size="sm" variant="outline" onClick={() => openQuizForEveryone(state.currentClass!.id)}>
                    <Unlock className="h-4 w-4 mr-1" /> Mở cho cả lớp
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => lockQuiz(state.currentClass!.id)}>
                    <Lock className="h-4 w-4 mr-1" /> Khóa ngay
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-800 font-medium">{quiz.question}</p>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-purple-300">
                <QRCodeSVG value={quiz.qrCode || ""} size={120} className="mx-auto" />
                <p className="text-xs text-center text-gray-600 mt-2">Quét QR để trả lời</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["A", "B", "C", "D"] as const).map((option) => {
          const count = getAnswerCount(option)
          const percentage = getAnswerPercentage(option)
          const isCorrect = quiz.correctAnswer === option
          const isSelected = selectedCorrectAnswer === option

          return (
            <Card
              key={option}
              className={`cursor-pointer transition-all duration-200 ${
                isCorrect
                  ? "border-green-500 bg-green-50"
                  : isSelected
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
              }`}
              onClick={() => !quiz.correctAnswer && handleSetCorrectAnswer(option)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`font-bold ${
                        isCorrect
                          ? "border-green-500 text-green-700 bg-green-100"
                          : "border-purple-500 text-purple-700 bg-purple-100"
                      }`}
                    >
                      {option}
                    </Badge>
                    {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>

                <p className="text-gray-800 mb-3">{quiz.options[option]}</p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCorrect ? "bg-green-500" : "bg-purple-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!quiz.correctAnswer ? (
          <p className="text-sm text-gray-600 text-center py-2">Nhấp vào đáp án đúng để chấm điểm</p>
        ) : (
          <div className="flex gap-4">
            <Button
              onClick={handleEndQuiz}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Kết thúc câu hỏi
            </Button>
          </div>
        )}
      </div>

      {/* Real-time Answers */}
      {quiz.answers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Câu trả lời theo thời gian thực</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {quiz.answers
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((answer, index) => (
                  <div
                    key={`${answer.studentId}-${answer.timestamp}`}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-bold">
                        {answer.answer}
                      </Badge>
                      <span className="text-sm font-medium">{answer.studentName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(answer.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
