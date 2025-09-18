"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "teacher" | "student"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { state } = useAuth()

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If teacher role is required but user is not authenticated, show login form
  if (requiredRole === "teacher" && !state.isAuthenticated) {
    return <LoginForm />
  }
  
  // Student pages don't require authentication - they're always accessible
  // If no role is required, allow access
  if (!requiredRole) {
    return <>{children}</>
  }

  return <>{children}</>
}
