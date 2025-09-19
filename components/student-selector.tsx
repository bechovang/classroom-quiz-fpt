"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GraduationCap, Trophy, Users, ArrowRight, Search, Home, LogOut } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Activity } from "@/types/classroom"

interface StudentSelectorProps {
  onStudentSelect: (studentId: string) => void
}

export function StudentSelector({ onStudentSelect }: StudentSelectorProps) {
  const { state, selectClass } = useClassroom()
  const { redirectToLogin } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  if (!state || !state.currentClass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Class Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Please contact your teacher to join a class.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const students = state.currentClass.students || []
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = a?.name || ""
    const nameB = b?.name || ""
    return nameA.localeCompare(nameB)
  })

  const filteredStudents = sortedStudents.filter(
    (student) =>
      (student?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (student?.studentId?.toLowerCase() || "").includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-8">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={redirectToLogin}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Trang chủ</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redirectToLogin}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">ClassroomPro</h1>
                <p className="text-muted-foreground">Student Portal</p>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">{state.currentClass.name || "Unknown Class"}</h2>
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{students.length} students</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span>{(state.currentClass.activities || []).length} activities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Selection */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Select Your Profile</h3>
            <p className="text-muted-foreground">Choose your name to access your student dashboard</p>
          </div>

          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã số sinh viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 border-2 hover:border-primary/30"
                onClick={() => onStudentSelect(student.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xl font-bold">
                        {(student.name || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {student.name || "Unknown"}
                      </h4>

                      <p className="text-sm text-muted-foreground mt-1">{student.studentId || "No ID"}</p>

                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className="bg-accent/10 text-accent border-accent/20">
                          <Trophy className="w-3 h-3 mr-1" />
                          {student.score || 0} pts
                        </Badge>

                        {student.isCalled && (
                          <Badge variant="secondary" className="text-xs">
                            Called
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-end mt-3">
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStudents.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">Không tìm thấy sinh viên</h3>
              <p className="text-muted-foreground">Thử tìm kiếm với từ khóa khác.</p>
            </div>
          )}

          {filteredStudents.length === 0 && !searchQuery && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Students Yet</h3>
              <p className="text-muted-foreground">Ask your teacher to add students to the class.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
