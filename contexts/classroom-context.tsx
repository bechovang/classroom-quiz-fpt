"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Student, ClassData, Quiz, QuizAnswer } from "@/types/classroom"

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
  callRandomStudent: (classId: string) => Student | null
  shuffleQueue: (classId: string) => void
  resetQueue: (classId: string) => void
  createQuiz: (classId: string, question: string, options: { A: string; B: string; C: string; D: string }) => void
  submitAnswer: (classId: string, studentId: string, studentName: string, answer: "A" | "B" | "C" | "D") => void
  setCorrectAnswer: (classId: string, correctAnswer: "A" | "B" | "C" | "D") => void
  endQuiz: (classId: string) => void
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
} | null>(null)

export const ClassroomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(classroomReducer, initialState)

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  useEffect(() => {
    if (state.classes.length > 0) {
      saveToLocalStorage()
    }
  }, [state.classes, state.currentClass])

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(
        "classroom_data",
        JSON.stringify({
          classes: state.classes,
          currentClassId: state.currentClass?.id || null,
        }),
      )
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to save data" })
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("classroom_data")
      if (saved) {
        const data = JSON.parse(saved)
        dispatch({ type: "LOAD_CLASSES", payload: data.classes || [] })
        if (data.currentClassId) {
          const currentClass = data.classes?.find((cls: ClassData) => cls.id === data.currentClassId)
          if (currentClass) {
            dispatch({ type: "SET_CURRENT_CLASS", payload: currentClass })
          }
        }
      } else {
        const sampleClass: ClassData = {
          id: "class_demo",
          name: "Lớp 6A",
          students: [
            {
              id: "student_1",
              name: "Nguyễn Văn An",
              studentId: "SV001",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 85,
            },
            {
              id: "student_2",
              name: "Trần Thị Bình",
              studentId: "SV002",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 92,
            },
            {
              id: "student_3",
              name: "Lê Minh Cường",
              studentId: "SV003",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 78,
            },
            {
              id: "student_4",
              name: "Phạm Thị Dung",
              studentId: "SV004",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 96,
            },
            {
              id: "student_5",
              name: "Hoàng Văn Em",
              studentId: "SV005",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 73,
            },
            {
              id: "student_6",
              name: "Vũ Thị Hoa",
              studentId: "SV006",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 88,
            },
            {
              id: "student_7",
              name: "Đỗ Văn Khoa",
              studentId: "SV007",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 91,
            },
            {
              id: "student_8",
              name: "Bùi Thị Lan",
              studentId: "SV008",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 82,
            },
            {
              id: "student_9",
              name: "Ngô Văn Minh",
              studentId: "SV009",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 79,
            },
            {
              id: "student_10",
              name: "Lý Thị Nga",
              studentId: "SV010",
              isCalled: false,
              joinedAt: Date.now() - 86400000,
              score: 94,
            },
          ],
          randomQueue: [],
          calledStudents: [],
          quizHistory: [],
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now(),
        }

        const shuffledQueue = shuffleArray(sampleClass.students.map((s) => s.id))
        sampleClass.randomQueue = shuffledQueue

        dispatch({ type: "LOAD_CLASSES", payload: [sampleClass] })
        dispatch({ type: "SET_CURRENT_CLASS", payload: sampleClass })
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load data" })
    }
  }

  const addClass = (name: string) => {
    const newClass: ClassData = {
      id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      students: [],
      randomQueue: [],
      calledStudents: [],
      quizHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    dispatch({ type: "ADD_CLASS", payload: newClass })
  }

  const addStudent = (classId: string, name: string, studentId: string) => {
    const newStudent: Student = {
      id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      studentId: studentId.trim(),
      isCalled: false,
      joinedAt: Date.now(),
      score: 0,
    }

    dispatch({ type: "ADD_STUDENT", payload: { classId, student: newStudent } })
  }

  const addStudentsBulk = (classId: string, students: { name: string; studentId: string }[]) => {
    students.forEach(({ name, studentId }) => {
      const newStudent: Student = {
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        studentId: studentId.trim(),
        isCalled: false,
        joinedAt: Date.now(),
        score: 0,
      }

      dispatch({ type: "ADD_STUDENT", payload: { classId, student: newStudent } })
    })
  }

  const callRandomStudent = (classId: string): Student | null => {
    const currentClass = state.classes.find((cls) => cls.id === classId)
    if (!currentClass || currentClass.randomQueue.length === 0) return null

    const nextStudentId = currentClass.randomQueue[0]
    const student = currentClass.students.find((s) => s.id === nextStudentId)

    if (student) {
      dispatch({ type: "CALL_STUDENT", payload: { classId, studentId: nextStudentId } })
      return student
    }

    return null
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

  const submitAnswer = (classId: string, studentId: string, studentName: string, answer: "A" | "B" | "C" | "D") => {
    const quizAnswer: QuizAnswer = {
      studentId,
      studentName,
      answer,
      timestamp: Date.now(),
    }

    dispatch({ type: "SUBMIT_ANSWER", payload: { classId, answer: quizAnswer } })
  }

  const setCorrectAnswer = (classId: string, correctAnswer: "A" | "B" | "C" | "D") => {
    dispatch({ type: "SET_CORRECT_ANSWER", payload: { classId, correctAnswer } })
  }

  const endQuiz = (classId: string) => {
    dispatch({ type: "END_QUIZ", payload: { classId } })
  }

  return (
    <ClassroomContext.Provider
      value={{
        state,
        dispatch,
        addClass,
        addStudent,
        addStudentsBulk,
        callRandomStudent,
        shuffleQueue,
        resetQueue,
        createQuiz,
        submitAnswer,
        setCorrectAnswer,
        endQuiz,
        saveToLocalStorage,
        loadFromLocalStorage,
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
