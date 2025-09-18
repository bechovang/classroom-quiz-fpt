"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useClassroom } from "@/contexts/classroom-context"
import { HelpCircle } from "lucide-react"

export function QuizCreator() {
  const { state, createQuiz } = useClassroom()
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!state.currentClass || !question.trim()) return

    // Check if all options are filled
    if (!options.A.trim() || !options.B.trim() || !options.C.trim() || !options.D.trim()) {
      alert("Vui lòng điền đầy đủ tất cả các đáp án")
      return
    }

    createQuiz(state.currentClass.id, question.trim(), options)

    // Reset form
    setQuestion("")
    setOptions({ A: "", B: "", C: "", D: "" })
    setIsOpen(false)
  }

  const handleOptionChange = (option: "A" | "B" | "C" | "D", value: string) => {
    setOptions((prev) => ({ ...prev, [option]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200"
          disabled={!!state.currentClass?.currentQuiz}
        >
          <HelpCircle className="h-4 w-4" />
          Tạo câu hỏi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Tạo câu hỏi trắc nghiệm</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium text-gray-700">
              Câu hỏi
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["A", "B", "C", "D"] as const).map((option) => (
              <div key={option} className="space-y-2">
                <Label htmlFor={`option-${option}`} className="text-sm font-medium text-gray-700">
                  Đáp án {option}
                </Label>
                <Input
                  id={`option-${option}`}
                  value={options[option]}
                  onChange={(e) => handleOptionChange(option, e.target.value)}
                  placeholder={`Nhập đáp án ${option}...`}
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Tạo câu hỏi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
