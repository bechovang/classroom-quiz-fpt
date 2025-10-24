"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown, ChevronRight, FolderOpen, Folder, User, Plus, Upload, Download, Pencil, Trash, Copy } from "lucide-react"
import { useState } from "react"
import { AddStudentDialog } from "@/components/add-student-dialog"
import { ImportStudentsDialog } from "@/components/import-students-dialog"

export function ClassHierarchy() {
  const { state, dispatch, addClass, selectClass, renameClass, deleteClass, deleteStudent, updateStudent } = useClassroom()
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set([state.currentClass?.id || ""]))
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showImportStudents, setShowImportStudents] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const escapeCsv = (value: string) => {
    const v = value ?? ""
    // Quote if contains delimiter (tab), newline, comma, or quotes
    if (v.includes("\t") || v.includes(",") || v.includes("\n") || v.includes('"')) {
      return '"' + v.replace(/"/g, '""') + '"'
    }
    return v
  }

  const buildCsv = (includeHeader = true) => {
    if (!state.currentClass) return ""
    const header = includeHeader ? "Tên\tMSSV\tĐiểm\n" : ""
    const lines = state.currentClass.students.map(
      (s) => `${escapeCsv(s.name)}\t${escapeCsv(s.studentId)}\t${s.score}`,
    )
    return header + lines.join("\n")
  }

  const buildCsvComma = (includeHeader = true) => {
    if (!state.currentClass) return ""
    const header = includeHeader ? "Tên,MSSV,Điểm\n" : ""
    const lines = state.currentClass.students.map(
      (s) => `${escapeCsv(s.name)},${escapeCsv(s.studentId)},${s.score}`,
    )
    return header + lines.join("\n")
  }

  const buildScoresOnly = () => {
    if (!state.currentClass) return ""
    return state.currentClass.students.map((s) => String(s.score ?? 0)).join("\n")
  }

  const handleDownload = () => {
    if (!state.currentClass) return
    const content = buildCsv(false)
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const filename = `${(state.currentClass.name || "class").replace(/[^a-zA-Z0-9-_]+/g, "_")}_students.tsv`
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    if (!state.currentClass) return
    const content = buildCsv(false)
    try {
      await navigator.clipboard.writeText(content)
    } catch (e) {
      const textarea = document.createElement("textarea")
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
  }

  const handleCopyScores = async () => {
    if (!state.currentClass) return
    const content = buildScoresOnly()
    try {
      await navigator.clipboard.writeText(content)
    } catch (e) {
      const textarea = document.createElement("textarea")
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
  }

  const toggleClass = (classId: string) => {
    const newExpanded = new Set(expandedClasses)
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId)
    } else {
      newExpanded.add(classId)
    }
    setExpandedClasses(newExpanded)
  }

  const createNewClass = () => {
    const className = prompt("Nhập tên lớp:")
    if (className) {
      addClass(className)
    }
  }

  const handleSelectClass = async (classData: any) => {
    await selectClass(classData.id)
  }

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-sidebar-foreground">Danh sách lớp</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={createNewClass}
            className="h-7 w-7 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddStudent(true)}
            className="flex-1 h-8 text-xs bg-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            disabled={!state.currentClass}
          >
            <Plus className="h-3 w-3 mr-1" />
            Thêm SV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowImportStudents(true)}
            className="flex-1 h-8 text-xs bg-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            disabled={!state.currentClass}
          >
            <Upload className="h-3 w-3 mr-1" />
            Import
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            className="flex-1 h-8 text-xs bg-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            disabled={!state.currentClass || state.currentClass.students.length === 0}
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Class Tree - only this area scrolls */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {state.classes.map((classItem) => {
            const isExpanded = expandedClasses.has(classItem.id)
            const isSelected = state.currentClass?.id === classItem.id
            const studentCount = classItem.students.length

            return (
              <div key={classItem.id} className="space-y-1">
                {/* Class Item */}
                <div
                  className={`
                    flex items-center gap-2 p-2 rounded-md cursor-pointer group
                    ${
                      isSelected
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    }
                  `}
                  onClick={() => void handleSelectClass(classItem)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleClass(classItem.id)
                    }}
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </Button>

                  {isExpanded ? <FolderOpen className="h-4 w-4 text-sidebar-accent" /> : <Folder className="h-4 w-4" />}

                  <span className="flex-1 text-sm font-medium truncate">{classItem.name}</span>

                  <Badge variant="secondary" className="text-xs h-5">
                    {studentCount} học sinh
                  </Badge>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        const name = prompt("Tên lớp mới:", classItem.name)
                        if (name) renameClass(classItem.id, name)
                      }}
                      aria-label="Sửa lớp"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Xóa lớp này? Toàn bộ học sinh và câu trả lời sẽ bị xóa.")) {
                          void deleteClass(classItem.id)
                        }
                      }}
                      aria-label="Xóa lớp"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Students List */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {classItem.students.map((student) => (
                      <div
                        key={student.id}
                        className={`
                          flex items-center gap-2 p-2 rounded-md text-sm group transition-all duration-200
                          ${
                            student.isCalled
                              ? "ring-2 ring-amber-300/70 bg-amber-50/80 dark:bg-amber-950/20"
                              : "hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                          }
                        `}
                      >
                        <div className="relative">
                          <User className={`h-3 w-3 ${student.isCalled ? "text-amber-600" : ""}`} />
                          {student.isCalled && (
                            <span className="absolute -top-1 -right-1 inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                          )}
                        </div>
                        <span className={`flex-1 whitespace-normal break-words pr-1 ${student.isCalled ? "font-semibold text-amber-800" : ""}`}>
                          {student.name}
                        </span>

                        <Badge variant="outline" className={`text-xs h-4 ${student.isCalled ? "border-amber-300 text-amber-700 bg-amber-50" : ""}`}>
                          {student.studentId}
                        </Badge>
                        <Badge variant={student.isCalled ? "default" : "secondary"} className={`text-xs h-4 ${student.isCalled ? "bg-amber-500 text-white" : ""}`}>
                          {student.score} điểm
                        </Badge>

                        {student.isCalled && (
                          <Badge variant="outline" className="text-[10px] h-4 border-amber-300 text-amber-700 bg-amber-50">
                            Đã gọi
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              const newName = prompt("Tên học sinh mới:", student.name)
                              if (!newName) return
                              const newCode = prompt("MSSV mới:", student.studentId)
                              const updated = { ...student, name: newName, studentId: newCode || "" }
                              void updateStudent(classItem.id, updated)
                            }}
                            aria-label="Sửa học sinh"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm("Xóa học sinh này?")) void deleteStudent(classItem.id, student.id)
                            }}
                            aria-label="Xóa học sinh"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {classItem.students.length === 0 && (
                      <div className="text-xs text-muted-foreground p-2 text-center">Chưa có học sinh</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {state.classes.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có lớp học</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={createNewClass}
              className="mt-2 text-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              Tạo lớp đầu tiên
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddStudentDialog open={showAddStudent} onOpenChange={setShowAddStudent} />
      <ImportStudentsDialog open={showImportStudents} onOpenChange={setShowImportStudents} />
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xuất danh sách lớp</DialogTitle>
            <DialogDescription>Chọn phương thức xuất để tải về hoặc sao chép dán vào Excel</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            <Button onClick={() => { handleDownload(); setShowExportDialog(false) }} className="justify-start">
              <Download className="h-4 w-4 mr-2" /> Tải xuống TSV
            </Button>
            <Button variant="outline" onClick={() => { handleCopy(); setShowExportDialog(false) }} className="justify-start">
              <Copy className="h-4 w-4 mr-2" /> Sao chép vào Clipboard
            </Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildCsvComma(false)); setShowExportDialog(false) }} className="justify-start">
              <Copy className="h-4 w-4 mr-2" /> Copy CSV (comma)
            </Button>
            <Button variant="outline" onClick={() => { handleCopyScores(); setShowExportDialog(false) }} className="justify-start">
              <Copy className="h-4 w-4 mr-2" /> Copy cột điểm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
