"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GraduationCap, LogOut, User, Moon, Sun } from "lucide-react"
import { useState } from "react"

export function DashboardHeader() {
  const { state } = useClassroom()
  const { state: authState, logout } = useAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = () => {
    logout()
    // Force redirect to login page after logout
    window.location.href = '/'
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left - App Title & Class Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ClassroomPro</h1>
            </div>
          </div>

          {state.currentClass && (
            <>
              <div className="w-px h-6 bg-border" />
              <div>
                <h2 className="text-sm font-medium text-foreground">{state.currentClass.name}</h2>
                <p className="text-xs text-muted-foreground">{state.currentClass.students.length} students</p>
              </div>
            </>
          )}
        </div>

        {/* Right - User Profile & Actions */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="w-9 h-9 p-0">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {authState.user?.name.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{authState.user?.name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">{authState.user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{authState.user?.role}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
