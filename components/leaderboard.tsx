"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"

export function Leaderboard() {
  const { state } = useClassroom()

  if (!state.currentClass) return null

  const topStudents = [...state.currentClass.students].sort((a, b) => b.score - a.score).slice(0, 5)

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-yellow-500" />
      case 1:
        return <Medal className="w-4 h-4 text-gray-400" />
      case 2:
        return <Award className="w-4 h-4 text-amber-600" />
      default:
        return (
          <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">
            {index + 1}
          </span>
        )
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Trophy className="w-4 h-4 mr-2 text-accent" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-0">
        {topStudents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No scores yet</p>
        ) : (
          topStudents.map((student, index) => (
            <div key={student.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
              <div className="flex-shrink-0">{getRankIcon(index)}</div>
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{student.name}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {student.score}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
