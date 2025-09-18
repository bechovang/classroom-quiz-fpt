"use client"

import type React from "react"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Student } from "@/types/classroom"
import { useState, useEffect } from "react"

interface EditStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student
}

export function EditStudentDialog({ open, onOpenChange, student }: EditStudentDialogProps) {
  const { state, dispatch } = useClassroom()
  const [name, setName] = useState(student.name)
  const [score, setScore] = useState(student.score.toString())
  const [team, setTeam] = useState<string>(student.team || "none")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(student.name)
      setScore(student.score.toString())
      setTeam(student.team || "none")
    }
  }, [open, student])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !state.currentClass) return

    setIsSubmitting(true)
    try {
      const updatedStudent: Student = {
        ...student,
        name: name.trim(),
        score: Number.parseInt(score) || 0,
        team: team === "none" ? undefined : (team as "A" | "B"),
      }

      dispatch({
        type: "UPDATE_STUDENT",
        payload: {
          classId: state.currentClass.id,
          student: updatedStudent,
        },
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update student:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update the student's information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-student-name">Student Name</Label>
            <Input
              id="edit-student-name"
              placeholder="Enter student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-student-score">Score</Label>
            <Input
              id="edit-student-score"
              type="number"
              placeholder="0"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-student-team">Team</Label>
            <Select value={team} onValueChange={setTeam} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Team</SelectItem>
                <SelectItem value="A">Team A</SelectItem>
                <SelectItem value="B">Team B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
