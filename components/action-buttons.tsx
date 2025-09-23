"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, SkipForward } from "lucide-react"
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
      const wrongDelta = state.currentClass?.wrongPoints?.[idx] ?? 0
      if (wrongDelta !== 0) {
        // wrongDelta có thể âm (trừ điểm) hoặc dương (cộng điểm)
        await awardPoints(state.currentClass!.id, student.id, wrongDelta, "Wrong answer penalty")
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
      <Card className="border border-primary/10 shadow-sm">
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            {/* Correct Answer Button */}
            <Button
              size="sm"
              onClick={handleCorrectAnswer}
              disabled={isProcessing}
              className="flex-col h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md transition-all duration-150"
              id="shortcut-correct"
            >
              <CheckCircle className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Correct</span>
            </Button>

            {/* Wrong Answer Button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleWrongAnswer}
              disabled={isProcessing}
              className="flex-col h-14 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md transition-all duration-150"
              id="shortcut-wrong"
            >
              <XCircle className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Wrong</span>
            </Button>

            {/* Skip Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={isProcessing}
              className="flex-col h-14 bg-transparent hover:bg-muted/50 border border-muted hover:border-primary/30 shadow-sm transition-all duration-150"
              id="shortcut-random-pick"
            >
              <SkipForward className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">Skip</span>
            </Button>
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
