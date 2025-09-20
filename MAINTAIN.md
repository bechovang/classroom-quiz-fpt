# ClassroomPro - Maintenance & Development Guide

This document provides comprehensive information for maintaining, developing, and extending the ClassroomPro application.

## 🏗️ Architecture Overview

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS v4 with custom design tokens
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React Context with useReducer
- **Data Persistence**: localStorage with JSON serialization
- **Authentication**: Custom auth system (Auth0 ready)
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **QR Codes**: qr-code-generator and qr-scanner libraries

### Core Architecture Patterns

#### 1. Context-Based State Management
\`\`\`typescript
// contexts/classroom-context.tsx
const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined)

// Centralized state with reducer pattern
function classroomReducer(state: ClassroomState, action: ClassroomAction): ClassroomState {
  switch (action.type) {
    case 'ADD_STUDENT': // Handle student addition
    case 'UPDATE_SCORE': // Handle scoring
    case 'UNDO_ACTION': // Handle undo/redo
    // ... other actions
  }
}
\`\`\`

#### 2. Component Composition
- **Container Components**: Handle data and business logic
- **Presentation Components**: Pure UI components
- **Hook Components**: Custom hooks for reusable logic

#### 3. Data Flow
\`\`\`
User Action → Context Dispatch → Reducer → State Update → Component Re-render → localStorage Sync
\`\`\`

## 🔧 Development Setup

### Prerequisites
\`\`\`bash
# Node.js version
node --version  # Should be 18.0.0 or higher

# Package manager
npm --version   # or yarn --version
\`\`\`

### Local Development
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
\`\`\`

### Development Scripts
\`\`\`json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "analyze": "ANALYZE=true npm run build"
  }
}
\`\`\`

## 📁 File Structure Deep Dive

### App Directory (`app/`)
\`\`\`
app/
├── layout.tsx          # Root layout with providers and metadata
├── page.tsx            # Home page with role-based routing
├── student/
│   └── page.tsx        # Student portal entry point
├── globals.css         # Global styles and CSS variables
└── not-found.tsx       # 404 error page
\`\`\`

### Components Directory (`components/`)
\`\`\`
components/
├── auth/                    # Authentication components
│   ├── auth-guard.tsx      # Route protection wrapper
│   └── login-form.tsx      # Login/register form
├── ui/                     # shadcn/ui components
│   ├── button.tsx          # Button variants
│   ├── card.tsx            # Card layouts
│   ├── dialog.tsx          # Modal dialogs
│   └── ...                 # Other UI primitives
├── teacher-dashboard.tsx   # Main teacher interface
├── student-dashboard.tsx   # Student interface
├── random-picker.tsx       # Animated name picker
├── qr-generator.tsx        # QR code generation
├── qr-scanner.tsx          # QR code scanning
├── scoring-system.tsx      # Point management
├── student-sidebar.tsx     # Student list management
├── leaderboard.tsx         # Rankings display
└── ...                     # Other feature components
\`\`\`

### Context Directory (`contexts/`)
\`\`\`
contexts/
├── auth-context.tsx        # Authentication state management
└── classroom-context.tsx   # Main application state
\`\`\`

### Types Directory (`types/`)
\`\`\`
types/
└── classroom.ts           # TypeScript interfaces and types
\`\`\`

## 🔄 State Management

### Classroom Context Structure
\`\`\`typescript
interface ClassroomState {
  // Core data
  currentClass: ClassData | null
  students: Student[]
  activities: Activity[]
  
  // UI state
  isLoading: boolean
  selectedStudent: Student | null
  currentPick: Student | null
  
  // History for undo/redo
  history: ClassroomState[]
  historyIndex: number
  
  // Settings
  settings: ClassroomSettings
}
\`\`\`

### Action Types
\`\`\`typescript
type ClassroomAction =
  | { type: 'ADD_STUDENT'; student: Omit<Student, 'id'> }
  | { type: 'UPDATE_STUDENT'; id: string; updates: Partial<Student> }
  | { type: 'REMOVE_STUDENT'; id: string }
  | { type: 'UPDATE_SCORE'; studentId: string; points: number; reason?: string }
  | { type: 'PICK_STUDENT'; studentId: string }
  | { type: 'RESET_ANSWERS' }
  | { type: 'UNDO_ACTION' }
  | { type: 'REDO_ACTION' }
  // ... other actions
\`\`\`

### Adding New Actions
1. **Define the action type** in `types/classroom.ts`
2. **Add the case** in `classroomReducer` function
3. **Create helper function** in context for dispatching
4. **Update components** to use the new action

Example:
\`\`\`typescript
// 1. Add to action type union
| { type: 'SET_STUDENT_AVATAR'; studentId: string; avatar: string }

// 2. Add reducer case
case 'SET_STUDENT_AVATAR':
  return {
    ...state,
    students: state.students.map(student =>
      student.id === action.studentId
        ? { ...student, avatar: action.avatar }
        : student
    )
  }

// 3. Add helper function
const setStudentAvatar = (studentId: string, avatar: string) => {
  dispatch({ type: 'SET_STUDENT_AVATAR', studentId, avatar })
}

// 4. Use in component
const { setStudentAvatar } = useClassroom()
setStudentAvatar(student.id, newAvatar)
\`\`\`

## 🎨 Styling System

### Design Tokens
Located in `app/globals.css`:
\`\`\`css
:root {
  --background: #ffffff;
  --foreground: #475569;
  --primary: #164e63;
  --secondary: #ec4899;
  --accent: #d97706;
  /* ... other tokens */
}
\`\`\`

### Component Styling Patterns
\`\`\`typescript
// Use cn utility for conditional classes
import { cn } from "@/lib/utils"

const Button = ({ variant, className, ...props }) => (
  <button
    className={cn(
      "base-button-classes",
      {
        "variant-primary": variant === "primary",
        "variant-secondary": variant === "secondary",
      },
      className
    )}
    {...props}
  />
)
\`\`\`

### Responsive Design
\`\`\`typescript
// Mobile-first approach
<div className="
  grid grid-cols-1           // Mobile: 1 column
  md:grid-cols-2            // Tablet: 2 columns  
  lg:grid-cols-3            // Desktop: 3 columns
  gap-4                     // Consistent spacing
">
\`\`\`

## 🔌 Adding New Features

### 1. Student Attendance Tracking

**Step 1**: Update types
\`\`\`typescript
// types/classroom.ts
interface Student {
  // ... existing fields
  attendanceHistory: AttendanceRecord[]
}

interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'late'
  timestamp: Date
}
\`\`\`

**Step 2**: Add reducer actions
\`\`\`typescript
// contexts/classroom-context.tsx
case 'MARK_ATTENDANCE':
  return {
    ...state,
    students: state.students.map(student =>
      student.id === action.studentId
        ? {
            ...student,
            attendanceHistory: [
              ...student.attendanceHistory,
              action.record
            ]
          }
        : student
    )
  }
\`\`\`

**Step 3**: Create component
\`\`\`typescript
// components/attendance-tracker.tsx
export function AttendanceTracker() {
  const { students, markAttendance } = useClassroom()
  
  const handleAttendance = (studentId: string, status: AttendanceStatus) => {
    markAttendance(studentId, {
      date: new Date().toISOString().split('T')[0],
      status,
      timestamp: new Date()
    })
  }
  
  return (
    // Component JSX
  )
}
\`\`\`

### 2. Export/Import Data

**Step 1**: Create utility functions
\`\`\`typescript
// lib/data-export.ts
export function exportClassData(classData: ClassData): string {
  return JSON.stringify(classData, null, 2)
}

export function importClassData(jsonString: string): ClassData {
  const data = JSON.parse(jsonString)
  // Validate data structure
  return data
}
\`\`\`

**Step 2**: Add to context
\`\`\`typescript
const exportData = () => {
  const dataString = exportClassData(state.currentClass)
  // Trigger download
}

const importData = (file: File) => {
  // Read file and import data
}
\`\`\`

## 🧪 Testing Strategy

### Unit Testing Setup
\`\`\`bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Create jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
\`\`\`

### Component Testing Example
\`\`\`typescript
// __tests__/components/random-picker.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { RandomPicker } from '@/components/random-picker'
import { ClassroomProvider } from '@/contexts/classroom-context'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <ClassroomProvider>
      {component}
    </ClassroomProvider>
  )
}

describe('RandomPicker', () => {
  test('picks a random student when clicked', () => {
    renderWithProvider(<RandomPicker />)
    
    const pickButton = screen.getByText('Pick Random Student')
    fireEvent.click(pickButton)
    
    expect(screen.getByTestId('selected-student')).toBeInTheDocument()
  })
})
\`\`\`

### Context Testing
\`\`\`typescript
// __tests__/contexts/classroom-context.test.tsx
import { renderHook, act } from '@testing-library/react'
import { ClassroomProvider, useClassroom } from '@/contexts/classroom-context'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ClassroomProvider>{children}</ClassroomProvider>
)

describe('ClassroomContext', () => {
  test('adds student correctly', () => {
    const { result } = renderHook(() => useClassroom(), { wrapper })
    
    act(() => {
      result.current.addStudent({ name: 'Test Student' })
    })
    
    expect(result.current.state.students).toHaveLength(1)
    expect(result.current.state.students[0].name).toBe('Test Student')
  })
})
\`\`\`

## 🚀 Deployment

### Vercel Deployment
\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
\`\`\`

### Environment Variables
\`\`\`bash
# Production environment variables
AUTH0_SECRET=production-secret
AUTH0_BASE_URL=https://your-domain.com
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=production-client-id
AUTH0_CLIENT_SECRET=production-client-secret
\`\`\`

### Build Optimization
\`\`\`javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
}

export default nextConfig
\`\`\`

## 🐛 Debugging

### Common Issues

**1. LocalStorage Data Corruption**
\`\`\`typescript
// Add error boundary for localStorage
try {
  const data = localStorage.getItem('classroom-data')
  return data ? JSON.parse(data) : null
} catch (error) {
  console.error('Failed to parse localStorage data:', error)
  localStorage.removeItem('classroom-data')
  return null
}
\`\`\`

**2. QR Scanner Not Working**
\`\`\`typescript
// Check camera permissions
const checkCameraPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Camera permission denied:', error)
    return false
  }
}
\`\`\`

**3. Performance Issues**
\`\`\`typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.data.id === nextProps.data.id
})
\`\`\`

### Debug Tools
\`\`\`typescript
// Add debug logging
const DEBUG = process.env.NODE_ENV === 'development'

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[ClassroomPro] ${message}`, data)
  }
}
\`\`\`

## 📊 Performance Monitoring

### Bundle Analysis
\`\`\`bash
# Analyze bundle size
ANALYZE=true npm run build
\`\`\`

### Performance Metrics
\`\`\`typescript
// Add performance monitoring
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}
\`\`\`

## 🔄 Version Management

### Semantic Versioning
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features
- **Patch** (0.0.1): Bug fixes

### Release Process
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Deploy to production
5. Create GitHub release

## 📚 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro

---

**For additional support, check the main README.md or create an issue in the repository.**

## 🧩 Quiz Flow Maintenance Notes

### Supabase Schema & Realtime
- `class_sessions` must include:
  - `is_quiz_locked boolean not null default true`
  - `quiz_stats jsonb` (e.g., { A: 0, B: 0, C: 0, D: 0, total: 0 })
  - `blocked_student_id uuid null`
- `answers` rows aggregate into `quiz_stats` (trigger/function recommended) whenever answers change.
- RLS should:
  - Block inserts/updates to `answers` when `is_quiz_locked = true`.
  - Allow teacher to update `is_quiz_locked`, `quiz_stats`, and `blocked_student_id`.
- Realtime channels used:
  - `postgres_changes` on `class_sessions` (UPDATE) filtered by `id` for `quiz_stats` and lock/blocked changes.
  - `postgres_changes` on `students` (INSERT/UPDATE/DELETE) filtered by `class_session_id` for live student list/score updates.

### RPC
- `grade_and_award_points(session_id_param uuid, correct_answer_param char(1), points_param int)` updates correct students’ scores server-side.
- Wrong points for the initially called student are applied from the client on Wrong click to keep UX snappy; you may add a server-side RPC if desired.

### Frontend Contracts
- Context methods:
  - `openQuizForEveryone(sessionId, excludedStudentId?)` → unlocks, resets stats, and sets `blocked_student_id`.
  - `lockQuiz(sessionId)` → sets `is_quiz_locked = true`.
  - `clearAnswers(sessionId)` → deletes all `answers` for the session.
  - `resetAllScores(sessionId)` → sets all `students.score = 0` for the session.
  - `gradeQuizAndAwardPoints(sessionId, correctAnswer, points)` → RPC call.
  - `setQuestionPoints(classId, points[])`, `setWrongPoints(classId, points[])` → persist per-question configuration in context.

### Keyboard Shortcuts (Implementation)
- Global keydown is registered in `components/dashboard-header.tsx`.
- It triggers button clicks by element IDs to reuse existing logic:
  - `shortcut-lock-toggle`, `shortcut-random-pick`, `shortcut-wrong`, `shortcut-correct`, `shortcut-end-quiz`, `shortcut-reset-answers`, `shortcut-reset-scores`
  - A/B/C/D for selecting the correct answer in `TeamAssignmentDialog` via `shortcut-ans-A/B/C/D`
- Ensure components keep these IDs if refactoring, or update the handler accordingly.

### Import/Export Format (Edit Points)
- Import accepts lines in the form: `positive, wrong`
  - Delimiters: comma, space, or tab
  - Example:
```
1, 0
2, -1
3, 0
4, -2
5, 0
```
- Export generates the same format. Both positive and wrong arrays are persisted in context.

### Known Pitfalls
- If blocked student behavior seems inconsistent, verify `blocked_student_id` updates are permitted by RLS and realtime is enabled.
- Ensure `subscribeToQuizLock` dispatches both lock and blocked changes into context.
- When adding new UI, keep keyboard focusable inputs in mind; the global handler ignores shortcuts if the user is typing in inputs/textareas.
