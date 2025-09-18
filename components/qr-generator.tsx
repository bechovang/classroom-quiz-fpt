"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QrCode, Download, RefreshCw, Copy, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import type { QRCodeData } from "@/types/classroom"

interface QRGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRGenerator({ open, onOpenChange }: QRGeneratorProps) {
  const { state } = useClassroom()
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [points, setPoints] = useState("10")
  const [qrData, setQrData] = useState<QRCodeData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateQRCode = async (data: string) => {
    try {
      // Simple QR code generation using a placeholder
      // In a real app, you'd use a library like qrcode.js
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas size
      canvas.width = 200
      canvas.height = 200

      // Clear canvas
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 200, 200)

      // Draw QR code pattern (simplified)
      ctx.fillStyle = "#000000"
      const cellSize = 10
      const pattern = generateQRPattern(data)

      for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
          if (pattern[i][j]) {
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize)
          }
        }
      }

      return canvas.toDataURL()
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      return ""
    }
  }

  const generateQRPattern = (data: string): boolean[][] => {
    // Simple pattern generation based on data hash
    const hash = data.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const pattern: boolean[][] = []

    for (let i = 0; i < 20; i++) {
      pattern[i] = []
      for (let j = 0; j < 20; j++) {
        // Create a pseudo-random pattern based on position and hash
        const value = (i * 20 + j + hash) % 3
        pattern[i][j] = value === 0
      }
    }

    // Add corner markers
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          pattern[i][j] = true
          pattern[i][19 - j] = true
          pattern[19 - i][j] = true
        }
      }
    }

    return pattern
  }

  const handleGenerateQR = async () => {
    if (!selectedStudent || !state.currentClass) return

    const student = state.currentClass.students.find((s) => s.id === selectedStudent)
    if (!student) return

    const timestamp = Date.now()
    const hash = btoa(`${selectedStudent}_${timestamp}_${state.currentClass.id}`).slice(0, 8)

    const qrCodeData: QRCodeData = {
      studentId: selectedStudent,
      timestamp,
      classId: state.currentClass.id,
      hash,
      points: Number.parseInt(points) || 10,
    }

    setQrData(qrCodeData)

    // Generate QR code
    const dataString = JSON.stringify(qrCodeData)
    const qrUrl = await generateQRCode(dataString)
    setQrCodeUrl(qrUrl)
  }

  const handleCopyCode = async () => {
    if (!qrData) return

    const codeText = `${qrData.hash}-${qrData.studentId.slice(-4)}`
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleDownload = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.download = `qr-code-${qrData?.studentId || "student"}.png`
    link.href = qrCodeUrl
    link.click()
  }

  const handleReset = () => {
    setQrData(null)
    setQrCodeUrl("")
    setSelectedStudent("")
    setPoints("10")
    setCopied(false)
  }

  useEffect(() => {
    if (!open) {
      handleReset()
    }
  }, [open])

  if (!state.currentClass) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-primary" />
            <span>Generate QR Code</span>
          </DialogTitle>
          <DialogDescription>Create a QR code for students to scan and claim points.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!qrData ? (
            <>
              {/* Student Selection */}
              <div className="space-y-2">
                <Label htmlFor="student-select">Select Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.currentClass.students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{student.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {student.score}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Points Input */}
              <div className="space-y-2">
                <Label htmlFor="points-input">Points to Award</Label>
                <Input
                  id="points-input"
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>

              {/* Generate Button */}
              <Button onClick={handleGenerateQR} disabled={!selectedStudent} className="w-full" size="lg">
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
              </Button>
            </>
          ) : (
            <>
              {/* Generated QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-lg">
                    QR Code for {state.currentClass.students.find((s) => s.id === qrData.studentId)?.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code Display */}
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border-2 border-primary/20">
                      <canvas ref={canvasRef} className="block" />
                    </div>
                  </div>

                  {/* QR Code Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Points:</span>
                      <Badge className="bg-accent text-accent-foreground">{qrData.points} points</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Valid for:</span>
                      <span className="font-medium">5 minutes</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Code:</span>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {qrData.hash}-{qrData.studentId.slice(-4)}
                        </code>
                        <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-6 w-6 p-0">
                          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button onClick={handleDownload} variant="outline" className="flex-1 bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={handleReset} variant="outline" className="flex-1 bg-transparent">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
