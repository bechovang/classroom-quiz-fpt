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
  const { state, dispatch } = useClassroom()
  const [showEditDialog, setShowEditDialog] = useState(false)

  if (!state.currentClass) return null

  const handleRemoveStudent = () => {
    dispatch({
      type: "REMOVE_STUDENT",
      payload: {
        classId: state.currentClass!.id,
        studentId: student.id,
      },
    })
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
      <Card className={`transition-all hover:shadow-sm ${student.isCalled ? "opacity-60" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">{student.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground truncate">{student.name}</h4>
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

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    {student.score}
                  </Badge>
                  {student.team && (
                    <Badge className={`text-xs ${getTeamColor(student.team)}`}>
                      <Users className="w-3 h-3 mr-1" />
                      {student.team}
                    </Badge>
                  )}
                </div>
                {student.isCalled && (
                  <Badge variant="outline" className="text-xs">
                    Called
                  </Badge>
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
