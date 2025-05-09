"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { TeacherLayout } from "@/components/layouts/teacher-layout"
import { useToast } from "@/hooks/use-toast"
import { getExamById, addQuestion, getExamQuestions } from "@/lib/actions/exam-actions"
import type { QuestionType, ExamType } from "@/lib/types"
import { FileUpload } from "@/components/file-upload"
import { QuestionList } from "@/components/question-list"

export default function QuestionsPage({ params }: { params: { examId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [exam, setExam] = useState<ExamType | null>(null)
  const [questions, setQuestions] = useState<QuestionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [questionType, setQuestionType] = useState("direct")
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean }[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])
  const [tolerance, setTolerance] = useState(10)
  const [duration, setDuration] = useState(60)
  const [points, setPoints] = useState(1)
  const [attachment, setAttachment] = useState<File | null>(null)

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

  function addOption() {
    setOptions([...options, { text: "", isCorrect: false }])
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  function updateOption(index: number, text: string) {
    const newOptions = [...options]
    newOptions[index].text = text
    setOptions(newOptions)
  }

  function toggleCorrect(index: number) {
    const newOptions = [...options]
    newOptions[index].isCorrect = !newOptions[index].isCorrect
    setOptions(newOptions)
  }

  // Modifier la fonction handleSubmit pour s'assurer que les questions s'affichent correctement après l'ajout
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    const formData = new FormData(event.currentTarget)
    const text = formData.get("text") as string

    try {
      const questionData: any = {
        examId: params.examId,
        text,
        type: questionType,
        duration,
        points,
      }

      if (questionType === "direct") {
        questionData.answer = formData.get("answer") as string
        questionData.tolerance = tolerance
      } else if (questionType === "qcm") {
        // Vérifier qu'au moins une option est marquée comme correcte
        if (!options.some((opt) => opt.isCorrect)) {
          throw new Error("Veuillez sélectionner au moins une réponse correcte")
        }
        questionData.options = options
        questionData.multipleAnswers = options.filter((opt) => opt.isCorrect).length > 1
      }

      if (attachment) {
        questionData.attachmentType = attachment.type.split("/")[0]
        questionData.attachmentUrl = URL.createObjectURL(attachment)
      }

      const result = await addQuestion(questionData)

      if (result.success) {
        toast({
          title: "Succès",
          description: "La question a été ajoutée avec succès",
        })

        // Reset form
        event.currentTarget.reset()
        setOptions([
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ])
        setTolerance(10)
        setDuration(60)
        setPoints(1)
        setAttachment(null)

        // Refresh questions - Forcer la mise à jour
        const updatedQuestions = await getExamQuestions(params.examId)
        setQuestions([...updatedQuestions]) // Utiliser un nouveau tableau pour forcer le rendu
      } else {
        throw new Error(result.error || "Erreur lors de l'ajout de la question")
      }
    } catch (error) {
      console.error("Failed to add question:", error)
      toast({
        title: "Erreur",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Impossible d'ajouter la question",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="text-center py-8">Chargement...</div>
      </TeacherLayout>
    )
  }

  if (!exam) {
    return (
      <TeacherLayout>
        <div className="text-center py-8">Examen non trouvé</div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestion des questions</h1>
        <p className="text-muted-foreground">Examen: {exam.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une question</CardTitle>
              <CardDescription>Créez une nouvelle question pour cet examen</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="direct" onValueChange={setQuestionType}>
                <TabsList className="mb-4">
                  <TabsTrigger value="direct">Question directe</TabsTrigger>
                  <TabsTrigger value="qcm">QCM</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="text">Énoncé de la question</Label>
                      <Textarea
                        id="text"
                        name="text"
                        placeholder="Saisissez l'énoncé de votre question"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pièce jointe (optionnelle)</Label>
                      <FileUpload onFileSelected={setAttachment} accept="image/*,audio/*,video/*" />
                      {attachment && (
                        <div className="text-sm text-muted-foreground">Fichier sélectionné: {attachment.name}</div>
                      )}
                    </div>

                    <TabsContent value="direct" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="answer">Réponse correcte</Label>
                        <Input id="answer" name="answer" required />
                      </div>

                      <div className="space-y-2">
                        <Label>Tolérance d'erreur: {tolerance}%</Label>
                        <Slider
                          value={[tolerance]}
                          min={0}
                          max={50}
                          step={5}
                          onValueChange={(values) => setTolerance(values[0])}
                        />
                        <p className="text-xs text-muted-foreground">
                          Pourcentage de tolérance pour les erreurs de frappe ou de casse
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="qcm" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2 mt-2">
                            <Checkbox
                              id={`option-${index}`}
                              checked={option.isCorrect}
                              onCheckedChange={() => toggleCorrect(index)}
                            />
                            <Input
                              value={option.text}
                              onChange={(e) => updateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                              disabled={options.length <= 2}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addOption} className="mt-2">
                          Ajouter une option
                        </Button>
                      </div>
                    </TabsContent>

                    <div className="space-y-2">
                      <Label>Durée: {duration} secondes</Label>
                      <Slider
                        value={[duration]}
                        min={10}
                        max={300}
                        step={5}
                        onValueChange={(values) => setDuration(values[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Points: {points}</Label>
                      <Slider
                        value={[points]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(values) => setPoints(values[0])}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSaving}>
                      {isSaving ? "Enregistrement..." : "Ajouter la question"}
                    </Button>
                  </div>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <QuestionList
            questions={questions}
            examId={params.examId}
            onQuestionsUpdated={(updatedQuestions) => setQuestions(updatedQuestions)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/teacher/dashboard")}>
          Retour au tableau de bord
        </Button>

        <Button
          onClick={() => router.push(`/teacher/exams/${params.examId}/preview`)}
          disabled={questions.length === 0}
        >
          Prévisualiser l'examen
        </Button>
      </div>
    </TeacherLayout>
  )
}
