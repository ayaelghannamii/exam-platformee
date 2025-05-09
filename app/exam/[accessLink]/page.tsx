"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/context/auth-context"
import { getExamByAccessLink, submitAnswer, completeExam } from "@/lib/actions/exam-actions"
import type { ExamType, QuestionType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ExamPage({ params }: { params: { accessLink: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [exam, setExam] = useState<ExamType | null>(null)
  const [questions, setQuestions] = useState<QuestionType[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answer, setAnswer] = useState("")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [geolocation, setGeolocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Request geolocation permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Geolocation error:", error)
          setError(
            "Impossible d'accéder à votre position. Veuillez autoriser l'accès à la géolocalisation pour continuer.",
          )
        },
      )
    }

    async function loadExam() {
      try {
        if (!user?.id) {
          router.push(`/login?redirect=/exam/${params.accessLink}`)
          return
        }

        console.log("Chargement de l'examen avec le lien:", params.accessLink)
        const result = await getExamByAccessLink(params.accessLink, user.id)

        if (result.exam) {
          setExam(result.exam)
          setQuestions(result.questions)
          setAttemptId(result.attemptId)

          if (result.currentQuestionIndex !== undefined) {
            setCurrentQuestionIndex(result.currentQuestionIndex)
          }

          if (result.completed) {
            router.push(`/student/results/${result.attemptId}`)
          }
        } else {
          setError("Examen non trouvé ou vous n'avez pas accès à cet examen")
          toast({
            title: "Erreur",
            description: "Examen non trouvé ou vous n'avez pas accès à cet examen",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to load exam:", error)
        setError("Impossible de charger l'examen. Veuillez réessayer.")
        toast({
          title: "Erreur",
          description: "Impossible de charger l'examen",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadExam()
  }, [params.accessLink, user, router, toast])

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex]
      setTimeLeft(question.duration)
      setAnswer("")
      setSelectedOptions([])

      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer)
            handleSubmitAnswer()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentQuestionIndex, questions])

  async function handleSubmitAnswer() {
    if (isSubmitting || !attemptId) return

    setIsSubmitting(true)

    try {
      const question = questions[currentQuestionIndex]
      const answerData: any = {
        attemptId,
        questionId: question.id,
      }

      if (question.type === "direct") {
        answerData.textAnswer = answer
      } else if (question.type === "qcm") {
        answerData.selectedOptions = selectedOptions
      }

      const result = await submitAnswer(answerData)

      if (result.success) {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else {
          // Complete the exam
          const completeResult = await completeExam(attemptId)

          if (completeResult.success) {
            toast({
              title: "Examen terminé",
              description: "Votre examen a été soumis avec succès",
            })
            router.push(`/student/results/${attemptId}`)
          } else {
            throw new Error(completeResult.error || "Erreur lors de la finalisation de l'examen")
          }
        }
      } else {
        throw new Error(result.error || "Erreur lors de la soumission de la réponse")
      }
    } catch (error) {
      console.error("Failed to submit answer:", error)
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre réponse",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOptionChange(optionId: string) {
    const currentQuestion = questions[currentQuestionIndex]

    if (currentQuestion.type === "qcm") {
      // For single-choice QCM
      setSelectedOptions([optionId])
    }
  }

  function handleCheckboxChange(optionId: string) {
    setSelectedOptions((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId)
      } else {
        return [...prev, optionId]
      }
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">Chargement de l'examen...</CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent className="py-6 text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/student/dashboard")} className="mt-4">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-bold mb-2">Examen non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              L'examen que vous recherchez n'existe pas ou vous n'y avez pas accès.
            </p>
            <Button onClick={() => router.push("/student/dashboard")}>Retour au tableau de bord</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!geolocation) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Autorisation requise</CardTitle>
            <CardDescription>Veuillez autoriser l'accès à votre position pour continuer l'examen</CardDescription>
          </CardHeader>
          <CardContent className="py-6 text-center">
            <p className="mb-4">
              Pour des raisons de sécurité, nous avons besoin de connaître votre position géographique.
            </p>
            <Button onClick={() => window.location.reload()}>Autoriser la géolocalisation</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription>{exam.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{timeLeft}s</div>
              <div className="text-xs text-muted-foreground">
                Question {currentQuestionIndex + 1}/{questions.length}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />

          <div className="py-4">
            <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>

            {currentQuestion.attachmentUrl && (
              <div className="mb-4">
                {currentQuestion.attachmentType === "image" && (
                  <img
                    src={currentQuestion.attachmentUrl || "/placeholder.svg"}
                    alt="Question attachment"
                    className="max-w-full rounded-md"
                  />
                )}
                {currentQuestion.attachmentType === "audio" && (
                  <audio src={currentQuestion.attachmentUrl} controls className="w-full" />
                )}
                {currentQuestion.attachmentType === "video" && (
                  <video src={currentQuestion.attachmentUrl} controls className="w-full rounded-md" />
                )}
              </div>
            )}

            {currentQuestion.type === "direct" ? (
              <div className="space-y-2">
                <Label htmlFor="answer">Votre réponse</Label>
                <Input
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Saisissez votre réponse ici"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {currentQuestion.multipleAnswers ? (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`option-${index}`}
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => handleCheckboxChange(option.id)}
                        />
                        <Label htmlFor={`option-${index}`}>{option.text}</Label>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 w-full">
                        <RadioGroup value={selectedOptions[0]} onValueChange={handleOptionChange}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`}>{option.text}</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmitAnswer} disabled={isSubmitting}>
            {isSubmitting ? "Soumission..." : "Soumettre la réponse"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
