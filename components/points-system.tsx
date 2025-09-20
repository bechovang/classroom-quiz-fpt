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
  const { state, updateStudentScore, setQuestionPoints, setWrongPoints } = useClassroom()
  const [numQuestions, setNumQuestions] = useState(5)
  const [questionPoints, setQuestionPointsLocal] = useState<number[]>([1, 1, 1, 1, 1])
  const [importText, setImportText] = useState("")
  const [showImportExport, setShowImportExport] = useState(false)
  const [wrongPoints, setWrongPointsLocal] = useState<number[]>(state.currentClass?.wrongPoints || [])

  if (!state.currentClass) return null

  useEffect(() => {
    if (!state.currentClass?.questionPoints) return
    setQuestionPointsLocal(state.currentClass.questionPoints)
    setNumQuestions(state.currentClass.questionPoints.length)
    const wp = state.currentClass?.wrongPoints || Array(state.currentClass.questionPoints.length).fill(0)
    setWrongPointsLocal(wp)
  }, [state.currentClass?.questionPoints])

  const handleNumQuestionsChange = (newNum: number) => {
    if (newNum < 1 || newNum > 50) return

    setNumQuestions(newNum)
    const newPoints = Array(newNum)
      .fill(0)
      .map((_, i) => questionPoints[i] || 1)
    setQuestionPointsLocal(newPoints)

    const newWrong = Array(newNum)
      .fill(0)
      .map((_, i) => wrongPoints[i] ?? 0)
    setWrongPointsLocal(newWrong)
  }

  const handleQuestionPointChange = (index: number, points: number) => {
    const newPoints = [...questionPoints]
    newPoints[index] = Number.isFinite(points) ? points : 0
    setQuestionPointsLocal(newPoints)
  }

  const handleWrongPointChange = (index: number, value: number) => {
    const newArr = [...wrongPoints]
    newArr[index] = Number.isFinite(value) ? value : 0
    setWrongPointsLocal(newArr)
  }

  const handleImport = () => {
    const lines = importText
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "")

    if (lines.length === 0) return

    const pos: number[] = []
    const neg: number[] = []

    for (const raw of lines) {
      const line = raw.trim()
      // support comma or tab separated: positive,wrong
      const parts = line.split(/[\s,\t]+/).filter(Boolean)
      const p = Number.parseInt(parts[0] ?? "0")
      const w = Number.parseInt(parts[1] ?? "0")
      pos.push(isNaN(p) ? 0 : p)
      neg.push(isNaN(w) ? 0 : w)
    }

    setNumQuestions(pos.length)
    setQuestionPointsLocal(pos)
    setWrongPointsLocal(neg)
    setQuestionPoints(state.currentClass!.id, pos)
    setWrongPoints(state.currentClass!.id, neg)
    setImportText("")
    setShowImportExport(false)
  }

  const handleExport = () => {
    const lines: string[] = []
    const maxLen = Math.max(questionPoints.length, wrongPoints.length)
    for (let i = 0; i < maxLen; i++) {
      const p = questionPoints[i] ?? 0
      const w = wrongPoints[i] ?? 0
      lines.push(`${p}, ${w}`)
    }
    setImportText(lines.join("\n"))
  }

  const handleApplyPoints = () => {
    setQuestionPoints(state.currentClass!.id, questionPoints)
    setWrongPoints(state.currentClass!.id, wrongPoints)
    onOpenChange(false)
  }

  const questionRows: number[][] = []
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
                    Nhập điểm (mỗi hàng: Điểm cộng, Điểm trừ):
                  </Label>
                  <Textarea
                    id="importText"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="1, 0&#10;2, -1&#10;3, 0&#10;4, -2&#10;5, 0"
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
                          <div className="relative space-y-2">
                            <Input
                              type="number"
                              value={points}
                              onChange={(e) =>
                                handleQuestionPointChange(
                                  questionIndex,
                                  Number.parseInt(e.target.value) || 0,
                                )
                              }
                              className="text-center h-10 text-lg font-medium"
                            />
                            <Input
                              type="number"
                              value={wrongPoints[questionIndex] ?? 0}
                              onChange={(e) => handleWrongPointChange(questionIndex, Number.parseInt(e.target.value))}
                              className="text-center h-8 text-sm"
                              placeholder="Điểm trừ (âm)"
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
