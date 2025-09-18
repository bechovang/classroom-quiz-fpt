"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Plus, Minus, Target, Award } from "lucide-react"
import { useState } from "react"

interface ScoringSystemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScoringSystem({ open, onOpenChange }: ScoringSystemProps) {
  const { state, awardPoints } = useClassroom()
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [points, setPoints] = useState("10")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!state.currentClass) return null

  const handleAwardPoints = async () => {
    if (!selectedStudent || !points) return

    setIsSubmitting(true)
    try {
      const pointsValue = Number.parseInt(points)
      awardPoints(state.currentClass!.id, selectedStudent, pointsValue, description.trim() || undefined)

      // Reset form
      setSelectedStudent("")
      setPoints("10")
      setDescription("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to award points:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickPointOptions = [
    { value: "5", label: "+5", icon: Plus, color: "bg-green-100 text-green-800" },
    { value: "10", label: "+10", icon: Trophy, color: "bg-blue-100 text-blue-800" },
    { value: "15", label: "+15", icon: Award, color: "bg-purple-100 text-purple-800" },
    { value: "-5", label: "-5", icon: Minus, color: "bg-red-100 text-red-800" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-accent" />
            <span>Award Points</span>
          </DialogTitle>
          <DialogDescription>Manually award or deduct points from students.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student-select">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {state.currentClass.students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{student.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {student.score}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Point Buttons */}
          <div className="space-y-2">
            <Label>Quick Points</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickPointOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setPoints(option.value)}
                  className={`flex-col h-16 ${points === option.value ? "ring-2 ring-primary" : ""}`}
                >
                  <option.icon className="w-4 h-4 mb-1" />
                  <span className="text-xs">{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Points Input */}
          <div className="space-y-2">
            <Label htmlFor="points-input">Custom Points</Label>
            <Input
              id="points-input"
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Enter points"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description-input">Description (Optional)</Label>
            <Textarea
              id="description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reason for awarding points..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {selectedStudent && points && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {state.currentClass.students.find((s) => s.id === selectedStudent)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current: {state.currentClass.students.find((s) => s.id === selectedStudent)?.score} points
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        Number.parseInt(points) >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }
                    >
                      {Number.parseInt(points) >= 0 ? "+" : ""}
                      {points} points
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      New total:{" "}
                      {(state.currentClass.students.find((s) => s.id === selectedStudent)?.score || 0) +
                        (Number.parseInt(points) || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleAwardPoints}
              disabled={!selectedStudent || !points || isSubmitting}
              className="flex-1"
            >
              <Target className="w-4 h-4 mr-2" />
              {isSubmitting ? "Awarding..." : "Award Points"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
