"use client"

import type React from "react"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddStudentDialog({ open, onOpenChange }: AddStudentDialogProps) {
  const { state, addStudent } = useClassroom()
  const [name, setName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !studentId.trim() || !state.currentClass) return

    setIsSubmitting(true)
    try {
      addStudent(state.currentClass.id, name.trim(), studentId.trim())
      setName("")
      setStudentId("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to add student:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setStudentId("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm học sinh mới</DialogTitle>
          <DialogDescription>Nhập thông tin học sinh để thêm vào lớp.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student-name">Tên học sinh</Label>
            <Input
              id="student-name"
              placeholder="Nhập tên học sinh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-id">Mã số sinh viên</Label>
            <Input
              id="student-id"
              placeholder="Nhập mã số sinh viên"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={!name.trim() || !studentId.trim() || isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm học sinh"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
