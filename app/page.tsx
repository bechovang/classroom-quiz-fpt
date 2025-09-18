"use client"

import { useAuth } from "@/contexts/auth-context"
import { useClassroom } from "@/contexts/classroom-context"
import { AuthGuard } from "@/components/auth/auth-guard"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, BookOpen } from "lucide-react"
import Link from "next/link"

function HomePage() {
  const { state: authState } = useAuth()
  const { state } = useClassroom()

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Student redirection is handled centrally in AuthGuard. Avoid duplicate redirects here.

  // Show role selection if no class is available for teachers
  if (!state.currentClass && authState.user?.role === "teacher") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-9 h-9 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-foreground">ClassroomPro</h1>
                  <p className="text-muted-foreground">Smart Classroom Management</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Welcome back, {authState.user?.name}! Ready to manage your classroom?
              </p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border-2 hover:border-primary/30">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Teacher Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Manage students, create random picks, award points, and track class activities
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Student management & scoring</li>
                    <li>• Random name picker with animations</li>
                    <li>• QR code generation & validation</li>
                    <li>• Real-time activity tracking</li>
                  </ul>
                  <Button className="w-full" size="lg">
                    Continue as Teacher
                  </Button>
                </CardContent>
              </Card>

              <Link href="/student">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border-2 hover:border-secondary/30">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                      <Users className="w-6 h-6 text-secondary" />
                    </div>
                    <CardTitle className="text-xl">Student Portal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      View profiles, scan QR codes, track progress and see activity history
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Personal dashboard & stats</li>
                      <li>• QR code scanner for points</li>
                      <li>• Activity history & achievements</li>
                      <li>• Team rankings & progress</li>
                    </ul>
                    <Button variant="outline" className="w-full bg-transparent" size="lg">
                      Visit Student Portal
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Features */}
            <div className="pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Features</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Random Name Picker",
                  "QR Code System",
                  "Team Management",
                  "Real-time Scoring",
                  "Activity Tracking",
                  "Mobile Responsive",
                  "Data Persistence",
                  "Gamification",
                ].map((feature) => (
                  <span key={feature} className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm border">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <TeacherDashboard />
}

export default function Page() {
  return (
    <AuthGuard requiredRole="teacher">
      <HomePage />
    </AuthGuard>
  )
}
