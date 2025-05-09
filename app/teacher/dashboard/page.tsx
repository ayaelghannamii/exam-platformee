"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getTeacherExams, deleteExam } from "@/lib/actions/exam-actions";
import { TeacherLayout } from "@/components/layouts/teacher-layout";
import type { ExamType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<ExamType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExams() {
      if (user?.id) {
        try {
          setError(null);
          const result = await getTeacherExams(user.id);
          console.log("Examens chargés:", result);
          setExams(result);
        } catch (error) {
          console.error("Failed to load exams:", error);
          setError(
            "Impossible de charger les examens. Veuillez rafraîchir la page."
          );
          toast({
            title: "Erreur",
            description: "Impossible de charger les examens",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadExams();
  }, [user, toast]);

  async function handleDeleteExam(examId: string) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet examen ?")) {
      try {
        await deleteExam(examId);
        setExams(exams.filter((exam) => exam.id !== examId));
        toast({
          title: "Succès",
          description: "L'examen a été supprimé",
        });
      } catch (error) {
        console.error("Failed to delete exam:", error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'examen",
          variant: "destructive",
        });
      }
    }
  }

  function handleRefresh() {
    setIsLoading(true);
    if (user?.id) {
      getTeacherExams(user.id)
        .then((result) => {
          setExams(result);
          setError(null);
        })
        .catch((error) => {
          console.error("Failed to refresh exams:", error);
          setError("Impossible de rafraîchir les examens.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }

  return (
    <TeacherLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Chargement..." : "Rafraîchir"}
          </Button>
          <Link href="/teacher/exams/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer un examen
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-8">Chargement des examens...</div>
      ) : exams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore créé d'examen.
            </p>
            <Link href="/teacher/exams/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Créer votre premier examen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{exam.title}</CardTitle>
                <CardDescription>{exam.targetAudience}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">
                  {exam.description}
                </p>
                <div className="text-sm">
                  <p>
                    <strong>Questions:</strong> {exam.questionCount || 0}
                  </p>
                  <p className="mt-2">
                    <strong>Lien d'accès:</strong>{" "}
                  </p>
                  {exam.accessLink ? (
                    <div className="mt-1 p-2 bg-muted rounded text-xs break-all">
                      {`${
                        typeof window !== "undefined"
                          ? window.location.origin
                          : ""
                      }/exam/${exam.accessLink}`}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Non généré</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="flex space-x-2">
                  <Link href={`/teacher/exams/${exam.id}/questions`}>
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-1" />
                      Questions
                    </Button>
                  </Link>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteExam(exam.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}
