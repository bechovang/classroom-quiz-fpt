# API Instructions for Classroom Management System

## Overview

This document provides comprehensive instructions for implementing the backend API to support the classroom management frontend application. The API should integrate with the new database schema consisting of 3 tables: `class_sessions`, `students`, and `answers`.

## Database Schema

### Table 1: `class_sessions` (Class Sessions)
\`\`\`sql
CREATE TABLE class_sessions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  class_code TEXT UNIQUE NOT NULL,
  quiz_stats JSONB DEFAULT '{"A": 0, "B": 0, "C": 0, "D": 0, "total": 0}'
);
\`\`\`

### Table 2: `students` (Students)
\`\`\`sql
CREATE TABLE students (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  student_name TEXT NOT NULL,
  student_code TEXT NOT NULL,
  score BIGINT DEFAULT 0,
  class_session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE
);
\`\`\`

### Table 3: `answers` (Quiz Answers)
\`\`\`sql
CREATE TABLE answers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE
);
\`\`\`

## API Endpoints

### 1. Class Session Management

#### POST `/api/sessions`
**Purpose**: Create a new class session (Teacher starts a new class)
**Request Body**:
\`\`\`json
{
  "class_code": "GR8F9" // Optional, auto-generate if not provided
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "class_code": "GR8F9",
    "created_at": "2025-01-18T10:00:00Z",
    "quiz_stats": {"A": 0, "B": 0, "C": 0, "D": 0, "total": 0}
  }
}
\`\`\`

#### GET `/api/sessions/:class_code`
**Purpose**: Get session details by class code (Students join session)
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "class_code": "GR8F9",
    "created_at": "2025-01-18T10:00:00Z",
    "quiz_stats": {"A": 0, "B": 0, "C": 0, "D": 0, "total": 0},
    "students_count": 25
  }
}
\`\`\`

#### DELETE `/api/sessions/:session_id`
**Purpose**: End and delete a class session
**Response**:
\`\`\`json
{
  "success": true,
  "message": "Session ended successfully"
}
\`\`\`

### 2. Student Management

#### POST `/api/sessions/:session_id/students`
**Purpose**: Add a student to a class session
**Request Body**:
\`\`\`json
{
  "student_name": "Nguyễn Văn An",
  "student_code": "SV001"
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "student_name": "Nguyễn Văn An",
    "student_code": "SV001",
    "score": 0,
    "class_session_id": 1,
    "created_at": "2025-01-18T10:05:00Z"
  }
}
\`\`\`

#### POST `/api/sessions/:session_id/students/bulk`
**Purpose**: Add multiple students at once (Import functionality)
**Request Body**:
\`\`\`json
{
  "students": [
    {"student_name": "Nguyễn Văn An", "student_code": "SV001"},
    {"student_name": "Trần Thị Bình", "student_code": "SV002"}
  ]
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "added_count": 2,
    "students": [...]
  }
}
\`\`\`

#### GET `/api/sessions/:session_id/students`
**Purpose**: Get all students in a session
**Response**:
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_name": "Nguyễn Văn An",
      "student_code": "SV001",
      "score": 85,
      "class_session_id": 1,
      "created_at": "2025-01-18T10:05:00Z"
    }
  ]
}
\`\`\`

#### PUT `/api/students/:student_id`
**Purpose**: Update student information or score
**Request Body**:
\`\`\`json
{
  "student_name": "Nguyễn Văn An Updated", // Optional
  "student_code": "SV001", // Optional
  "score": 95 // Optional
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "student_name": "Nguyễn Văn An Updated",
    "student_code": "SV001",
    "score": 95,
    "class_session_id": 1,
    "created_at": "2025-01-18T10:05:00Z"
  }
}
\`\`\`

#### DELETE `/api/students/:student_id`
**Purpose**: Remove a student from session
**Response**:
\`\`\`json
{
  "success": true,
  "message": "Student removed successfully"
}
\`\`\`

### 3. Quiz and Answer Management

#### POST `/api/sessions/:session_id/quiz/start`
**Purpose**: Start a new quiz (Clear previous answers, reset quiz_stats)
**Request Body**:
\`\`\`json
{
  "question": "What is the capital of Vietnam?",
  "options": {
    "A": "Ho Chi Minh City",
    "B": "Hanoi",
    "C": "Da Nang",
    "D": "Can Tho"
  }
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "message": "Quiz started successfully",
  "data": {
    "session_id": 1,
    "quiz_stats": {"A": 0, "B": 0, "C": 0, "D": 0, "total": 0}
  }
}
\`\`\`

#### POST `/api/sessions/:session_id/answers`
**Purpose**: Submit student answer
**Request Body**:
\`\`\`json
{
  "student_id": 1,
  "selected_answer": "B"
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "id": 1,
    "selected_answer": "B",
    "student_id": 1,
    "class_session_id": 1,
    "created_at": "2025-01-18T10:15:00Z"
  }
}
\`\`\`

#### GET `/api/sessions/:session_id/quiz/stats`
**Purpose**: Get real-time quiz statistics
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "quiz_stats": {"A": 5, "B": 12, "C": 3, "D": 2, "total": 22},
    "total_students": 25,
    "participation_rate": 88
  }
}
\`\`\`

#### POST `/api/sessions/:session_id/quiz/lock`
**Purpose**: Lock quiz (prevent further answers)
**Response**:
\`\`\`json
{
  "success": true,
  "message": "Quiz locked successfully"
}
\`\`\`

#### POST `/api/sessions/:session_id/quiz/grade`
**Purpose**: Grade quiz and update student scores
**Request Body**:
\`\`\`json
{
  "correct_answer": "B",
  "points_correct": 10,
  "points_incorrect": -2
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "correct_students": 12,
    "incorrect_students": 10,
    "total_graded": 22
  }
}
\`\`\`

#### DELETE `/api/sessions/:session_id/answers`
**Purpose**: Clear all answers for current quiz
**Response**:
\`\`\`json
{
  "success": true,
  "message": "All answers cleared successfully"
}
\`\`\`

### 4. Points System

#### POST `/api/sessions/:session_id/points/apply`
**Purpose**: Apply points to all students (Edit Points functionality)
**Request Body**:
\`\`\`json
{
  "points": [10, 8, 6, 9, 7] // Points for each question
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "total_points": 40,
    "students_updated": 25
  }
}
\`\`\`

#### POST `/api/students/:student_id/points`
**Purpose**: Add/subtract points for individual student
**Request Body**:
\`\`\`json
{
  "points": 15, // Can be negative
  "reason": "Excellent participation" // Optional
}
\`\`\`
**Response**:
\`\`\`json
{
  "success": true,
  "data": {
    "student_id": 1,
    "old_score": 85,
    "new_score": 100,
    "points_added": 15
  }
}
\`\`\`

#### POST `/api/sessions/:session_id/points/reset`
**Purpose**: Reset all student scores to 0
**Response**:
\`\`\`json
{
  "success": true,
  "message": "All scores reset successfully"
}
\`\`\`

### 5. Real-time Updates (WebSocket/Server-Sent Events)

#### WebSocket Connection: `/ws/sessions/:session_id`
**Purpose**: Real-time updates for quiz stats, student joins, score changes

**Events to emit**:
- `student_joined`: When a new student joins
- `answer_submitted`: When a student submits an answer
- `quiz_stats_updated`: When quiz statistics change
- `scores_updated`: When student scores are updated
- `quiz_locked`: When teacher locks the quiz

**Example WebSocket message**:
\`\`\`json
{
  "event": "quiz_stats_updated",
  "data": {
    "quiz_stats": {"A": 6, "B": 13, "C": 3, "D": 2, "total": 24},
    "timestamp": "2025-01-18T10:16:00Z"
  }
}
\`\`\`

## Frontend Integration Points

### 1. ClassroomContext Updates Required

The current `ClassroomContext` needs to be updated to work with the new API:

\`\`\`typescript
// Replace localStorage with API calls
const loadFromAPI = async (classCode: string) => {
  const response = await fetch(`/api/sessions/${classCode}`)
  const data = await response.json()
  // Update state with session data
}

const createSession = async () => {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  const data = await response.json()
  return data.data.class_code
}
\`\`\`

### 2. Component Updates Required

#### Teacher Dashboard
- Replace `addClass()` with `createSession()`
- Update student management to use API endpoints
- Implement real-time quiz stats via WebSocket

#### Student Portal
- Add class code input for joining sessions
- Update quiz submission to use API
- Implement real-time updates for quiz participation

#### Points System
- Update to use bulk points API
- Add individual student point adjustment
- Implement score reset functionality

### 3. Real-time Features Implementation

\`\`\`typescript
// WebSocket connection for real-time updates
const useWebSocket = (sessionId: string) => {
  useEffect(() => {
    const ws = new WebSocket(`/ws/sessions/${sessionId}`)
    
    ws.onmessage = (event) => {
      const { event: eventType, data } = JSON.parse(event.data)
      
      switch (eventType) {
        case 'quiz_stats_updated':
          updateQuizStats(data.quiz_stats)
          break
        case 'student_joined':
          addStudentToList(data.student)
          break
        // Handle other events
      }
    }
    
    return () => ws.close()
  }, [sessionId])
}
\`\`\`

## Error Handling

All API endpoints should return consistent error responses:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student with ID 123 not found",
    "details": {}
  }
}
\`\`\`

Common error codes:
- `SESSION_NOT_FOUND`: Class session doesn't exist
- `STUDENT_NOT_FOUND`: Student doesn't exist
- `INVALID_CLASS_CODE`: Class code format invalid
- `QUIZ_LOCKED`: Cannot submit answer to locked quiz
- `DUPLICATE_STUDENT`: Student already exists in session

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for answer submissions
2. **Session Validation**: Validate session ownership for teacher operations
3. **Input Sanitization**: Sanitize all user inputs
4. **CORS**: Configure CORS for frontend domain
5. **Authentication**: Consider adding teacher authentication for sensitive operations

## Performance Optimizations

1. **Database Indexing**:
   \`\`\`sql
   CREATE INDEX idx_students_session ON students(class_session_id);
   CREATE INDEX idx_answers_session ON answers(class_session_id);
   CREATE INDEX idx_class_sessions_code ON class_sessions(class_code);
   \`\`\`

2. **Caching**: Cache quiz stats in Redis for high-frequency reads
3. **Connection Pooling**: Use database connection pooling
4. **Batch Operations**: Support batch operations for bulk updates

## Migration Strategy

1. **Phase 1**: Implement API endpoints alongside existing localStorage system
2. **Phase 2**: Add feature flags to switch between localStorage and API
3. **Phase 3**: Gradually migrate components to use API
4. **Phase 4**: Remove localStorage code and make API the primary data source

This API design provides a robust foundation for the classroom management system while maintaining compatibility with the existing frontend architecture.
