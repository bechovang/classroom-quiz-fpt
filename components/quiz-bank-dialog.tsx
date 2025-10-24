"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Download, FileSpreadsheet, Plus, Search, Trash2, Upload, Wand2, Pencil } from "lucide-react"

import {
  bulkInsertQuizBank,
  createQuizBankItem,
  deleteQuizBankItem,
  listQuizBank,
  updateQuizBankItem,
  type SupabaseQuizBankRow,
} from "@/lib/supabaseApi"

import Papa from "papaparse"
import * as XLSX from "xlsx"

interface QuizBankDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuizBankDialog({ open, onOpenChange }: QuizBankDialogProps) {
  const [items, setItems] = useState<SupabaseQuizBankRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState("")

  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingId, setEditingId] = useState<string | null>(null)

  const [question, setQuestion] = useState("")
  const [optionA, setOptionA] = useState("")
  const [optionB, setOptionB] = useState("")
  const [optionC, setOptionC] = useState("")
  const [optionD, setOptionD] = useState("")
  const [correct, setCorrect] = useState<"A" | "B" | "C" | "D">("A")
  const [explanation, setExplanation] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const resetForm = () => {
    setFormMode("create")
    setEditingId(null)
    setQuestion("")
    setOptionA("")
    setOptionB("")
    setOptionC("")
    setOptionD("")
    setCorrect("A")
    setExplanation("")
    setTagsInput("")
  }

  const load = async () => {
    setLoading(true)
    try {
      const rows = await listQuizBank({ search: search || undefined, tag: tag || undefined, limit: 200 })
      setItems(rows)
    } catch (e) {
      toast({ title: "Error", description: String(e) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = async () => {
    try {
      const payload = {
        question_text: question.trim(),
        options: { A: optionA.trim(), B: optionB.trim(), C: optionC.trim(), D: optionD.trim() },
        correct_answer: correct,
        explanation: explanation.trim() || null,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      }
      if (!payload.question_text || !payload.options.A || !payload.options.B || !payload.options.C || !payload.options.D) {
        toast({ title: "Thiếu dữ liệu", description: "Vui lòng nhập đầy đủ câu hỏi và 4 đáp án" })
        return
      }
      if (formMode === "create") {
        await createQuizBankItem(payload)
      } else if (editingId) {
        await updateQuizBankItem(editingId, payload)
      }
      resetForm()
      await load()
      toast({ title: "Thành công", description: "Đã lưu câu hỏi" })
    } catch (e) {
      toast({ title: "Lỗi", description: String(e) })
    }
  }

  const handleEdit = (row: SupabaseQuizBankRow) => {
    setFormMode("edit")
    setEditingId(row.id)
    setQuestion(row.question_text)
    setOptionA(row.options?.A || "")
    setOptionB(row.options?.B || "")
    setOptionC(row.options?.C || "")
    setOptionD(row.options?.D || "")
    setCorrect(row.correct_answer)
    setExplanation(row.explanation || "")
    setTagsInput((row.tags || []).join(", "))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa câu hỏi này?")) return
    try {
      await deleteQuizBankItem(id)
      await load()
      toast({ title: "Đã xóa", description: "Câu hỏi đã được xóa" })
    } catch (e) {
      toast({ title: "Lỗi", description: String(e) })
    }
  }

  const parseCsvText = (text: string) => {
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
    const out: Array<{ question_text: string; options: any; correct_answer: "A" | "B" | "C" | "D"; explanation?: string | null; tags?: string[] | null }> = []
    for (const row of parsed.data as any[]) {
      const q = (row.question || row.question_text || "").trim()
      const A = (row.A || row.optionA || row.option_a || "").trim()
      const B = (row.B || row.optionB || row.option_b || "").trim()
      const C = (row.C || row.optionC || row.option_c || "").trim()
      const D = (row.D || row.optionD || row.option_d || "").trim()
      const correct = (row.correct || row.correct_answer || "A").trim().toUpperCase()
      const explanation = (row.explanation || "").trim()
      const tagsArr = (row.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean)
      if (!q || !A || !B || !C || !D) continue
      if (!["A", "B", "C", "D"].includes(correct)) continue
      out.push({ question_text: q, options: { A, B, C, D }, correct_answer: correct as any, explanation: explanation || null, tags: tagsArr.length ? tagsArr : null })
    }
    return out
  }

  const handleImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text()
        const rows = parseCsvText(text)
        const inserted = await bulkInsertQuizBank(rows)
        toast({ title: "Import CSV", description: `Đã nhập ${inserted} câu hỏi` })
      } else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
        const ab = await file.arrayBuffer()
        const wb = XLSX.read(ab)
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[]
        const csv = Papa.unparse(json)
        const rows = parseCsvText(csv)
        const inserted = await bulkInsertQuizBank(rows)
        toast({ title: "Import Excel", description: `Đã nhập ${inserted} câu hỏi` })
      } else {
        toast({ title: "Định dạng không hỗ trợ", description: "Chỉ hỗ trợ .csv, .xlsx, .xls" })
        return
      }
      await load()
    } catch (e) {
      toast({ title: "Import lỗi", description: String(e) })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDownloadTemplate = () => {
    const csv = Papa.unparse([
      { question: "1 + 1 = ?", A: "1", B: "2", C: "3", D: "4", correct: "B", explanation: "1+1=2", tags: "math, basic" },
    ])
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "quiz_bank_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const distinctTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach((it) => (it.tags || []).forEach((t) => set.add(t)))
    return Array.from(set)
  }, [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Quiz Bank</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm câu hỏi" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Input placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} className="w-40" />
              <Button onClick={load} variant="outline">Tải</Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Import
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleImportFiles(e.target.files)} />
              <Button variant="ghost" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" /> Template
              </Button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
              {loading ? (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              ) : items.length === 0 ? (
                <Card><CardContent className="p-4 text-sm text-muted-foreground">Không có câu hỏi</CardContent></Card>
              ) : (
                items.map((row) => (
                  <Card key={row.id} className="border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="font-medium">{row.question_text}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><Badge variant="outline">A</Badge> {row.options?.A}</div>
                            <div><Badge variant="outline">B</Badge> {row.options?.B}</div>
                            <div><Badge variant="outline">C</Badge> {row.options?.C}</div>
                            <div><Badge variant="outline">D</Badge> {row.options?.D}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">Đúng: {row.correct_answer}</div>
                          {row.explanation && <div className="text-xs text-muted-foreground">Giải thích: {row.explanation}</div>}
                          <div className="flex flex-wrap gap-1">
                            {(row.tags || []).map((t) => (
                              <Badge key={t} variant="secondary">{t}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
                            <Pencil className="h-4 w-4 mr-1" /> Sửa
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Xóa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{formMode === "create" ? "Thêm câu hỏi" : "Sửa câu hỏi"}</div>
              {formMode === "edit" && (
                <Button variant="ghost" size="sm" onClick={resetForm}><Wand2 className="h-4 w-4 mr-1" /> Mới</Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Câu hỏi</Label>
              <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Đáp án A</Label>
                <Input value={optionA} onChange={(e) => setOptionA(e.target.value)} />
              </div>
              <div>
                <Label>Đáp án B</Label>
                <Input value={optionB} onChange={(e) => setOptionB(e.target.value)} />
              </div>
              <div>
                <Label>Đáp án C</Label>
                <Input value={optionC} onChange={(e) => setOptionC(e.target.value)} />
              </div>
              <div>
                <Label>Đáp án D</Label>
                <Input value={optionD} onChange={(e) => setOptionD(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Đáp án đúng (A/B/C/D)</Label>
              <Input value={correct} onChange={(e) => setCorrect((e.target.value.toUpperCase() as any) || "A")} />
            </div>
            <div className="space-y-2">
              <Label>Giải thích</Label>
              <Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Tags (phân cách bằng dấu phẩy)</Label>
              <Input placeholder="math, easy" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSave}><Plus className="h-4 w-4 mr-2" /> {formMode === "create" ? "Thêm" : "Lưu"}</Button>
              <Button variant="outline" onClick={resetForm}>Hủy</Button>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              CSV columns: question, A, B, C, D, correct, explanation, tags
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
