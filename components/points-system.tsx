"use client"

import { useEffect, useState } from "react"
import { useClassroom } from "@/contexts/classroom-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, Plus, Minus, Save, Import, Download } from "lucide-react"

interface PointsSystemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PointsSystem({ open, onOpenChange }: PointsSystemProps) {
  const { state, updateStudentScore, setQuestionPoints } = useClassroom()
  const [numQuestions, setNumQuestions] = useState(5)
  const [questionPoints, setQuestionPointsLocal] = useState<number[]>([1, 1, 1, 1, 1])
  const [importText, setImportText] = useState("")
  const [showImportExport, setShowImportExport] = useState(false)

  if (!state.currentClass) return null

  useEffect(() => {
    if (!state.currentClass?.questionPoints) return
    setQuestionPointsLocal(state.currentClass.questionPoints)
    setNumQuestions(state.currentClass.questionPoints.length)
  }, [state.currentClass?.questionPoints])

  const handleNumQuestionsChange = (newNum: number) => {
    if (newNum < 1 || newNum > 50) return

    setNumQuestions(newNum)
    const newPoints = Array(newNum)
      .fill(0)
      .map((_, i) => questionPoints[i] || 1)
    setQuestionPointsLocal(newPoints)
  }

  const handleQuestionPointChange = (index: number, points: number) => {
    if (points < 0) return
    const newPoints = [...questionPoints]
    newPoints[index] = points
    setQuestionPointsLocal(newPoints)
  }

  const handleImport = () => {
    const lines = importText
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "")
    const importedPoints = lines.map((line) => {
      const point = Number.parseInt(line.trim())
      return isNaN(point) ? 1 : Math.max(0, Math.min(100, point))
    })

    if (importedPoints.length > 0) {
      setNumQuestions(importedPoints.length)
      setQuestionPoints(importedPoints)
      setImportText("")
      setShowImportExport(false)
    }
  }

  const handleExport = () => {
    const exportText = questionPoints.join("\n")
    setImportText(exportText)
  }

  const handleApplyPoints = () => {
    // Persist to context (and optionally to backend later)
    setQuestionPoints(state.currentClass!.id, questionPoints)
    onOpenChange(false)
  }

  const questionRows = []
  for (let i = 0; i < questionPoints.length; i += 5) {
    questionRows.push(questionPoints.slice(i, i + 5))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Chấm điểm theo câu hỏi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Thiết lập số câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Label htmlFor="numQuestions" className="text-sm font-medium">
                  Số câu:
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNumQuestionsChange(numQuestions - 1)}
                  disabled={numQuestions <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="numQuestions"
                  type="number"
                  value={numQuestions}
                  onChange={(e) => handleNumQuestionsChange(Number.parseInt(e.target.value) || 1)}
                  className="w-16 text-center h-8"
                  min="1"
                  max="50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNumQuestionsChange(numQuestions + 1)}
                  disabled={numQuestions >= 50}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <div className="ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportExport(!showImportExport)}
                    className="h-8"
                  >
                    <Import className="h-4 w-4 mr-2" />
                    Import/Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {showImportExport && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Import/Export điểm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="importText" className="text-sm font-medium">
                    Nhập điểm (mỗi hàng là 1 điểm):
                  </Label>
                  <Textarea
                    id="importText"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="1&#10;2&#10;3&#10;4&#10;5"
                    className="mt-2 h-32"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleImport} variant="default" size="sm">
                    <Import className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleExport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Điểm từng câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-5 gap-4">
                    {row.map((points, colIndex) => {
                      const questionIndex = rowIndex * 5 + colIndex
                      return (
                        <div key={questionIndex} className="space-y-2">
                          <Label className="text-sm font-medium text-center block">Câu {questionIndex + 1}</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={points}
                              onChange={(e) =>
                                handleQuestionPointChange(questionIndex, Number.parseInt(e.target.value) || 0)
                              }
                              className="text-center h-10 text-lg font-medium"
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button onClick={handleApplyPoints} size="lg" className="px-8">
              <Save className="h-4 w-4 mr-2" />
              Áp dụng điểm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
