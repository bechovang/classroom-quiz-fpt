"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useRef } from "react"
import type { Student, ClassData, Quiz, QuizAnswer, QuizStats } from "@/types/classroom"
import { supabase } from "@/lib/supabaseClient"
import {
  addStudentToSession,
  addStudentsBulk as supaAddStudentsBulk,
  createClassSession,
  fetchStudents,
  listClassSessions,
  submitAnswer as supaSubmitAnswer,
  subscribeToQuizStats,
  subscribeToQuizLock,
  openQuizForEveryone as supaOpenQuizForEveryone,
  lockCurrentQuiz as supaLockCurrentQuiz,
  gradeQuizAndAwardPoints as supaGradeQuizAndAwardPoints,
  clearAnswers as supaClearAnswers,
  resetAllScores as supaResetAllScores,
  updateStudentScore as supaUpdateStudentScore,
  type SupabaseClassSession,
  type SupabaseStudent,
} from "@/lib/supabaseApi"

interface ClassroomState {
  currentClass: ClassData | null
  classes: ClassData[]
  isLoading: boolean
  error: string | null
}

type ClassroomAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOAD_CLASSES"; payload: ClassData[] }
  | { type: "SET_CURRENT_CLASS"; payload: ClassData }
  | { type: "SET_QUIZ_STATS"; payload: { classId: string; stats: QuizStats | null } }
  | { type: "SET_QUIZ_LOCK"; payload: { classId: string; isLocked: boolean } }
  | { type: "SET_QUESTION_POINTS"; payload: { classId: string; points: number[] } }
  | { type: "SET_CURRENT_QUESTION"; payload: { classId: string; index: number } }
  | { type: "SET_WRONG_POINTS"; payload: { classId: string; points: number[] } }
  | { type: "SET_BLOCKED_STUDENT"; payload: { classId: string; studentId: string | null } }
  | { type: "ADD_CLASS"; payload: ClassData }
  | { type: "ADD_STUDENT"; payload: { classId: string; student: Student } }
  | { type: "UPDATE_STUDENT"; payload: { classId: string; student: Student } }
  | { type: "REMOVE_STUDENT"; payload: { classId: string; studentId: string } }
  | { type: "CALL_STUDENT"; payload: { classId: string; studentId: string } }
  | { type: "SHUFFLE_QUEUE"; payload: { classId: string } }
  | { type: "RESET_QUEUE"; payload: { classId: string } }
  | { type: "CREATE_QUIZ"; payload: { classId: string; quiz: Quiz } }
  | { type: "SUBMIT_ANSWER"; payload: { classId: string; answer: QuizAnswer } }
  | { type: "SET_CORRECT_ANSWER"; payload: { classId: string; correctAnswer: "A" | "B" | "C" | "D" } }
  | { type: "END_QUIZ"; payload: { classId: string } }

