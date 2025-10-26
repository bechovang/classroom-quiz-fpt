"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Activity as ActivityIcon, LogOut, Lock, Unlock, Eraser } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Activity } from "@/types/classroom"
import { supabase } from "@/lib/supabaseClient"

interface StudentDashboardProps {
  studentId: string
  onBack: () => void
}

export function StudentDashboard({ studentId, onBack }: StudentDashboardProps) {
  const { state, submitAnswer, clearMyAnswer } = useClassroom()
  const { redirectToLogin } = useAuth()
  const [scanSuccess, setScanSuccess] = useState<{ points: number; timestamp: number } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [clickedButton, setClickedButton] = useState<string | null>(null)

  if (!state.currentClass) return null

  const student = state.currentClass.students.find((s) => s.id === studentId)
  if (!student) return null

  const isBlocked = Boolean(state.currentClass.blockedStudentId && state.currentClass.blockedStudentId === studentId)
  const isDisabled = !!state.currentClass.isQuizLocked || isBlocked
  // Realtime: reflect teacher's reset answers or updates to my answer
  useEffect(() => {
    if (!state.currentClass) return
    const classId = state.currentClass.id
    const myId = studentId

    const channel = supabase
      .channel(`answers_${classId}_${myId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers", filter: `class_session_id=eq.${classId}` },
        (payload) => {
          const row = payload.new as any
          if (row.student_id === myId) {
            setSelectedAnswer(row.selected_answer)
            setClickedButton(null)
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "answers", filter: `class_session_id=eq.${classId}` },
        (payload) => {
          const row = payload.new as any
          if (row.student_id === myId) {
            setSelectedAnswer(row.selected_answer)
            setClickedButton(null)
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "answers", filter: `class_session_id=eq.${classId}` },
        (payload) => {
          const row = payload.old as any
          if (row.student_id === myId) {
            setSelectedAnswer(null)
            setClickedButton(null)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.currentClass?.id, studentId])

  const handleScanSuccess = (points: number) => {
    setScanSuccess({ points, timestamp: Date.now() })
    setTimeout(() => setScanSuccess(null), 3000)
  }

  const recentActivities = state.currentClass.activities
    .filter((activity) => activity.studentId === studentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5) as Activity[]

  const handleAnswerSelect = async (answer: string) => {
    if (!state.currentClass) return
    if (state.currentClass.isQuizLocked) return
    if (isBlocked) return
    // Block the initially called student from answering in this round
    if (state.currentClass.blockedStudentId && state.currentClass.blockedStudentId === studentId) return
    setClickedButton(answer)
    setSelectedAnswer(answer)

    try {
      const s = state.currentClass.students.find((x) => x.id === studentId)
      if (s) await submitAnswer(state.currentClass.id, s.id, s.name, answer as "A" | "B" | "C" | "D")
    } finally {
      setTimeout(() => setClickedButton(null), 1000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </Button>
          <Button 
            variant="ghost" 
            onClick={redirectToLogin} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {scanSuccess && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="p-4">
              <div className="text-center text-primary font-medium">
                Thành công! Bạn nhận được {scanSuccess.points} điểm!
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">{student.name}</h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <span>{student.studentId}</span>
                </div>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{student.score}</div>
                    <div className="text-sm font-medium opacity-90">điểm cộng</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Chọn đáp án</CardTitle>
            <div className="mt-1 flex items-center justify-center">
              {state.currentClass.isQuizLocked ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                  <Lock className="w-3 h-3" /> Quiz đang khóa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <Unlock className="w-3 h-3" /> Quiz đang mở
                </span>
              )}
            </div>
            <div className="mt-1 text-center text-xs text-muted-foreground">
              Câu hiện tại: {(state.currentClass.currentQuestionIndex ?? 0) + 1}
              {state.currentClass.questionPoints?.length ? `/${state.currentClass.questionPoints.length}` : ""}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!state.currentClass || isDisabled) return
                  try {
                    await clearMyAnswer(state.currentClass.id, studentId)
                    setSelectedAnswer(null)
                    setClickedButton(null)
                    toast({ title: "Đã xóa câu trả lời", description: "Bạn có thể chọn lại đáp án." })
                  } catch (e) {
                    toast({ title: "Xóa thất bại", description: "Vui lòng thử lại." })
                  }
                }}
                disabled={!state.currentClass || isDisabled}
                className="h-8"
              >
                <Eraser className="w-3 h-3 mr-1" /> Xóa câu trả lời
              </Button>
            </div>
            {state.currentClass.isQuizLocked && (
              <div className="text-center text-sm text-muted-foreground mt-1">Hiện không thể chọn đáp án</div>
            )}
            {isBlocked && !state.currentClass.isQuizLocked && (
              <div className="text-center text-sm text-muted-foreground mt-1">Bạn vừa được gọi và trả lời sai. Nhường cơ hội cho bạn khác.</div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleAnswerSelect("A")}
                disabled={isDisabled}
                className={`h-20 text-xl font-bold transition-all duration-300 transform
                  bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800
                  ${selectedAnswer === "A" ? "ring-2 ring-red-500 bg-red-100" : ""}
                  ${clickedButton === "A" ? "" : "hover:scale-105 hover:shadow-md"}
                  active:scale-95`}
                style={{
                  boxShadow:
                    clickedButton === "A"
                      ? "0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)"
                      : undefined,
                  transition: clickedButton === "A" ? "box-shadow 1s ease-out" : "all 0.3s ease",
                }}
              >
                A
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswerSelect("B")}
                disabled={isDisabled}
                className={`h-20 text-xl font-bold transition-all duration-300 transform
                  bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800
                  ${selectedAnswer === "B" ? "ring-2 ring-blue-500 bg-blue-100" : ""}
                  ${clickedButton === "B" ? "" : "hover:scale-105 hover:shadow-md"}
                  active:scale-95`}
                style={{
                  boxShadow:
                    clickedButton === "B"
                      ? "0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)"
                      : undefined,
                  transition: clickedButton === "B" ? "box-shadow 1s ease-out" : "all 0.3s ease",
                }}
              >
                B
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswerSelect("C")}
                disabled={isDisabled}
                className={`h-20 text-xl font-bold transition-all duration-300 transform
                  bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800
                  ${selectedAnswer === "C" ? "ring-2 ring-green-500 bg-green-100" : ""}
                  ${clickedButton === "C" ? "" : "hover:scale-105 hover:shadow-md"}
                  active:scale-95`}
                style={{
                  boxShadow:
                    clickedButton === "C"
                      ? "0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)"
                      : undefined,
                  transition: clickedButton === "C" ? "box-shadow 1s ease-out" : "all 0.3s ease",
                }}
              >
                C
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAnswerSelect("D")}
                disabled={isDisabled}
                className={`h-20 text-xl font-bold transition-all duration-300 transform
                  bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700 hover:text-yellow-800
                  ${selectedAnswer === "D" ? "ring-2 ring-yellow-500 bg-yellow-100" : ""}
                  ${clickedButton === "D" ? "" : "hover:scale-105 hover:shadow-md"}
                  active:scale-95`}
                style={{
                  boxShadow:
                    clickedButton === "D"
                      ? "0 0 30px rgba(234, 179, 8, 0.8), 0 0 60px rgba(234, 179, 8, 0.4)"
                      : undefined,
                  transition: clickedButton === "D" ? "box-shadow 1s ease-out" : "all 0.3s ease",
                }}
              >
                D
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <Badge variant="outline">+{activity.points} điểm</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có hoạt động nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
