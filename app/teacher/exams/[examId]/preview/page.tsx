"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TeacherLayout } from "@/components/layouts/teacher-layout"
import { getExamById, getExamQuestions } from "@/lib/actions/exam-actions"
import type { QuestionType, ExamType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Eye, ArrowLeft, CheckCircle, XCircle, BarChart } from "lucide-react"

export default function ExamPreviewPage({ params }: { params: { examId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [exam, setExam] = useState<ExamType | null>(null)
  const [questions, setQuestions] = useState<QuestionType[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answer, setAnswer] = useState("")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [answers, setAnswers] = useState<{
    [questionId: string]: {
      textAnswer?: string
      selectedOptions?: string[]
      isCorrect: boolean
      earnedPoints: number
    }
  }>({})

  useEffect(() => {
    async function loadExamAndQuestions() {
      try {
        const examData = await getExamById(params.examId)
        setExam(examData)

        const questionsData = await getExamQuestions(params.examId)
        setQuestions(questionsData)
      } catch (error) {
        console.error("Failed to load exam or questions:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger l'examen ou les questions",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadExamAndQuestions()
  }, [params.examId, toast])

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex]
      setTimeLeft(question.duration)

      // Restore previous answer if exists
      if (answers[question.id]) {
        if (question.type === "direct" && answers[question.id].textAnswer) {
          setAnswer(answers[question.id].textAnswer || "")
        } else if (question.type === "qcm" && answers[question.id].selectedOptions) {
          setSelectedOptions(answers[question.id].selectedOptions || [])
        }
      } else {
        setAnswer("")
        setSelectedOptions([])
      }

      // Simulate timer countdown
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer)
            return 0
          }
          return prevTime - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentQuestionIndex, questions, answers])

  function handlePreviousQuestion() {
    saveCurrentAnswer()
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  function handleNextQuestion() {
    saveCurrentAnswer()
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Show results if at the last question
      setShowResults(true)
    }
  }

  function saveCurrentAnswer() {
    if (questions.length === 0 || currentQuestionIndex >= questions.length) return

    const question = questions[currentQuestionIndex]
    let isCorrect = false
    let earnedPoints = 0

    if (question.type === "direct") {
      // Check if direct answer is correct
      if (answer.toLowerCase() === question.answer.toLowerCase()) {
        isCorrect = true
        earnedPoints = question.points
      }

      setAnswers({
        ...answers,
        [question.id]: {
          textAnswer: answer,
          isCorrect,
          earnedPoints,
        },
      })
    } else if (question.type === "qcm") {
      // Check if QCM answer is correct
      const correctOptions = question.options.filter((opt) => opt.isCorrect).map((opt) => opt.id)

      if (question.multipleAnswers) {
        // All correct options must be selected and no incorrect ones
        const allCorrectSelected = correctOptions.every((id) => selectedOptions.includes(id))
        const noIncorrectSelected = selectedOptions.every((id) => correctOptions.includes(id))

        if (allCorrectSelected && noIncorrectSelected) {
          isCorrect = true
          earnedPoints = question.points
        }
      } else {
        // Single answer question
        if (selectedOptions.length === 1 && correctOptions.includes(selectedOptions[0])) {
          isCorrect = true
          earnedPoints = question.points
        }
      }

      setAnswers({
        ...answers,
        [question.id]: {
          selectedOptions,
          isCorrect,
          earnedPoints,
        },
      })
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

  function calculateScore() {
    if (questions.length === 0) return { score: 0, totalPoints: 0, earnedPoints: 0, correctAnswers: 0 }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
    const earnedPoints = Object.values(answers).reduce((sum, a) => sum + a.earnedPoints, 0)
    const correctAnswers = Object.values(answers).filter((a) => a.isCorrect).length

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    return { score, totalPoints, earnedPoints, correctAnswers }
  }

  function handleFinishExam() {
    saveCurrentAnswer()
    setShowResults(true)
  }

  function handleContinueExam() {
    setShowResults(false)
  }

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="text-center py-8">Chargement de l'examen...</div>
      </TeacherLayout>
    )
  }

  if (!exam || questions.length === 0) {
    return (
      <TeacherLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">Examen non trouvé ou aucune question</h2>
          <p className="text-muted-foreground mb-4">
            L'examen que vous recherchez n'existe pas ou ne contient pas de questions.
          </p>
          <Button onClick={() => router.push(`/teacher/exams/${params.examId}/questions`)}>
            Retour à la gestion des questions
          </Button>
        </div>
      </TeacherLayout>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const scoreData = calculateScore()

  // Results view
  if (showResults) {
    return (
      <TeacherLayout>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={() => router.push(`/teacher/exams/${params.examId}/questions`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour aux questions
            </Button>
            <h1 className="text-2xl font-bold">Résultats de la prévisualisation</h1>
          </div>
          <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md">
            <Eye className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Mode prévisualisation</span>
          </div>
        </div>

        <Card className="max-w-3xl mx-auto mb-6">
          <CardHeader>
            <CardTitle>Score final</CardTitle>
            <CardDescription>Résumé de la performance pour cet examen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-5xl font-bold mb-2">{scoreData.score}/100</div>
              <p className="text-muted-foreground">
                {scoreData.correctAnswers} réponses correctes sur {questions.length} questions
              </p>
              <p className="text-muted-foreground">
                {scoreData.earnedPoints} points obtenus sur {scoreData.totalPoints} points possibles
              </p>
            </div>
            <Progress value={scoreData.score} className="h-4 mt-4" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleContinueExam}>Continuer la prévisualisation</Button>
          </CardFooter>
        </Card>

        <h2 className="text-xl font-bold mb-4 max-w-3xl mx-auto">Détail des questions</h2>

        <div className="space-y-4 max-w-3xl mx-auto">
          {questions.map((question, index) => {
            const answer = answers[question.id] || { isCorrect: false, earnedPoints: 0 }

            return (
              <Card key={question.id} className={answer.isCorrect ? "border-green-200" : "border-red-200"}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    <div className="flex items-center">
                      {answer.isCorrect ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="font-medium">
                            {answer.earnedPoints}/{question.points} points
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
                      <div className="p-3 bg-muted rounded-md">
                        {question.type === "direct"
                          ? answer.textAnswer || "Aucune réponse"
                          : question.options
                              .filter((opt) => answer.selectedOptions?.includes(opt.id))
                              .map((opt) => opt.text)
                              .join(", ") || "Aucune réponse"}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Réponse correcte:</p>
                      <div className="p-3 bg-muted rounded-md">
                        {question.type === "direct"
                          ? question.answer
                          : question.options
                              .filter((opt) => opt.isCorrect)
                              .map((opt) => opt.text)
                              .join(", ")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TeacherLayout>
    )
  }

  // Question view
  return (
    <TeacherLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => router.push(`/teacher/exams/${params.examId}/questions`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Prévisualisation de l'examen</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFinishExam}>
            <BarChart className="h-4 w-4 mr-1" />
            Voir les résultats
          </Button>
          <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md">
            <Eye className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Mode prévisualisation</span>
          </div>
        </div>
      </div>

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
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                  <p className="text-sm font-medium">Réponse correcte (visible uniquement en prévisualisation):</p>
                  <p className="mt-1">{currentQuestion.answer}</p>
                </div>
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
                        <Label
                          htmlFor={`option-${index}`}
                          className={option.isCorrect ? "font-medium text-green-600" : ""}
                        >
                          {option.text}
                          {option.isCorrect && (
                            <span className="ml-2 text-xs text-green-600">
                              (Correcte - visible en prévisualisation)
                            </span>
                          )}
                        </Label>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 w-full">
                        <RadioGroup value={selectedOptions[0]} onValueChange={handleOptionChange}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={`option-${index}`} />
                            <Label
                              htmlFor={`option-${index}`}
                              className={option.isCorrect ? "font-medium text-green-600" : ""}
                            >
                              {option.text}
                              {option.isCorrect && (
                                <span className="ml-2 text-xs text-green-600">
                                  (Correcte - visible en prévisualisation)
                                </span>
                              )}
                            </Label>
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
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <Button onClick={handleNextQuestion}>
            {currentQuestionIndex === questions.length - 1 ? "Terminer l'examen" : "Suivant"}
            {currentQuestionIndex < questions.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations sur la prévisualisation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Cette prévisualisation vous permet de voir l'examen tel qu'il apparaîtra aux étudiants, avec quelques
              différences:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Les réponses correctes sont indiquées (elles ne seront pas visibles pour les étudiants)</li>
              <li>Vous pouvez naviguer librement entre les questions (les étudiants ne le pourront pas)</li>
              <li>Vous pouvez voir les résultats à tout moment en cliquant sur "Voir les résultats"</li>
              <li>Le temps continue à s'écouler mais n'a pas d'impact sur la navigation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
