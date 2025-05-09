"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StudentLayout } from "@/components/layouts/student-layout"
import { useAuth } from "@/context/auth-context"
import { getExamResults } from "@/lib/actions/exam-actions"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle } from "lucide-react"

type ResultType = {
  examTitle: string
  examDescription: string
  score: number
  totalQuestions: number
  correctAnswers: number
  questions: {
    id: string
    text: string
    type: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    points: number
    earnedPoints: number
  }[]
}

export default function ResultsPage({ params }: { params: { attemptId: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [results, setResults] = useState<ResultType | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadResults() {
      try {
        if (!user?.id) {
          router.push("/login")
          return
        }

        const result = await getExamResults(params.attemptId, user.id)

        if (result.success) {
          setResults(result.data)
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les résultats de l'examen",
            variant: "destructive",
          })
          router.push("/student/dashboard")
        }
      } catch (error) {
        console.error("Failed to load results:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les résultats",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadResults()
  }, [params.attemptId, user, router, toast])

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="text-center py-8">Chargement des résultats...</div>
      </StudentLayout>
    )
  }

  if (!results) {
    return (
      <StudentLayout>
        <div className="text-center py-8">Résultats non trouvés</div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Résultats de l'examen</h1>
        <p className="text-muted-foreground">{results.examTitle}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Score final</CardTitle>
          <CardDescription>Votre performance pour cet examen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-5xl font-bold mb-2">{results.score}/100</div>
            <p className="text-muted-foreground">
              {results.correctAnswers} réponses correctes sur {results.totalQuestions} questions
            </p>
          </div>
          <Progress value={results.score} className="h-4 mt-4" />
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">Détail des questions</h2>

      <div className="space-y-4">
        {results.questions.map((question, index) => (
          <Card key={question.id} className={question.isCorrect ? "border-green-200" : "border-red-200"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">Question {index + 1}</CardTitle>
                <div className="flex items-center">
                  {question.isCorrect ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span className="font-medium">
                        {question.earnedPoints}/{question.points} points
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-1" />
                      <span className="font-medium">0/{question.points} points</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{question.text}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Votre réponse:</p>
                  <div className="p-3 bg-muted rounded-md">{question.userAnswer || "Aucune réponse"}</div>
                </div>
                <div>
                  <p className="font-medium mb-1">Réponse correcte:</p>
                  <div className="p-3 bg-muted rounded-md">{question.correctAnswer}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button onClick={() => router.push("/student/dashboard")}>Retour au tableau de bord</Button>
      </div>
    </StudentLayout>
  )
}
