"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Trophy, Target, Activity } from "lucide-react"

export function ClassStats() {
  const { state } = useClassroom()

  if (!state.currentClass) return null

  const { students, activities, calledStudents } = state.currentClass
  const totalStudents = students.length
  const averageScore =
    students.length > 0 ? Math.round(students.reduce((sum, student) => sum + student.score, 0) / students.length) : 0
  const studentsRemaining = students.filter((s) => !s.isCalled).length
  const recentActivities = activities.length

  const stats = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Average Score",
      value: averageScore,
      icon: Trophy,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Remaining",
      value: studentsRemaining,
      icon: Target,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Activities",
      value: recentActivities,
      icon: Activity,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
