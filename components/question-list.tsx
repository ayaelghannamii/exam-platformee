"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit, Clock, FileText } from "lucide-react"
import type { QuestionType } from "@/lib/types"
import { deleteQuestion } from "@/lib/actions/exam-actions"
import { useToast } from "@/hooks/use-toast"

interface QuestionListProps {
  questions: QuestionType[]
  examId: string
  onQuestionsUpdated: (questions: QuestionType[]) => void
}

export function QuestionList({ questions, examId, onQuestionsUpdated }: QuestionListProps) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Ajouter un effet pour surveiller les changements de questions
  useEffect(() => {
    console.log("Questions mises à jour:", questions.length)
  }, [questions])

  async function handleDeleteQuestion(questionId: string) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) {
      setIsDeleting(questionId)

      try {
        const result = await deleteQuestion(questionId, examId)

        if (result.success) {
          const updatedQuestions = questions.filter((q) => q.id !== questionId)
          onQuestionsUpdated([...updatedQuestions]) // Utiliser un nouveau tableau pour forcer le rendu

          toast({
            title: "Succès",
            description: "La question a été supprimée",
          })
        } else {
          throw new Error(result.error || "Erreur lors de la suppression de la question")
        }
      } catch (error) {
        console.error("Failed to delete question:", error)
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la question",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(null)
      }
    }
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Aucune question n'a encore été ajoutée à cet examen.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions de l'examen ({questions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-md p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-medium mr-2">Question {index + 1}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {question.type === "direct" ? "Question directe" : "QCM"}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{question.text}</p>
                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {question.duration}s
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {question.points} points
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={isDeleting === question.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
