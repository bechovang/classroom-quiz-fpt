"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { ClassHierarchy } from "@/components/class-hierarchy"
import { RandomPicker } from "@/components/random-picker"
import { ActionButtons } from "@/components/action-buttons"
import { QuizDisplay } from "@/components/quiz-display"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, Users, Target, Calculator, LogOut } from "lucide-react"
import { useState } from "react"
import { ScoringSystem } from "@/components/scoring-system"
import { PointsSystem } from "@/components/points-system"

export function TeacherDashboard() {
  const { state, resetQueue } = useClassroom()
  const { logout } = useAuth()
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [showScoringSystem, setShowScoringSystem] = useState(false)
  const [showPointsSystem, setShowPointsSystem] = useState(false)

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
  const activeStudents = currentClass.students.filter((s) => !s.isAbsent)
  const totalScore = currentClass.students.reduce((sum, s) => sum + s.score, 0)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80">
          <ClassHierarchy />
        </div>

        <div className="flex-1 flex flex-col">
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

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowScoringSystem(true)} className="h-8">
                  <Trophy className="h-4 w-4 mr-2" />
                  Edit Score
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPointsSystem(true)} className="h-8">
                  <Calculator className="h-4 w-4 mr-2" />
                  Edit Points
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetQueue} className="h-8">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { logout(); window.location.href = '/'; }} className="h-8">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl space-y-8">
              <RandomPicker selectedStudent={selectedStudent} onStudentSelected={setSelectedStudent} />

              <ActionButtons selectedStudent={selectedStudent} onActionComplete={() => setSelectedStudent(null)} />

              <QuizDisplay />
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ScoringSystem open={showScoringSystem} onOpenChange={setShowScoringSystem} />
      <PointsSystem open={showPointsSystem} onOpenChange={setShowPointsSystem} />
    </div>
  )
}
