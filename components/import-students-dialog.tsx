"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import { useState } from "react"

interface ImportStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportStudentsDialog({ open, onOpenChange }: ImportStudentsDialogProps) {
  const { state, addStudentsBulk } = useClassroom()
  const [csvData, setCsvData] = useState("")
  const [previewStudents, setPreviewStudents] = useState<{ name: string; studentId: string }[]>([])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parseCsvData = (data: string) => {
    try {
      const lines = data.trim().split("\n")
      const students: { name: string; studentId: string }[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Strict TAB-separated values: Name<TAB>StudentId
        const parts = line.split(/\t/).map((part) => part.trim().replace(/"/g, ""))

        if (parts.length >= 2 && parts[0] && parts[1]) {
          const student = {
            name: parts[0],
            studentId: parts[1],
          }
          students.push(student)
        }
      }

      return students
    } catch (err) {
      throw new Error("Invalid TSV format")
    }
  }

  const handlePreview = () => {
    try {
      setError("")
      const students = parseCsvData(csvData)
      // Validate unique studentId (MSSV) in import and against current class
      const inFileDup = new Set<string>()
      const seen = new Set<string>()
      for (const s of students) {
        const code = (s.studentId || "").trim()
        if (!code) continue
        if (seen.has(code)) inFileDup.add(code)
        seen.add(code)
      }
      const existing = new Set<string>((state.currentClass?.students || []).map((s) => s.studentId.trim()).filter(Boolean))
      const conflict = [...seen].filter((code) => existing.has(code))
      if (inFileDup.size > 0 || conflict.length > 0) {
        const parts: string[] = []
        if (inFileDup.size > 0) parts.push(`Trùng MSSV trong file: ${[...inFileDup].join(", ")}`)
        if (conflict.length > 0) parts.push(`MSSV đã tồn tại trong lớp: ${conflict.join(", ")}`)
        setError(parts.join(". "))
        setPreviewStudents([])
        return
      }
      if (students.length === 0) {
        setError("No valid student data found")
        return
      }
      setPreviewStudents(students)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse TSV data")
      setPreviewStudents([])
    }
  }

  const handleImport = async () => {
    if (!state.currentClass || previewStudents.length === 0) return

    setIsSubmitting(true)
    try {
      addStudentsBulk(state.currentClass.id, previewStudents)

      setCsvData("")
      setPreviewStudents([])
      setError("")
      onOpenChange(false)
    } catch (error) {
      setError("Failed to import students")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCsvData("")
      setPreviewStudents([])
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import học sinh</DialogTitle>
          <DialogDescription>
            Import danh sách học sinh từ TSV. Định dạng: Tên học sinh[TAB]Mã số sinh viên
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-data">Dữ liệu TSV</Label>
            <Textarea
              id="csv-data"
              placeholder={`Nguyễn Văn An\tSV001\nTrần Thị Bình\tSV002\nLê Minh Cường\tSV003\nPhạm Thị Dung\tSV004`}
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={6}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Mỗi dòng chứa: Tên học sinh[TAB]Mã số sinh viên (phân cách bằng TAB)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {previewStudents.length > 0 && (
            <div className="space-y-2">
              <Label>Xem trước ({previewStudents.length} học sinh)</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
                {previewStudents.map((student, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1">
                    <span>{student.name}</span>
                    <span className="text-muted-foreground">MSSV: {student.studentId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePreview} disabled={!csvData.trim() || isSubmitting}>
              <Upload className="w-4 h-4 mr-2" />
              Xem trước
            </Button>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={previewStudents.length === 0 || isSubmitting}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "Đang import..." : `Import ${previewStudents.length} học sinh`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
