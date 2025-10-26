"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClassHierarchy } from "@/components/class-hierarchy"
import { RandomPicker } from "@/components/random-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RotateCcw, Users, Target, Calculator, LogOut, Lock, Unlock, Eraser, BookOpen } from "lucide-react"
import { useEffect, useState } from "react"
// import { ScoringSystem } from "@/components/scoring-system"
import { PointsSystem } from "@/components/points-system"
import { QuizBankDialog } from "@/components/quiz-bank-dialog"
import { QuizDialog } from "@/components/quiz-dialog"

export function TeacherDashboard() {
  const { state, resetQueue, lockQuiz, openQuizForEveryone, clearAnswers, resetAllScores } = useClassroom()
  const { logout } = useAuth()
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  // const [showScoringSystem, setShowScoringSystem] = useState(false)
  const [showPointsSystem, setShowPointsSystem] = useState(false)
  const [showQuizBank, setShowQuizBank] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)

  // Auto-open quiz dialog when a quiz becomes active; close when none
  useEffect(() => {
    const hasActiveQuiz = Boolean(state.currentClass?.currentQuiz?.isActive)
    if (hasActiveQuiz) setShowQuizDialog(true)
    else setShowQuizDialog(false)
  }, [state.currentClass?.currentQuiz?.id, state.currentClass?.currentQuiz?.isActive])

  if (!state.currentClass) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex h-[calc(100vh-4rem)]">
          <div className="w-80">
            <ClassHierarchy />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl">Select a Class</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Choose a class from the sidebar or create a new one to get started with your classroom management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const handleResetQueue = () => {
    resetQueue(state.currentClass!.id)
    setSelectedStudent(null)
  }

  const currentClass = state.currentClass
  const activeStudents = currentClass.students
  const totalScore = currentClass.students.reduce((sum, s) => sum + s.score, 0)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-full md:w-[28rem] flex-shrink-0 overflow-hidden">
          <ClassHierarchy />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-border bg-card/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{activeStudents.length} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{totalScore} Points</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Edit Score removed as requested */}
                <Button variant="ghost" size="sm" onClick={() => setShowPointsSystem(true)} className="h-7 px-2 text-xs">
                  <Calculator className="h-3 w-3 mr-1" />
                  Edit Points
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowQuizBank(true)} className="h-7 px-2 text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Quiz Bank
                </Button>
                {state.currentClass && (
                  state.currentClass.isQuizLocked ? (
                    <Button id="shortcut-lock-toggle" variant="ghost" size="sm" onClick={() => openQuizForEveryone(state.currentClass!.id)} className="h-7 px-2 text-xs">
                      <Unlock className="h-3 w-3 mr-1" />
                      Unlock Quiz
                    </Button>
                  ) : (
                    <Button id="shortcut-lock-toggle" variant="ghost" size="sm" onClick={() => lockQuiz(state.currentClass!.id)} className="h-7 px-2 text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Lock Quiz
                    </Button>
                  )
                )}
                {state.currentClass && (
                  <Button id="shortcut-reset-answers" variant="ghost" size="sm" onClick={() => clearAnswers(state.currentClass!.id)} className="h-7 px-2 text-xs">
                    <Eraser className="h-3 w-3 mr-1" />
                    Reset Answers
                  </Button>
                )}
                {state.currentClass && (
                    <Button id="shortcut-reset-scores" variant="ghost" size="sm" onClick={() => resetAllScores(state.currentClass!.id)} className="h-7 px-2 text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset Scores
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleResetQueue} className="h-7 px-2 text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { logout(); window.location.href = '/'; }} className="h-7 px-2 text-xs">
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl space-y-8">
              <RandomPicker selectedStudent={selectedStudent} onStudentSelected={setSelectedStudent} />

              {/* Quiz is shown in a dialog now; keep body clean */}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {/* <ScoringSystem open={showScoringSystem} onOpenChange={setShowScoringSystem} /> */}
      <PointsSystem open={showPointsSystem} onOpenChange={setShowPointsSystem} />
      <QuizBankDialog open={showQuizBank} onOpenChange={setShowQuizBank} />
      <QuizDialog open={showQuizDialog} onOpenChange={setShowQuizDialog} />
    </div>
  )
}