const initialState: ClassroomState = {
  currentClass: null,
  classes: [],
  isLoading: false,
  error: null,
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const classroomReducer = (state: ClassroomState, action: ClassroomAction): ClassroomState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "SET_ERROR":
      return { ...state, error: action.payload }

    case "LOAD_CLASSES":
      return { ...state, classes: action.payload }

    case "SET_CURRENT_CLASS":
      return { ...state, currentClass: action.payload }

    case "SET_QUIZ_STATS": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId ? { ...cls, quizStats: action.payload.stats || undefined, updatedAt: Date.now() } : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? { ...state.currentClass, quizStats: action.payload.stats || undefined, updatedAt: Date.now() }
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "SET_QUIZ_LOCK": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId ? { ...cls, isQuizLocked: action.payload.isLocked, updatedAt: Date.now() } : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? { ...state.currentClass, isQuizLocked: action.payload.isLocked, updatedAt: Date.now() }
          : state.currentClass

      return { ...state, classes: updatedClasses, currentClass: updatedCurrentClass }
    }

    case "SET_QUESTION_POINTS": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId ? { ...cls, questionPoints: action.payload.points, updatedAt: Date.now() } : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? { ...state.currentClass, questionPoints: action.payload.points, updatedAt: Date.now() }
          : state.currentClass
      return { ...state, classes: updatedClasses, currentClass: updatedCurrentClass }
    }

    case "SET_CURRENT_QUESTION": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? { ...cls, currentQuestionIndex: action.payload.index, updatedAt: Date.now() }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? { ...state.currentClass, currentQuestionIndex: action.payload.index, updatedAt: Date.now() }
          : state.currentClass
      return { ...state, classes: updatedClasses, currentClass: updatedCurrentClass }
    }

    case "SET_WRONG_POINTS": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? { ...cls, wrongPoints: action.payload.points, updatedAt: Date.now() }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? { ...state.currentClass, wrongPoints: action.payload.points, updatedAt: Date.now() }
          : state.currentClass
      return { ...state, classes: updatedClasses, currentClass: updatedCurrentClass }
    }

    case "SET_BLOCKED_STUDENT": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? { ...cls, blockedStudentId: action.payload.studentId, updatedAt: Date.now() }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? { ...state.currentClass, blockedStudentId: action.payload.studentId, updatedAt: Date.now() }
          : state.currentClass
      return { ...state, classes: updatedClasses, currentClass: updatedCurrentClass }
    }

    case "ADD_CLASS": {
      return {
        ...state,
        classes: [...state.classes, action.payload],
      }
    }

    case "ADD_STUDENT": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? { ...cls, students: [...cls.students, action.payload.student], updatedAt: Date.now() }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? {
              ...state.currentClass,
              students: [...state.currentClass.students, action.payload.student],
              updatedAt: Date.now(),
            }
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "CALL_STUDENT": {
      const updatedClasses = state.classes.map((cls) => {
        if (cls.id === action.payload.classId) {
          const updatedStudents = cls.students.map((student) =>
            student.id === action.payload.studentId ? { ...student, isCalled: true } : student,
          )
          return {
            ...cls,
            students: updatedStudents,
            calledStudents: [...cls.calledStudents, action.payload.studentId],
            updatedAt: Date.now(),
          }
        }
        return cls
      })

      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "SHUFFLE_QUEUE": {
      const updatedClasses = state.classes.map((cls) => {
        if (cls.id === action.payload.classId) {
          const availableStudents = cls.students.filter((student) => !student.isCalled).map((student) => student.id)
          const shuffledQueue = shuffleArray(availableStudents)

          return {
            ...cls,
            randomQueue: shuffledQueue,
            updatedAt: Date.now(),
          }
        }
        return cls
      })

      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "RESET_QUEUE": {
      const updatedClasses = state.classes.map((cls) => {
        if (cls.id === action.payload.classId) {
          const resetStudents = cls.students.map((student) => ({ ...student, isCalled: false }))
          const allStudentIds = resetStudents.map((student) => student.id)
          const shuffledQueue = shuffleArray(allStudentIds)

          return {
            ...cls,
            students: resetStudents,
            randomQueue: shuffledQueue,
            calledStudents: [],
            updatedAt: Date.now(),
          }
        }
        return cls
      })

      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "UPDATE_STUDENT": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? {
              ...cls,
              students: cls.students.map((student) =>
                student.id === action.payload.student.id ? action.payload.student : student,
              ),
              updatedAt: Date.now(),
            }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "REMOVE_STUDENT": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? {
              ...cls,
              students: cls.students.filter((student) => student.id !== action.payload.studentId),
              randomQueue: cls.randomQueue.filter((id) => id !== action.payload.studentId),
              calledStudents: cls.calledStudents.filter((id) => id !== action.payload.studentId),
              updatedAt: Date.now(),
            }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "CREATE_QUIZ": {
      const updatedClasses = state.classes.map((cls) =>
        cls.id === action.payload.classId
          ? {
              ...cls,
              currentQuiz: action.payload.quiz,
              updatedAt: Date.now(),
            }
          : cls,
      )
      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "SUBMIT_ANSWER": {
      const updatedClasses = state.classes.map((cls) => {
        if (cls.id === action.payload.classId && cls.currentQuiz) {
          const filteredAnswers = cls.currentQuiz.answers.filter(
            (ans) => ans.studentId !== action.payload.answer.studentId,
          )

          return {
            ...cls,
            currentQuiz: {
              ...cls.currentQuiz,
              answers: [...filteredAnswers, action.payload.answer],
            },
            updatedAt: Date.now(),
          }
        }
        return cls
      })

      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "SET_CORRECT_ANSWER": {
      const updatedClasses = state.classes.map((cls) => {
        if (cls.id === action.payload.classId && cls.currentQuiz) {
          const correctStudentIds = cls.currentQuiz.answers
            .filter((ans) => ans.answer === action.payload.correctAnswer)
            .map((ans) => ans.studentId)

          const updatedStudents = cls.students.map((student) =>
            correctStudentIds.includes(student.id) ? { ...student, score: student.score + 10 } : student,
          )

          return {
            ...cls,
            students: updatedStudents,
            currentQuiz: {
              ...cls.currentQuiz,
              correctAnswer: action.payload.correctAnswer,
            },
            updatedAt: Date.now(),
          }
        }
        return cls
      })

      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    case "END_QUIZ": {
      const updatedClasses = state.classes.map((cls) => {
        if (cls.id === action.payload.classId && cls.currentQuiz) {
          return {
            ...cls,
            currentQuiz: undefined,
            quizHistory: [...cls.quizHistory, { ...cls.currentQuiz, isActive: false }],
            updatedAt: Date.now(),
          }
        }
        return cls
      })

      const updatedCurrentClass =
        state.currentClass?.id === action.payload.classId
          ? updatedClasses.find((cls) => cls.id === action.payload.classId) || state.currentClass
          : state.currentClass

      return {
        ...state,
        classes: updatedClasses,
        currentClass: updatedCurrentClass,
      }
    }

    default:
      return state
  }
}

const ClassroomContext = createContext<{
  state: ClassroomState
  dispatch: React.Dispatch<ClassroomAction>
  // Helper functions
  addClass: (name: string) => void
  addStudent: (classId: string, name: string, studentId: string) => void
  addStudentsBulk: (classId: string, students: { name: string; studentId: string }[]) => void
  selectClass: (classId: string) => Promise<void>
  selectClassForStudent: (classId: string) => Promise<void>
  renameClass: (classId: string, newName: string) => void
  deleteClass: (classId: string) => Promise<void>
  updateStudent: (classId: string, student: Student) => Promise<void>
  deleteStudent: (classId: string, studentId: string) => Promise<void>
  callRandomStudent: (classId: string) => Student | null
  shuffleQueue: (classId: string) => void
  resetQueue: (classId: string) => void
  createQuiz: (classId: string, question: string, options: { A: string; B: string; C: string; D: string }) => void
  submitAnswer: (classId: string, studentId: string, studentName: string, answer: "A" | "B" | "C" | "D") => void
  clearMyAnswer: (classId: string, studentId: string) => Promise<void>
  awardPoints: (classId: string, studentId: string, points: number, description?: string) => void
  updateStudentScore: (classId: string, studentId: string, newScore: number) => void
  adjustScoreByStudentCode: (classId: string, studentCode: string, delta: number) => Promise<void>
  setCorrectAnswer: (classId: string, correctAnswer: "A" | "B" | "C" | "D") => void
  endQuiz: (classId: string, correctAnswer: "A" | "B" | "C" | "D") => void
  openQuizForEveryone: (classId: string, excludedStudentId?: string) => Promise<void>
  lockQuiz: (classId: string) => Promise<void>
  setQuestionPoints: (classId: string, points: number[]) => void
  setCurrentQuestionIndex: (classId: string, index: number) => void
  setWrongPoints: (classId: string, points: number[]) => void
  clearAnswers: (classId: string) => Promise<void>
  resetAllScores: (classId: string) => Promise<void>
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
} | null>(null)

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(classroomReducer, initialState)

  const quizStatsUnsubRef = useRef<null | (() => void)>(null)
  const studentsUnsubRef = useRef<null | (() => void)>(null)
  const quizLockUnsubRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  useEffect(() => {
    if (state.classes.length > 0) {
      saveToLocalStorage()
    }
  }, [state.classes, state.currentClass])

  // Subscribe to realtime quiz_stats for current class
  useEffect(() => {
    if (quizStatsUnsubRef.current) {
      quizStatsUnsubRef.current()
      quizStatsUnsubRef.current = null
    }
    if (quizLockUnsubRef.current) {
      quizLockUnsubRef.current()
      quizLockUnsubRef.current = null
    }
    if (studentsUnsubRef.current) {
      studentsUnsubRef.current()
      studentsUnsubRef.current = null
    }

    const currentId = state.currentClass?.id
    if (!currentId) return

    const unsub = subscribeToQuizStats(currentId, (stats) => {
      dispatch({ type: "SET_QUIZ_STATS", payload: { classId: currentId, stats } })
    })
    quizStatsUnsubRef.current = unsub

    const unsubLock = subscribeToQuizLock(
      currentId,
      (isLocked) => {
        dispatch({ type: "SET_QUIZ_LOCK", payload: { classId: currentId, isLocked } })
      },
      (blockedId) => {
        dispatch({ type: "SET_BLOCKED_STUDENT", payload: { classId: currentId, studentId: blockedId } })
      },
    )
    quizLockUnsubRef.current = unsubLock

    // Subscribe to students changes for current class
    const channel = supabase
      .channel(`students_${currentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "students", filter: `class_session_id=eq.${currentId}` },
        (payload) => {
          const s = payload.new as SupabaseStudent
          const mapped = mapStudent(s)
          dispatch({ type: "ADD_STUDENT", payload: { classId: currentId, student: mapped } })
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "students", filter: `class_session_id=eq.${currentId}` },
        (payload) => {
          const s = payload.new as SupabaseStudent
          const mapped = mapStudent(s)
          dispatch({ type: "UPDATE_STUDENT", payload: { classId: currentId, student: mapped } })
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "students", filter: `class_session_id=eq.${currentId}` },
        (payload) => {
          const s = payload.old as SupabaseStudent
          dispatch({ type: "REMOVE_STUDENT", payload: { classId: currentId, studentId: s.id } })
        },
      )
      .subscribe()
    studentsUnsubRef.current = () => supabase.removeChannel(channel)

    return () => {
      if (quizStatsUnsubRef.current) {
        quizStatsUnsubRef.current()
        quizStatsUnsubRef.current = null
      }
      if (quizLockUnsubRef.current) {
        quizLockUnsubRef.current()
        quizLockUnsubRef.current = null
      }
      if (studentsUnsubRef.current) {
        studentsUnsubRef.current()
        studentsUnsubRef.current = null
      }
    }
  }, [state.currentClass?.id])

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(
        "classroom_selection",
        JSON.stringify({
          currentClassId: state.currentClass?.id || null,
        }),
      )
    } catch (error) {
      console.error("Failed to save selection:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to save selection" })
    }
  }

  const loadFromLocalStorage = async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      // Load teacher's existing sessions
      const sessions = await listClassSessions()
      const mappedClasses: ClassData[] = sessions.map(mapSessionToClassData)
      dispatch({ type: "LOAD_CLASSES", payload: mappedClasses })

      // Restore current selection
      const saved = localStorage.getItem("classroom_selection")
      const currentClassId = saved ? JSON.parse(saved)?.currentClassId : undefined
      let selected = mappedClasses[0]
      if (currentClassId) {
        const found = mappedClasses.find((c) => c.id === currentClassId)
        if (found) selected = found
      }

      if (selected) {
        // Attach students
        const students = await fetchStudents(selected.id)
        const mappedStudents = students.map(mapStudent)
        const withStudents: ClassData = { ...selected, students: mappedStudents, updatedAt: Date.now() }
        const newClasses = mappedClasses.map((c) => (c.id === withStudents.id ? withStudents : c))
        dispatch({ type: "LOAD_CLASSES", payload: newClasses })
        dispatch({ type: "SET_CURRENT_CLASS", payload: withStudents })
      }
    } catch (error) {
      console.error("Failed to initialize from Supabase:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load data" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const selectClass = async (classId: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const base = state.classes.find((c) => c.id === classId)
      if (!base) return
      const students = await fetchStudents(classId)
      const mappedStudents = students.map(mapStudent)
      const withStudents: ClassData = { ...base, students: mappedStudents, updatedAt: Date.now() }
      const newClasses = state.classes.map((c) => (c.id === withStudents.id ? withStudents : c))
      dispatch({ type: "LOAD_CLASSES", payload: newClasses })
      dispatch({ type: "SET_CURRENT_CLASS", payload: withStudents })
      saveToLocalStorage()
    } catch (error) {
      console.error("Failed to select class:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to switch class" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  // Lightweight selector for student mode: load one class by id and subscribe
  const selectClassForStudent = async (classId: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const base = state.classes.find((c) => c.id === classId)
      let sessionBase: ClassData | undefined = base
      if (!sessionBase) {
        const session = await import("@/lib/supabaseApi").then((m) => m.getClassSessionById(classId))
        if (session) {
          sessionBase = mapSessionToClassData(session)
          dispatch({ type: "ADD_CLASS", payload: sessionBase })
        }
      }
      if (!sessionBase) return

      const students = await fetchStudents(classId)
      const mappedStudents = students.map(mapStudent)
      const withStudents: ClassData = { ...sessionBase, students: mappedStudents, updatedAt: Date.now() }
      const newClasses = (state.classes.find((c) => c.id === withStudents.id)
        ? state.classes.map((c) => (c.id === withStudents.id ? withStudents : c))
        : [...state.classes, withStudents])
      dispatch({ type: "LOAD_CLASSES", payload: newClasses })
      dispatch({ type: "SET_CURRENT_CLASS", payload: withStudents })
    } catch (error) {
      console.error("Failed to load class for student:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load class" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const addClass = async (name: string) => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const session = await createClassSession()
      const newClass: ClassData = {
        id: session.id,
        name: name.trim() || `Class ${session.class_code}`,
        classCode: session.class_code,
        students: [],
        randomQueue: [],
        calledStudents: [],
        quizHistory: [],
        activities: [],
        createdAt: new Date(session.created_at).getTime(),
        updatedAt: Date.now(),
      }
      dispatch({ type: "ADD_CLASS", payload: newClass })
      dispatch({ type: "SET_CURRENT_CLASS", payload: newClass })
      saveToLocalStorage()
    } catch (error) {
      console.error("Failed to create class:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to create class" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const addStudent = async (classId: string, name: string, studentId: string) => {
    try {
      const created = await addStudentToSession(classId, name.trim(), studentId.trim())
      const mapped = mapStudent(created)
      dispatch({ type: "ADD_STUDENT", payload: { classId, student: mapped } })
    } catch (error) {
      console.error("Failed to add student:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to add student" })
    }
  }

  const addStudentsBulk = async (classId: string, students: { name: string; studentId: string }[]) => {
    try {
      const created = await supaAddStudentsBulk(
        classId,
        students.map((s) => ({ name: s.name.trim(), code: s.studentId.trim() })),
      )
      created.map(mapStudent).forEach((student) => {
        dispatch({ type: "ADD_STUDENT", payload: { classId, student } })
      })
    } catch (error) {
      console.error("Failed to import students:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to import students" })
    }
  }

  const renameClass = (classId: string, newName: string) => {
    const updatedClasses = state.classes.map((c) => (c.id === classId ? { ...c, name: newName, updatedAt: Date.now() } : c))
    dispatch({ type: "LOAD_CLASSES", payload: updatedClasses })
    const current = updatedClasses.find((c) => c.id === state.currentClass?.id)
    if (current) dispatch({ type: "SET_CURRENT_CLASS", payload: current })
  }

  const deleteClass = async (classId: string) => {
    try {
      await import("@/lib/supabaseApi").then((m) => m.deleteClassSession(classId))
      const remaining = state.classes.filter((c) => c.id !== classId)
      dispatch({ type: "LOAD_CLASSES", payload: remaining })
      if (state.currentClass?.id === classId) {
        dispatch({ type: "SET_CURRENT_CLASS", payload: remaining[0] || null as any })
      }
      saveToLocalStorage()
    } catch (error) {
      console.error("Failed to delete class:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete class" })
    }
  }

  const updateStudent = async (classId: string, student: Student) => {
    try {
      const updated = await import("@/lib/supabaseApi").then((m) =>
        m.updateStudent(classId, student.id, {
          student_name: student.name,
          student_code: student.studentId,
          score: student.score,
        }),
      )
      const mapped = mapStudent(updated)
      dispatch({ type: "UPDATE_STUDENT", payload: { classId, student: mapped } })
    } catch (error) {
      console.error("Failed to update student:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update student" })
    }
  }

  const deleteStudent = async (classId: string, studentId: string) => {
    try {
      await import("@/lib/supabaseApi").then((m) => m.deleteStudent(classId, studentId))
      dispatch({ type: "REMOVE_STUDENT", payload: { classId, studentId } })
    } catch (error) {
      console.error("Failed to delete student:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to delete student" })
    }
  }

  const callRandomStudent = (classId: string): Student | null => {
    const currentClass = state.classes.find((cls) => cls.id === classId)
    if (!currentClass) return null

    // Prefer available students (not yet called)
    const available = currentClass.students.filter((s) => !s.isCalled)
    if (available.length === 0) return null

    const picked = available[Math.floor(Math.random() * available.length)]
    dispatch({ type: "CALL_STUDENT", payload: { classId, studentId: picked.id } })
    return picked
  }

  const shuffleQueue = (classId: string) => {
    dispatch({ type: "SHUFFLE_QUEUE", payload: { classId } })
  }

  const resetQueue = (classId: string) => {
    dispatch({ type: "RESET_QUEUE", payload: { classId } })
  }

  const createQuiz = (classId: string, question: string, options: { A: string; B: string; C: string; D: string }) => {
    const quiz: Quiz = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question,
      options,
      answers: [],
      isActive: true,
      createdAt: Date.now(),
      qrCode: `${window.location.origin}/student?quiz=${Date.now()}&class=${classId}`,
    }

    dispatch({ type: "CREATE_QUIZ", payload: { classId, quiz } })
  }

  const submitAnswer = async (
    classId: string,
    studentId: string,
    studentName: string,
    answer: "A" | "B" | "C" | "D",
  ) => {
    try {
      if (state.currentClass?.id === classId && state.currentClass?.isQuizLocked) {
        throw new Error("Quiz is locked")
      }
      await supaSubmitAnswer(classId, studentId, answer)
      const quizAnswer: QuizAnswer = { studentId, studentName, answer, timestamp: Date.now() }
      dispatch({ type: "SUBMIT_ANSWER", payload: { classId, answer: quizAnswer } })
    } catch (error) {
      console.error("Failed to submit answer:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to submit answer" })
    }
  }

  const clearMyAnswer = async (classId: string, studentId: string) => {
    try {
      await import("@/lib/supabaseApi").then((m) => m.clearStudentAnswer(classId, studentId))
      // Optimistic local removal from currentQuiz answers if present
      const current = state.currentClass
      if (current?.id === classId && current.currentQuiz) {
        const filtered = current.currentQuiz.answers.filter((a) => a.studentId !== studentId)
        const updatedClass = {
          ...current,
          currentQuiz: { ...current.currentQuiz, answers: filtered },
          updatedAt: Date.now(),
        }
        const classes = state.classes.map((c) => (c.id === classId ? updatedClass : c))
        dispatch({ type: "LOAD_CLASSES", payload: classes })
        dispatch({ type: "SET_CURRENT_CLASS", payload: updatedClass })
      }
    } catch (error) {
      console.error("Failed to clear answer:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to clear answer" })
    }
  }

  const awardPoints = async (
    classId: string,
    studentId: string,
    points: number,
    _description?: string,
  ) => {
    try {
      const current = state.classes
        .find((c) => c.id === classId)?.students.find((s) => s.id === studentId)?.score || 0
      await supaUpdateStudentScore(classId, studentId, current + points)
      const updated: Student = {
        ...(state.classes.find((c) => c.id === classId)?.students.find((s) => s.id === studentId) as Student),
        score: current + points,
      }
      dispatch({ type: "UPDATE_STUDENT", payload: { classId, student: updated } })
    } catch (error) {
      console.error("Failed to award points:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to award points" })
    }
  }

  const updateStudentScore = async (classId: string, studentId: string, newScore: number) => {
    try {
      await supaUpdateStudentScore(classId, studentId, newScore)
      const target = state.classes
        .find((c) => c.id === classId)?.students.find((s) => s.id === studentId) as Student
      const updated: Student = { ...target, score: newScore }
      dispatch({ type: "UPDATE_STUDENT", payload: { classId, student: updated } })
    } catch (error) {
      console.error("Failed to update score:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to update score" })
    }
  }

  const adjustScoreByStudentCode = async (classId: string, studentCode: string, delta: number) => {
    try {
      const updated = await import("@/lib/supabaseApi").then((m) => m.adjustScoreByStudentCode(classId, studentCode, delta))
      if (!updated) return
      const mapped = mapStudent(updated as unknown as SupabaseStudent)
      dispatch({ type: "UPDATE_STUDENT", payload: { classId, student: mapped } })
    } catch (error) {
      console.error("Failed to adjust score by student code:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to adjust score" })
    }
  }

  const setCorrectAnswer = (classId: string, correctAnswer: "A" | "B" | "C" | "D") => {
    dispatch({ type: "SET_CORRECT_ANSWER", payload: { classId, correctAnswer } })
  }

  const endQuiz = (classId: string, correctAnswer: "A" | "B" | "C" | "D") => {
    // Grade and lock via Supabase
    const current = state.classes.find((c) => c.id === classId)
    const currentIndex = current?.currentQuestionIndex ?? 0
    const pointsCorrect = current?.questionPoints?.[currentIndex] ?? 10
    const pointsWrong = current?.wrongPoints?.[currentIndex] ?? 0
    // Penalize all students who chose incorrectly (called student likely already penalized on Wrong click)
    ;(async () => {
      try {
        // Try all-in-one RPC first
        try {
          await import("@/lib/supabaseApi").then((m) => m.gradeFullQuiz(classId, correctAnswer, pointsCorrect, pointsWrong))
        } catch (rpcErr) {
          // Fallback to legacy flow
          await supaGradeQuizAndAwardPoints(classId, correctAnswer, pointsCorrect)
          if (current?.currentQuiz) {
            const wrongIds = new Set(
              current.currentQuiz.answers
                .filter((a) => a.answer !== correctAnswer)
                .map((a) => a.studentId),
            )
            const wrongDelta = pointsWrong
            if (wrongDelta !== 0) {
              await Promise.all(
                current.students
                  .filter((s) => wrongIds.has(s.id))
                  .map(async (s) => {
                    const newScore = s.score + wrongDelta
                    await supaUpdateStudentScore(classId, s.id, newScore)
                    const updated: Student = { ...s, score: newScore }
                    dispatch({ type: "UPDATE_STUDENT", payload: { classId, student: updated } })
                  }),
              )
            }
          }
        }
        await supaLockCurrentQuiz(classId)
      } catch (e) {
        console.error("Failed to end quiz (grade/lock):", e)
      } finally {
        dispatch({ type: "END_QUIZ", payload: { classId } })
        // Advance to next question index if configured
        const nextIndex = (currentIndex || 0) + 1
        if (state.currentClass?.id === classId) {
          dispatch({ type: "SET_CURRENT_QUESTION", payload: { classId, index: nextIndex } })
        }
      }
    })()
  }

  const openQuizForEveryone = async (classId: string, excludedStudentId?: string) => {
    try {
      await supaOpenQuizForEveryone(classId, excludedStudentId)
    } catch (error) {
      console.error("Failed to open quiz for everyone:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to open quiz" })
    }
  }

  const lockQuiz = async (classId: string) => {
    try {
      await supaLockCurrentQuiz(classId)
    } catch (error) {
      console.error("Failed to lock quiz:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to lock quiz" })
    }
  }

  const setQuestionPoints = (classId: string, points: number[]) => {
    dispatch({ type: "SET_QUESTION_POINTS", payload: { classId, points } })
  }

  const setCurrentQuestionIndex = (classId: string, index: number) => {
    dispatch({ type: "SET_CURRENT_QUESTION", payload: { classId, index } })
  }

  const setWrongPoints = (classId: string, points: number[]) => {
    dispatch({ type: "SET_WRONG_POINTS", payload: { classId, points } })
  }

  const clearAnswers = async (classId: string) => {
    try {
      await supaClearAnswers(classId)
    } catch (error) {
      console.error("Failed to clear answers:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to clear answers" })
    }
  }

  const resetAllScores = async (classId: string) => {
    try {
      await supaResetAllScores(classId)
    } catch (error) {
      console.error("Failed to reset scores:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to reset scores" })
    }
  }

  return (
    <ClassroomContext.Provider
      value={{
        state,
        dispatch,
        openQuizForEveryone,
        lockQuiz,
        setQuestionPoints,
        setCurrentQuestionIndex,
        setWrongPoints,
        addClass,
        addStudent,
        addStudentsBulk,
        renameClass,
        deleteClass,
        updateStudent,
        deleteStudent,
        selectClass,
        selectClassForStudent,
        callRandomStudent,
        shuffleQueue,
        resetQueue,
        createQuiz,
        submitAnswer,
        awardPoints,
        clearMyAnswer,
        updateStudentScore,
        adjustScoreByStudentCode,
        setCorrectAnswer,
        endQuiz,
        saveToLocalStorage,
        loadFromLocalStorage,
        clearAnswers,
        resetAllScores,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  )
}

export const useClassroom = () => {
  const context = useContext(ClassroomContext)
  if (!context) {
    throw new Error("useClassroom must be used within a ClassroomProvider")
  }
  return context
}

function mapSessionToClassData(session: SupabaseClassSession): ClassData {
  return {
    id: session.id,
    name: `Class ${session.class_code}`,
    classCode: session.class_code,
    students: [],
    randomQueue: [],
    calledStudents: [],
    quizHistory: [],
    activities: [],
    quizStats: (session.quiz_stats as QuizStats) || undefined,
    isQuizLocked: !!session.is_quiz_locked,
    blockedStudentId: (session as any).blocked_student_id ?? null,
    createdAt: new Date(session.created_at).getTime(),
    updatedAt: Date.now(),
  }
}

function mapStudent(s: SupabaseStudent): Student {
  return {
    id: s.id,
    name: s.student_name,
    studentId: s.student_code || "",
    isCalled: false,
    joinedAt: new Date(s.created_at).getTime(),
    score: s.score,
  }
}

// end of file
