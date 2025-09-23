"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Users } from "lucide-react"
import { StudentCard } from "@/components/student-card"
import { AddStudentDialog } from "@/components/add-student-dialog"
import { ImportStudentsDialog } from "@/components/import-students-dialog"
import { Leaderboard } from "@/components/leaderboard"
import { useState } from "react"

export function StudentSidebar() {
  const { state } = useClassroom()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  if (!state.currentClass) return null

  const { students } = state.currentClass
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name))
  const anyStudentCalled = students.some((s) => s.isCalled)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Students</h3>
          <Badge variant="secondary">{students.length}</Badge>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="flex-1">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowImportDialog(true)} className="bg-transparent">
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-4 border-b border-border">
        <Leaderboard />
      </div>

      {/* Student List */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {sortedStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No students yet</p>
                <p className="text-xs text-muted-foreground">Add students to get started</p>
              </div>
            ) : (
              sortedStudents.map((student) => (
                <div
                  key={student.id}
                  className={`group relative rounded-lg transition-all duration-300 ${
                    student.isCalled ? "ring-2 ring-amber-300/60" : "hover:ring-1 hover:ring-primary/20"
                  } ${anyStudentCalled && !student.isCalled ? "opacity-50 hover:opacity-100" : "opacity-100"}`}
                >
                  <StudentCard student={student} />
                  {/* subtle glow on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{
                    background:
                      "radial-gradient(600px circle at var(--x, 0) var(--y, 0), rgba(59,130,246,0.06), transparent 40%)",
                  }} />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <AddStudentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <ImportStudentsDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  )
}
