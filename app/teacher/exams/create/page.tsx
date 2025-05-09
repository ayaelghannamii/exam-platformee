"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TeacherLayout } from "@/components/layouts/teacher-layout"
import { createExam } from "@/lib/actions/exam-actions"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function CreateExamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const targetAudience = formData.get("targetAudience") as string

    try {
      if (!user?.id) {
        throw new Error("Utilisateur non authentifié")
      }

      const result = await createExam({
        title,
        description,
        targetAudience,
        teacherId: user.id,
      })

      if (result.success) {
        toast({
          title: "Succès",
          description: "L'examen a été créé avec succès",
        })
        router.push(`/teacher/exams/${result.examId}/questions`)
      } else {
        throw new Error(result.error || "Erreur lors de la création de l'examen")
      }
    } catch (error) {
      console.error("Failed to create exam:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer l'examen",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TeacherLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Créer un nouvel examen</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Informations de l'examen</CardTitle>
            <CardDescription>Remplissez les détails de votre nouvel examen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'examen</Label>
              <Input id="title" name="title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décrivez le contenu et les objectifs de cet examen"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Public ciblé</Label>
              <Input id="targetAudience" name="targetAudience" placeholder="Ex: 2e année MIP, S4, groupe A" required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/teacher/dashboard")}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création en cours..." : "Créer l'examen"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </TeacherLayout>
  )
}
