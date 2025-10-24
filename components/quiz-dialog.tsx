"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QuizDisplay } from "@/components/quiz-display"

interface QuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuizDialog({ open, onOpenChange }: QuizDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Câu hỏi đang hoạt động</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <QuizDisplay />
        </div>
      </DialogContent>
    </Dialog>
  )
}
