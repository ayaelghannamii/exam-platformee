"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { StudentLayout } from "@/components/layouts/student-layout"
import { useAuth } from "@/context/auth-context"
import { getStudentExams, joinExamByLink } from "@/lib/actions/exam-actions"
import type { ExamAttemptType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [examAttempts, setExamAttempts] = useState<ExamAttemptType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examLink, setExamLink] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    loadExamAttempts()
  }, [user])

  async function loadExamAttempts() {
    if (user?.id) {
      try {
        setError(null)
        setIsLoading(true)
        const result = await getStudentExams(user.id)
        console.log("Tentatives d'examen chargées:", result)
        setExamAttempts(result)
      } catch (error) {
        console.error("Failed to load exam attempts:", error)
        setError("Impossible de charger vos examens. Veuillez rafraîchir la page.")
        toast({
          title: "Erreur",
          description: "Impossible de charger vos examens",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  async function handleJoinExam(e: React.FormEvent) {
    e.preventDefault()
    setIsJoining(true)
    setJoinError(null)

    try {
      if (!user?.id) {
        throw new Error("Utilisateur non authentifié")
      }

      // Extract the access link from the full URL if needed
      let accessLink = examLink.trim()
      if (accessLink.includes("/exam/")) {
        accessLink = accessLink.split("/exam/")[1].trim()
      }

      if (!accessLink) {
        throw new Error("Lien d'examen invalide")
      }

      console.log("Tentative d'accès à l'examen avec le lien:", accessLink)

      const result = await joinExamByLink({
        accessLink,
        studentId: user.id,
      })

      console.log("Résultat de la tentative d'accès:", result)

      if (result.success) {
        toast({
          title: "Succès",
          description: "Vous avez rejoint l'examen avec succès",
        })

        // Redirect to the exam page
        window.location.href = `/exam/${accessLink}`
      } else {
        throw new Error(result.error || "Erreur lors de l'accès à l'examen")
      }
    } catch (error) {
      console.error("Failed to join exam:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Impossible de rejoindre l'examen. Vérifiez le lien et réessayez."
      setJoinError(errorMessage)
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <StudentLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord étudiant</h1>
        <Button variant="outline" onClick={loadExamAttempts} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {isLoading ? "Chargement..." : "Rafraîchir"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mes examens</CardTitle>
              <CardDescription>Historique de vos examens et résultats</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Chargement des examens...</div>
              ) : examAttempts.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Vous n'avez pas encore participé à des examens.
                </div>
              ) : (
                <div className="space-y-4">
                  {examAttempts.map((attempt) => (
                    <div key={attempt.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{attempt.examTitle}</h3>
                          <p className="text-sm text-muted-foreground">{attempt.examDescription}</p>
                        </div>
                        <div className="flex items-center">
                          {attempt.completed ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Terminé</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">En cours</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {attempt.completed && (
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Score:</span>
                            <span className="font-medium">{attempt.score}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${attempt.score}%` }}></div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex justify-end">
                        {attempt.completed ? (
                          <Link href={`/student/results/${attempt.id}`}>
                            <Button size="sm" variant="outline">
                              Voir les résultats
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/exam/${attempt.examAccessLink}`}>
                            <Button size="sm">Continuer l'examen</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Rejoindre un examen</CardTitle>
              <CardDescription>Entrez le lien d'accès fourni par votre enseignant</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinExam}>
                <div className="space-y-4">
                  {joinError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{joinError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="examLink">Lien ou code de l'examen</Label>
                    <Input
                      id="examLink"
                      placeholder="https://example.com/exam/abc123 ou simplement abc123"
                      value={examLink}
                      onChange={(e) => setExamLink(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Vous pouvez entrer l'URL complète ou simplement le code d'accès.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isJoining}>
                    {isJoining ? "Accès en cours..." : "Accéder à l'examen"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  )
}
