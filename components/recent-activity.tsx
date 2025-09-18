"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { Trophy, Users, QrCode, Plus } from "lucide-react"

export function RecentActivity() {
  const { state } = useClassroom()

  if (!state.currentClass) return null

  const recentActivities = state.currentClass.activities.slice(-10).reverse()

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

  const getActivityColor = (type: string) => {
    switch (type) {
      case "manual_score":
        return "bg-accent/10 text-accent"
      case "team_assignment":
        return "bg-secondary/10 text-secondary"
      case "qr_scan":
        return "bg-primary/10 text-primary"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="space-y-3 p-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-1.5 rounded-full ${getActivityColor(activity.type)}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{activity.studentName}</p>
                        <Badge variant="secondary" className="text-xs">
                          +{activity.points}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.description || "Points awarded"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
