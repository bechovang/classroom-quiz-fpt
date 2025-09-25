"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const { login, state } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(loginData.username, loginData.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    }
  }

  const handleStudentAccess = () => {
    // Student access is now direct without authentication
    window.location.href = "/student"
  }

  // Removed demo fill button and handler

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ClassroomPro</h1>
              <p className="text-sm text-muted-foreground">Smart Classroom Management</p>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="border-2 border-primary/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Classroom Access</CardTitle>
            <CardDescription className="text-center">Choose your access method</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Teacher Login */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Teacher Login</h3>
                <p className="text-sm text-muted-foreground">Access with teacher credentials</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={state.isLoading}>
                  <LogIn className="w-4 h-4 mr-2" />
                  {state.isLoading ? "Signing in..." : "Teacher Login"}
                </Button>
              </form>

              
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Student Access */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Student Access</h3>
                <p className="text-sm text-muted-foreground">Enter as student (no login required)</p>
              </div>

              <Button 
                onClick={handleStudentAccess} 
                className="w-full" 
                size="lg" 
                variant="outline"
                disabled={state.isLoading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {state.isLoading ? "Accessing..." : "Enter as Student"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>ClassroomPro - Smart Classroom Management</p>
          <p>Teachers: Use credentials from .env | Students: No login required</p>
        </div>
      </div>
    </div>
  )
}
