"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit, Trash2, Trophy, Users } from "lucide-react"
import type { Student } from "@/types/classroom"
import { EditStudentDialog } from "@/components/edit-student-dialog"
import { useState } from "react"

interface StudentCardProps {
  student: Student
}

export function StudentCard({ student }: StudentCardProps) {
  const { state, deleteStudent } = useClassroom()
  const [showEditDialog, setShowEditDialog] = useState(false)

  if (!state.currentClass) return null

  const handleRemoveStudent = () => {
    if (!state.currentClass) return
    deleteStudent(state.currentClass.id, student.id)
  }

  const getTeamColor = (team?: "A" | "B") => {
    switch (team) {
      case "A":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "B":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <>
      <Card
        className={`transition-all duration-300 ease-in-out hover:shadow-md ${
          student.isCalled
            ? "ring-2 ring-amber-400/80 bg-amber-50/80 dark:bg-amber-950/30 transform scale-[1.03]"
            : "hover:border-primary/20"
        }`}
      >
        <CardContent className="p-3 relative overflow-hidden">
          {student.isCalled && (
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
          )}
          <div className="flex items-center space-x-3">
            <Avatar className={`w-10 h-10 relative ${student.isCalled ? "ring-2 ring-amber-400/60" : ""}`}>
              {student.isCalled && (
                <>
                  <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75 animate-ping" />
                  <span className="absolute -top-1 -right-1 inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </>
              )}
              <AvatarFallback
                className={`${
                  student.isCalled
                    ? "bg-gradient-to-br from-amber-200/60 to-orange-200/60 text-amber-900"
                    : "bg-primary/10 text-primary"
                } text-sm`}
              >
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-sm font-semibold ${
                    student.isCalled ? "text-amber-800 dark:text-amber-200" : "text-foreground"
                  } whitespace-normal break-words`}
                >
                  {student.name}
                </h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleRemoveStudent} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={student.isCalled ? "default" : "secondary"}
                    className={`text-xs ${student.isCalled ? "bg-amber-500 text-white" : ""}`}
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    {student.score}
                  </Badge>
                  {/* team badge removed (team not in Student type) */}
                </div>
                {student.isCalled && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                      Đang được gọi
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditStudentDialog open={showEditDialog} onOpenChange={setShowEditDialog} student={student} />
    </>
  )
}
