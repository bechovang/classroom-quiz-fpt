"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Users, QrCode, Plus, Calendar } from "lucide-react"
import type { Student, Activity } from "@/types/classroom"
import { formatDistanceToNow, format } from "date-fns"

interface StudentActivityHistoryProps {
  student: Student
  activities: Activity[]
}

export function StudentActivityHistory({ student, activities }: StudentActivityHistoryProps) {
  const studentActivities = activities
    .filter((activity) => activity.studentId === student.id)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20) // Show last 20 activities

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "manual_score":
        return Trophy
      case "team_assignment":
        return Users
      case "qr_scan":
        return QrCode
      default:
        return Plus
    }
  }

  const getActivityColor = (type: string, points: number) => {
    if (points > 0) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
    if (points < 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  }

  const getActivityDescription = (activity: Activity) => {
    switch (activity.type) {
      case "manual_score":
        return activity.description || "Points awarded by teacher"
      case "team_assignment":
        return activity.description || "Team assignment"
      case "qr_scan":
        return "QR code scanned successfully"
      case "random_call":
        return "Called in random picker"
      default:
        return activity.description || "Activity completed"
    }
  }

  const totalPointsEarned = studentActivities.reduce((sum, activity) => sum + Math.max(0, activity.points), 0)
  const totalPointsLost = studentActivities.reduce((sum, activity) => sum + Math.min(0, activity.points), 0)

  return (
    <div className="space-y-6">
      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Activity Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalPointsEarned}</div>
              <div className="text-sm text-muted-foreground">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{studentActivities.length}</div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </div>
          </div>
          {totalPointsLost < 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{totalPointsLost}</div>
              <div className="text-sm text-muted-foreground">Points Lost</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="space-y-1 p-4">
              {studentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No activities yet</p>
                  <p className="text-xs text-muted-foreground">Start participating to see your history here</p>
                </div>
              ) : (
                studentActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type, activity.points)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{getActivityDescription(activity)}</p>
                          {activity.points !== 0 && (
                            <Badge
                              className={
                                activity.points > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }
                            >
                              {activity.points > 0 ? "+" : ""}
                              {activity.points}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {format(activity.timestamp, "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
