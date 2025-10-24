export interface Student {
  id: string
  name: string
  studentId: string // mã số sinh viên
  isCalled: boolean
  joinedAt: number
  score: number // Adding score back for quiz system
}

export interface QuizAnswer {
  studentId: string
  studentName: string
  answer: "A" | "B" | "C" | "D"
  timestamp: number
}

export interface Quiz {
  id: string
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer?: "A" | "B" | "C" | "D"
  answers: QuizAnswer[]
  isActive: boolean
  createdAt: number
  qrCode?: string
  // Optional metadata when sourced from quiz bank
  explanation?: string
  tags?: string[]
  bankId?: string
}

export type QuizStats = {
  A: number
  B: number
  C: number
  D: number
  total: number
}

export interface Activity {
  id: string
  studentId: string
  type: string
  points: number
  description: string
  timestamp: string
}

export interface ClassData {
  id: string
  name: string
  students: Student[]
  randomQueue: string[] // student IDs in random order
  calledStudents: string[]
  currentQuiz?: Quiz // Adding current active quiz
  quizHistory: Quiz[] // Adding quiz history
  activities: Activity[] // Student activities
  createdAt: number
  updatedAt: number
  classCode?: string
  quizStats?: QuizStats
  isQuizLocked?: boolean
  questionPoints?: number[]
  currentQuestionIndex?: number
  blockedStudentId?: string | null
  wrongPoints?: number[]
}

export type ViewMode = "teacher" | "student"
