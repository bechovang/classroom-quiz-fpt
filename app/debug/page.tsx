"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { createClassSession, listClassSessions } from "@/lib/supabaseApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
  const [log, setLog] = useState<string>("")
  const [busy, setBusy] = useState(false)

  const append = (message: string) => setLog((prev) => prev + message + "\n")

  const testSelect = async () => {
    setBusy(true)
    setLog("")
    try {
      append(`NEXT_PUBLIC_SUPABASE_URL present: ${Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)}`)
      append(`NEXT_PUBLIC_SUPABASE_ANON_KEY present: ${Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}`)

      append("Running simple select on class_sessions ...")
      const { data, error } = await supabase.from("class_sessions").select("id, class_code").limit(1)
      if (error) throw error
      append(`Select OK. Rows: ${data?.length || 0}`)

      append("Listing sessions via API helper ...")
      const sessions = await listClassSessions()
      append(`API helper OK. Sessions: ${sessions.length}`)
      append("Done.")
    } catch (err) {
      append(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const testInsert = async () => {
    setBusy(true)
    try {
      append("Creating test class_session ...")
      const created = await createClassSession()
      append(`Created session id=${created.id}, code=${created.class_code}`)
    } catch (err) {
      append(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connectivity Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Use this page to verify environment variables and basic database connectivity.
            </div>
            <div className="flex gap-2">
              <Button onClick={testSelect} disabled={busy}>Test SELECT</Button>
              <Button onClick={testInsert} variant="outline" disabled={busy}>Test INSERT (create session)</Button>
            </div>
            <pre className="mt-4 p-3 bg-muted rounded text-xs whitespace-pre-wrap">{log || "No output yet."}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


