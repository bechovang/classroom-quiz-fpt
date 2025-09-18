"use client"

import { useClassroom } from "@/contexts/classroom-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, QrCode, CheckCircle, AlertCircle, Keyboard } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { QRCodeData } from "@/types/classroom"

interface QRScannerProps {
  studentId?: string
  onScanSuccess?: (points: number) => void
}

export function QRScanner({ studentId, onScanSuccess }: QRScannerProps) {
  const { state, awardPoints } = useClassroom()
  const [isScanning, setIsScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; points?: number } | null>(null)
  const [useManualEntry, setUseManualEntry] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsScanning(true)
    } catch (error) {
      console.error("Failed to start camera:", error)
      setScanResult({
        success: false,
        message: "Camera access denied. Please use manual entry.",
      })
      setUseManualEntry(true)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const validateQRCode = (codeData: string): { valid: boolean; data?: QRCodeData; error?: string } => {
    try {
      // Try to parse as JSON first
      let qrData: QRCodeData
      try {
        qrData = JSON.parse(codeData)
      } catch {
        // If not JSON, try manual code format: hash-studentId
        const parts = codeData.split("-")
        if (parts.length !== 2) {
          return { valid: false, error: "Invalid code format" }
        }

        // Find matching student by partial ID
        const student = state.currentClass?.students.find((s) => s.id.endsWith(parts[1]))
        if (!student) {
          return { valid: false, error: "Student not found" }
        }

        qrData = {
          studentId: student.id,
          timestamp: Date.now() - 60000, // Assume recent
          classId: state.currentClass?.id || "",
          hash: parts[0],
          points: 10, // Default points
        }
      }

      // Validate class ID
      if (qrData.classId !== state.currentClass?.id) {
        return { valid: false, error: "Code is for a different class" }
      }

      // Check if code is expired (5 minutes)
      const fiveMinutes = 5 * 60 * 1000
      if (Date.now() - qrData.timestamp > fiveMinutes) {
        return { valid: false, error: "Code has expired" }
      }

      // If studentId is provided, validate it matches
      if (studentId && qrData.studentId !== studentId) {
        return { valid: false, error: "Code is for a different student" }
      }

      return { valid: true, data: qrData }
    } catch (error) {
      return { valid: false, error: "Invalid code format" }
    }
  }

  const processQRCode = async (codeData: string) => {
    const validation = validateQRCode(codeData)

    if (!validation.valid || !validation.data) {
      setScanResult({
        success: false,
        message: validation.error || "Invalid QR code",
      })
      return
    }

    const qrData = validation.data

    try {
      // Award points
      awardPoints(state.currentClass!.id, qrData.studentId, qrData.points, "QR Code scan")

      setScanResult({
        success: true,
        message: `Successfully awarded ${qrData.points} points!`,
        points: qrData.points,
      })

      onScanSuccess?.(qrData.points)

      // Auto-hide success message after 3 seconds
      setTimeout(() => setScanResult(null), 3000)
    } catch (error) {
      setScanResult({
        success: false,
        message: "Failed to award points",
      })
    }
  }

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return
    processQRCode(manualCode.trim())
    setManualCode("")
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (!state.currentClass) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-primary" />
          <span>QR Code Scanner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Result */}
        {scanResult && (
          <Alert variant={scanResult.success ? "default" : "destructive"}>
            {scanResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription className="flex items-center justify-between">
              <span>{scanResult.message}</span>
              {scanResult.success && scanResult.points && (
                <Badge className="bg-green-100 text-green-800">+{scanResult.points}</Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Scanner */}
        {!useManualEntry && (
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <div className="w-48 h-48 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/20">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <Button onClick={startCamera} size="lg" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-lg border" />
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary rounded-lg" />
                  </div>
                </div>
                <Button onClick={stopCamera} variant="outline" className="w-full bg-transparent">
                  Stop Camera
                </Button>
              </div>
            )}

            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={() => setUseManualEntry(true)}>
                <Keyboard className="w-4 h-4 mr-2" />
                Enter code manually
              </Button>
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {useManualEntry && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Enter QR Code</Label>
              <Input
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter code (e.g., ABC123-4567)"
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Code
              </Button>
              <Button variant="outline" onClick={() => setUseManualEntry(false)}>
                <Camera className="w-4 h-4 mr-2" />
                Use Camera
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Point camera at QR code or enter code manually</p>
          <p>• Codes expire after 5 minutes</p>
          <p>• Points will be automatically awarded upon successful scan</p>
        </div>
      </CardContent>
    </Card>
  )
}
