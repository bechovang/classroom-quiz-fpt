"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, TrendingUp, Target, Award, Users, Calendar } from "lucide-react"
import type { Student, ClassData } from "@/types/classroom"
import { formatDistanceToNow } from "date-fns"

interface StudentStatsProps {
  student: Student
  classData: ClassData
}

export function StudentStats({ student, classData }: StudentStatsProps) {
  const allStudents = [...classData.students].sort((a, b) => b.score - a.score)
  const studentRank = allStudents.findIndex((s) => s.id === student.id) + 1
  const totalStudents = allStudents.length

  const studentActivities = classData.activities.filter((activity) => activity.studentId === student.id)
  const totalPointsEarned = studentActivities.reduce((sum, activity) => sum + Math.max(0, activity.points), 0)
  const averageScore = totalStudents > 0 ? classData.students.reduce((sum, s) => sum + s.score, 0) / totalStudents : 0

  const teamMembers = student.team ? classData.students.filter((s) => s.team === student.team) : []
  const teamAverageScore =
    teamMembers.length > 0 ? teamMembers.reduce((sum, s) => sum + s.score, 0) / teamMembers.length : 0

  const stats = [
    {
      title: "Current Score",
      value: student.score,
      icon: Trophy,
      color: "text-accent",
      bgColor: "bg-accent/10",
      description: `${student.score > averageScore ? "Above" : "Below"} class average`,
    },
    {
      title: "Class Rank",
      value: `#${studentRank}`,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: `Out of ${totalStudents} students`,
    },
    {
      title: "Activities",
      value: studentActivities.length,
      icon: Award,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      description: "Total participations",
    },
    {
      title: "Points Earned",
      value: totalPointsEarned,
      icon: TrendingUp,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
      description: "From activities",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.title} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <span className="text-lg font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">vs Class Average</span>
              <span className="font-medium">
                {student.score > averageScore ? "+" : ""}
                {Math.round(student.score - averageScore)} points
              </span>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, ((student.score - averageScore + 50) / 100) * 100))}
              className="h-2"
            />
          </div>

          {student.team && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">vs Team {student.team} Average</span>
                <span className="font-medium">
                  {student.score > teamAverageScore ? "+" : ""}
                  {Math.round(student.score - teamAverageScore)} points
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, ((student.score - teamAverageScore + 50) / 100) * 100))}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Info */}
      {student.team && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Team {student.team}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team Members</span>
              <Badge variant="secondary">{teamMembers.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team Average</span>
              <span className="font-medium">{Math.round(teamAverageScore)} points</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Contribution</span>
              <Badge
                className={
                  student.score > teamAverageScore ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                }
              >
                {student.score > teamAverageScore ? "Above Average" : "Below Average"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Since */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-muted">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Member Since</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(student.joinedAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
