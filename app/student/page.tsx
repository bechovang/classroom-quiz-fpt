"use client"

import { useAuth } from "@/contexts/auth-context"
import { useClassroom } from "@/contexts/classroom-context"
import { AuthGuard } from "@/components/auth/auth-guard"
import { StudentDashboard } from "@/components/student-dashboard"
import { StudentSelector } from "@/components/student-selector"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useState } from "react"

function StudentPage() {
  const { state: authState } = useAuth()
  const { state } = useClassroom()
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Student pages are now accessible without authentication

  if (!selectedStudentId) {
    return <StudentSelector onStudentSelect={setSelectedStudentId} />
  }

  return <StudentDashboard studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />
}

export default function Page() {
  return (
    <AuthGuard>
      <StudentPage />
    </AuthGuard>
  )
}
