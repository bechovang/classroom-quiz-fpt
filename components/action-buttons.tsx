"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, SkipForward, Trophy, Users, Forward } from "lucide-react"
import { useState } from "react"
import { TeamAssignmentDialog } from "@/components/team-assignment-dialog"

interface ActionButtonsProps {
  selectedStudent: string | null
  onActionComplete: () => void
}

export function ActionButtons({ selectedStudent, onActionComplete }: ActionButtonsProps) {
  const { state, awardPoints, openQuizForEveryone } = useClassroom()
  const [showTeamDialog, setShowTeamDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!selectedStudent || !state.currentClass) return null

  const student = state.currentClass.students.find((s) => s.id === selectedStudent)
  if (!student) return null

  const handleCorrectAnswer = async () => {
    setIsProcessing(true)
    try {
      awardPoints(state.currentClass!.id, selectedStudent, 10, "Correct answer")
      // Add a small delay for better UX
      setTimeout(() => {
        onActionComplete()
        setIsProcessing(false)
      }, 500)
    } catch (error) {
      setIsProcessing(false)
    }
  }

  const handleWrongAnswer = async () => {
    try {
      // Deduct wrong points for the currently called student immediately
      const idx = state.currentClass?.currentQuestionIndex ?? 0
      const penalty = state.currentClass?.wrongPoints?.[idx] ?? 0
      if (penalty !== 0) {
        await awardPoints(state.currentClass!.id, student.id, -penalty, "Wrong answer penalty")
      }
      await openQuizForEveryone(state.currentClass!.id, student.id)
    } catch {}
    setShowTeamDialog(true)
  }

  const handleSkip = () => {
    onActionComplete()
  }

  return (
    <>
      <Card className="border-2 border-primary/10 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-center flex items-center justify-center space-x-2">
            <Trophy className="w-5 h-5 text-accent" />
            <span>How did {student.name} do?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Correct Answer Button */}
            <Button
              size="lg"
              onClick={handleCorrectAnswer}
              disabled={isProcessing}
              className="flex-col h-24 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <CheckCircle className="w-7 h-7 mb-2" />
              <span className="text-sm font-semibold">Correct</span>
            </Button>

            {/* Wrong Answer Button */}
            <Button
              variant="destructive"
              size="lg"
              onClick={handleWrongAnswer}
              disabled={isProcessing}
              className="flex-col h-24 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <XCircle className="w-7 h-7 mb-2" />
              <span className="text-sm font-semibold">Wrong</span>
              <span className="text-xs opacity-90 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Split teams
              </span>
            </Button>

            {/* Skip Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              disabled={isProcessing}
              className="flex-col h-24 bg-transparent hover:bg-muted/50 border-2 border-muted hover:border-primary/30 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <SkipForward className="w-7 h-7 mb-2" />
              <span className="text-sm font-semibold">Skip</span>
              <span className="text-xs opacity-70 flex items-center">
                <Forward className="w-3 h-3 mr-1" />
                No change
              </span>
            </Button>
          </div>

          {/* Student Info */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            {/* Current score display removed as requested; team section removed to avoid type issues */}
          </div>
        </CardContent>
      </Card>

      <TeamAssignmentDialog
        open={showTeamDialog}
        onOpenChange={setShowTeamDialog}
        student={student}
        onComplete={onActionComplete}
      />
    </>
  )
}
