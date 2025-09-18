"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "teacher"
  avatar?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType {
  state: AuthState
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  redirectToLogin: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("classroom_user")
        if (savedUser) {
          const user = JSON.parse(savedUser)
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error("Failed to load user:", error)
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    loadUser()
  }, [])

  const login = async (username: string, password: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check against .env credentials for teacher login
      const teacherUsername = process.env.NEXT_PUBLIC_TEACHER_USERNAME || "teacher1"
      const teacherPassword = process.env.NEXT_PUBLIC_TEACHER_PASSWORD || "123456"

      if (username === teacherUsername && password === teacherPassword) {
        const authenticatedUser: User = {
          id: "teacher_1",
          name: "Giáo viên",
          email: "teacher@school.edu.vn",
          role: "teacher",
        }

        // Save to localStorage
        localStorage.setItem("classroom_user", JSON.stringify(authenticatedUser))

        setState({
          user: authenticatedUser,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        throw new Error("Invalid username or password")
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  // Registration removed - only teacher login from .env is supported

  const logout = () => {
    localStorage.removeItem("classroom_user")
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  const redirectToLogin = () => {
    localStorage.removeItem("classroom_user")
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
    window.location.href = '/'
  }

  return <AuthContext.Provider value={{ state, login, logout, redirectToLogin }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
