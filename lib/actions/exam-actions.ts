"use server"

import { query, generateId, mapExam, mapQuestion, mapAttempt } from "@/lib/db"
import type { ExamType, QuestionType } from "@/lib/types"

// Create a new exam
export async function createExam({
  title,
  description,
  targetAudience,
  teacherId,
}: {
  title: string
  description: string
  targetAudience: string
  teacherId: string
}) {
  try {
    // Generate a unique access link
    const accessLink = generateId().substring(0, 8)
    const examId = generateId()

    await query(
      `INSERT INTO examen (id, title, description, targetAudience, teacherId, accessLink)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [examId, title, description, targetAudience, teacherId, accessLink],
    )

    return { success: true, examId }
  } catch (error) {
    console.error("Create exam error:", error)
    return { success: false, error: "Une erreur est survenue lors de la création de l'examen" }
  }
}

// Get exams created by a teacher
export async function getTeacherExams(teacherId: string): Promise<ExamType[]> {
  try {
    if (!teacherId) {
      console.error("Teacher ID is missing")
      return []
    }

    console.log(`Recherche d'examens pour l'enseignant: ${teacherId}`)

    // Récupérer les examens avec le nombre de questions
    const exams = (await query(
      `SELECT e.*, COUNT(q.id) as questionCount
       FROM examen e
       LEFT JOIN question q ON e.id = q.examId
       WHERE e.teacherId = ?
       GROUP BY e.id`,
      [teacherId],
    )) as any[]

    console.log(`Examens trouvés: ${exams.length}`)
    return exams.map(mapExam)
  } catch (error) {
    console.error("Get teacher exams error:", error)
    throw new Error("Une erreur est survenue lors de la récupération des examens")
  }
}

// Get exam by ID
export async function getExamById(examId: string): Promise<ExamType> {
  try {
    const exams = (await query("SELECT * FROM examen WHERE id = ?", [examId])) as any[]

    if (exams.length === 0) {
      throw new Error("Examen non trouvé")
    }

    return mapExam(exams[0])
  } catch (error) {
    console.error("Get exam error:", error)
    throw new Error("Une erreur est survenue lors de la récupération de l'examen")
  }
}

// Delete an exam
export async function deleteExam(examId: string) {
  try {
    // La suppression en cascade s'occupera des questions, tentatives, etc.
    await query("DELETE FROM examen WHERE id = ?", [examId])
    return { success: true }
  } catch (error) {
    console.error("Delete exam error:", error)
    return { success: false, error: "Une erreur est survenue lors de la suppression de l'examen" }
  }
}

// Add a question to an exam
export async function addQuestion(questionData: any) {
  try {
    // Vérifier que les données essentielles sont présentes
    if (!questionData.examId || !questionData.text || !questionData.type) {
      return { success: false, error: "Données de question incomplètes" }
    }

    const questionId = generateId()
    const multipleAnswers =
      questionData.type === "qcm" &&
      questionData.options &&
      questionData.options.filter((opt: any) => opt.isCorrect).length > 1

    // Insérer la question
    await query(
      `INSERT INTO question 
       (id, examId, text, type, answer, tolerance, multipleAnswers, duration, points, attachmentType, attachmentUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questionId,
        questionData.examId,
        questionData.text,
        questionData.type,
        questionData.type === "direct" ? questionData.answer : null,
        questionData.type === "direct" ? questionData.tolerance || 0 : 0,
        multipleAnswers ? 1 : 0,
        questionData.duration,
        questionData.points,
        questionData.attachmentType || null,
        questionData.attachmentUrl || null,
      ],
    )

    // Insérer les options pour les QCM
    if (questionData.type === "qcm" && questionData.options) {
      for (const option of questionData.options) {
        const optionId = generateId()
        await query(
          `INSERT INTO option_question (id, questionId, text, isCorrect)
           VALUES (?, ?, ?, ?)`,
          [optionId, questionId, option.text, option.isCorrect ? 1 : 0],
        )
      }
    }

    return { success: true, questionId }
  } catch (error) {
    console.error("Add question error:", error)
    return { success: false, error: "Une erreur est survenue lors de l'ajout de la question" }
  }
}

// Get questions for an exam
export async function getExamQuestions(examId: string): Promise<QuestionType[]> {
  try {
    if (!examId) {
      throw new Error("ID d'examen non fourni")
    }

    // Récupérer les questions
    const questions = (await query("SELECT * FROM question WHERE examId = ?", [examId])) as any[]

    // Pour chaque question de type QCM, récupérer les options
    const result: QuestionType[] = []

    for (const question of questions) {
      if (question.type === "qcm") {
        const options = (await query("SELECT * FROM option_question WHERE questionId = ?", [question.id])) as any[]

        const mappedOptions = options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect === 1,
        }))

        result.push(mapQuestion(question, mappedOptions))
      } else {
        result.push(mapQuestion(question))
      }
    }

    console.log(`Récupération de ${result.length} questions pour l'examen ${examId}`)
    return result
  } catch (error) {
    console.error("Get exam questions error:", error)
    throw new Error("Une erreur est survenue lors de la récupération des questions")
  }
}

// Delete a question
export async function deleteQuestion(questionId: string, examId: string) {
  try {
    // La suppression en cascade s'occupera des options
    await query("DELETE FROM question WHERE id = ? AND examId = ?", [questionId, examId])
    return { success: true }
  } catch (error) {
    console.error("Delete question error:", error)
    return { success: false, error: "Une erreur est survenue lors de la suppression de la question" }
  }
}

// Get exam by access link
export async function getExamByAccessLink(accessLink: string, studentId: string) {
  try {
    console.log(`Recherche d'examen avec le lien d'accès: ${accessLink}`)

    // Récupérer l'examen
    const exams = (await query("SELECT * FROM examen WHERE accessLink = ?", [accessLink])) as any[]

    if (exams.length === 0) {
      console.log("Examen non trouvé avec ce lien d'accès")
      return { success: false, error: "Examen non trouvé" }
    }

    const exam = mapExam(exams[0])
    console.log(`Examen trouvé: ${exam.title} (ID: ${exam.id})`)

    // Récupérer les questions
    const questions = await getExamQuestions(exam.id)
    console.log(`Nombre de questions trouvées: ${questions.length}`)

    // Vérifier si l'étudiant a déjà une tentative
    const attempts = (await query("SELECT * FROM tentative WHERE examId = ? AND studentId = ?", [
      exam.id,
      studentId,
    ])) as any[]

    let attempt

    if (attempts.length === 0) {
      // Créer une nouvelle tentative
      const attemptId = generateId()
      await query(
        `INSERT INTO tentative (id, examId, studentId, startedAt, completed, currentQuestionIndex)
         VALUES (?, ?, ?, NOW(), 0, 0)`,
        [attemptId, exam.id, studentId],
      )

      // Récupérer la tentative créée
      const newAttempts = (await query("SELECT * FROM tentative WHERE id = ?", [attemptId])) as any[]

      attempt = mapAttempt(newAttempts[0], exam.title, exam.description, exam.accessLink)
      console.log(`Nouvelle tentative créée: ${attempt.id}`)
    } else {
      attempt = mapAttempt(attempts[0], exam.title, exam.description, exam.accessLink)
      console.log(`Tentative existante trouvée: ${attempt.id}, complétée: ${attempt.completed}`)
    }

    return {
      exam,
      questions,
      attemptId: attempt.id,
      currentQuestionIndex: attempt.currentQuestionIndex,
      completed: attempt.completed,
    }
  } catch (error) {
    console.error("Get exam by access link error:", error)
    throw new Error("Une erreur est survenue lors de la récupération de l'examen")
  }
}

// Join an exam by link
export async function joinExamByLink({ accessLink, studentId }: { accessLink: string; studentId: string }) {
  try {
    console.log(`Tentative de rejoindre l'examen avec le lien: ${accessLink}`)
    console.log(`Étudiant ID: ${studentId}`)

    if (!accessLink || !studentId) {
      console.error("Lien d'accès ou ID étudiant manquant")
      return { success: false, error: "Données incomplètes" }
    }

    // Vérifier que l'examen existe
    const exams = (await query("SELECT * FROM examen WHERE accessLink = ?", [accessLink])) as any[]

    if (exams.length === 0) {
      console.error(`Aucun examen trouvé avec le lien d'accès: ${accessLink}`)
      return { success: false, error: "Examen non trouvé" }
    }

    const exam = exams[0]
    console.log(`Examen trouvé: ${exam.title} (ID: ${exam.id})`)

    // Vérifier si l'étudiant a déjà une tentative
    const attempts = (await query("SELECT * FROM tentative WHERE examId = ? AND studentId = ?", [
      exam.id,
      studentId,
    ])) as any[]

    if (attempts.length > 0 && attempts[0].completed === 1) {
      console.log(`L'étudiant a déjà terminé cet examen (ID tentative: ${attempts[0].id})`)
      return { success: false, error: "Vous avez déjà terminé cet examen" }
    }

    if (attempts.length === 0) {
      // Créer une nouvelle tentative
      const attemptId = generateId()
      await query(
        `INSERT INTO tentative (id, examId, studentId, startedAt, completed, currentQuestionIndex)
         VALUES (?, ?, ?, NOW(), 0, 0)`,
        [attemptId, exam.id, studentId],
      )
      console.log(`Nouvelle tentative créée: ${attemptId}`)
    } else {
      console.log(`Tentative existante trouvée: ${attempts[0].id}, l'étudiant peut continuer`)
    }

    return { success: true }
  } catch (error) {
    console.error("Join exam error:", error)
    return { success: false, error: "Une erreur est survenue lors de l'accès à l'examen" }
  }
}

// Submit an answer
export async function submitAnswer({ attemptId, questionId, textAnswer, selectedOptions }: any) {
  try {
    // Vérifier que la tentative existe
    const attempts = (await query("SELECT * FROM tentative WHERE id = ?", [attemptId])) as any[]

    if (attempts.length === 0) {
      return { success: false, error: "Tentative non trouvée" }
    }

    const attempt = attempts[0]

    // Vérifier que la question existe
    const questions = (await query("SELECT * FROM question WHERE id = ?", [questionId])) as any[]

    if (questions.length === 0) {
      return { success: false, error: "Question non trouvée" }
    }

    const question = questions[0]

    // Déterminer si la réponse est correcte
    let isCorrect = false
    let earnedPoints = 0

    if (question.type === "direct") {
      // Pour les questions directes, vérifier avec tolérance
      if (textAnswer) {
        const tolerance = question.tolerance || 0

        // Comparaison simple de chaînes
        if (textAnswer.toLowerCase() === question.answer.toLowerCase()) {
          isCorrect = true
          earnedPoints = question.points
        } else if (tolerance > 0) {
          // Vérification simple de tolérance
          const similarity = calculateSimilarity(textAnswer.toLowerCase(), question.answer.toLowerCase())
          if (similarity >= (100 - tolerance) / 100) {
            isCorrect = true
            earnedPoints = question.points
          }
        }
      }
    } else if (question.type === "qcm") {
      // Pour les questions QCM
      if (selectedOptions && selectedOptions.length > 0) {
        // Récupérer les options correctes
        const correctOptions = (await query("SELECT id FROM option_question WHERE questionId = ? AND isCorrect = 1", [
          questionId,
        ])) as any[]

        const correctOptionIds = correctOptions.map((opt: any) => opt.id)

        if (question.multipleAnswers === 1) {
          // Toutes les options correctes doivent être sélectionnées et aucune incorrecte
          const allCorrectSelected = correctOptionIds.every((id: string) => selectedOptions.includes(id))
          const noIncorrectSelected = selectedOptions.every((id: string) => correctOptionIds.includes(id))

          if (allCorrectSelected && noIncorrectSelected) {
            isCorrect = true
            earnedPoints = question.points
          }
        } else {
          // Question à réponse unique
          if (correctOptionIds.includes(selectedOptions[0])) {
            isCorrect = true
            earnedPoints = question.points
          }
        }
      }
    }

    // Enregistrer la réponse
    const reponseId = generateId()
    await query(
      `INSERT INTO reponse (id, tentativeId, questionId, textAnswer, isCorrect, earnedPoints, submittedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [reponseId, attemptId, questionId, textAnswer || null, isCorrect ? 1 : 0, earnedPoints],
    )

    // Pour les QCM, enregistrer les options sélectionnées
    if (question.type === "qcm" && selectedOptions && selectedOptions.length > 0) {
      for (const optionId of selectedOptions) {
        await query(
          `INSERT INTO reponse_option (id, reponseId, optionId)
           VALUES (?, ?, ?)`,
          [generateId(), reponseId, optionId],
        )
      }
    }

    // Mettre à jour l'index de la question courante
    await query("UPDATE tentative SET currentQuestionIndex = currentQuestionIndex + 1 WHERE id = ?", [attemptId])

    return { success: true }
  } catch (error) {
    console.error("Submit answer error:", error)
    return { success: false, error: "Une erreur est survenue lors de la soumission de la réponse" }
  }
}

// Complete an exam
export async function completeExam(attemptId: string) {
  try {
    // Vérifier que la tentative existe
    const attempts = (await query(
      "SELECT t.*, e.id as examId FROM tentative t JOIN examen e ON t.examId = e.id WHERE t.id = ?",
      [attemptId],
    )) as any[]

    if (attempts.length === 0) {
      return { success: false, error: "Tentative non trouvée" }
    }

    const attempt = attempts[0]

    // Récupérer toutes les questions de l'examen
    const questions = (await query("SELECT * FROM question WHERE examId = ?", [attempt.examId])) as any[]

    // Récupérer les réponses de la tentative
    const answers = (await query("SELECT * FROM reponse WHERE tentativeId = ?", [attemptId])) as any[]

    // Calculer le score
    const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0)
    const earnedPoints = answers.reduce((sum: number, a: any) => sum + a.earnedPoints, 0)

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    // Mettre à jour la tentative
    await query("UPDATE tentative SET completed = 1, completedAt = NOW(), score = ? WHERE id = ?", [score, attemptId])

    return { success: true }
  } catch (error) {
    console.error("Complete exam error:", error)
    return { success: false, error: "Une erreur est survenue lors de la finalisation de l'examen" }
  }
}

// Get student exams
export async function getStudentExams(studentId: string) {
  try {
    if (!studentId) {
      console.error("Student ID is missing")
      return []
    }

    console.log(`Recherche de tentatives pour l'étudiant: ${studentId}`)

    // Récupérer les tentatives avec les informations de l'examen
    const attempts = (await query(
      `SELECT t.*, e.title as examTitle, e.description as examDescription, e.accessLink
       FROM tentative t
       JOIN examen e ON t.examId = e.id
       WHERE t.studentId = ?`,
      [studentId],
    )) as any[]

    console.log(`Tentatives trouvées: ${attempts.length}`)

    return attempts.map((a: any) => ({
      id: a.id,
      examId: a.examId,
      examTitle: a.examTitle,
      examDescription: a.examDescription,
      examAccessLink: a.accessLink,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      completed: a.completed === 1,
      score: a.score,
    }))
  } catch (error) {
    console.error("Get student exams error:", error)
    throw new Error("Une erreur est survenue lors de la récupération des examens")
  }
}

// Get exam results
export async function getExamResults(attemptId: string, studentId: string) {
  try {
    // Vérifier que la tentative existe et appartient à l'étudiant
    const attempts = (await query(
      `SELECT t.*, e.title as examTitle, e.description as examDescription
       FROM tentative t
       JOIN examen e ON t.examId = e.id
       WHERE t.id = ? AND t.studentId = ?`,
      [attemptId, studentId],
    )) as any[]

    if (attempts.length === 0) {
      return { success: false, error: "Résultats non trouvés" }
    }

    const attempt = attempts[0]

    // Récupérer les questions de l'examen
    const questions = (await query("SELECT * FROM question WHERE examId = ?", [attempt.examId])) as any[]

    // Récupérer les réponses de la tentative
    const answers = (await query("SELECT * FROM reponse WHERE tentativeId = ?", [attemptId])) as any[]

    // Préparer les résultats des questions
    const questionResults = await Promise.all(
      questions.map(async (question: any) => {
        const answer = answers.find((a: any) => a.questionId === question.id)

        let userAnswer = ""
        let correctAnswer = ""

        if (question.type === "direct") {
          userAnswer = answer?.textAnswer || ""
          correctAnswer = question.answer
        } else if (question.type === "qcm") {
          // Récupérer les options sélectionnées
          const selectedOptions = answer
            ? ((await query(
                `SELECT o.text
           FROM reponse_option ro
           JOIN option_question o ON ro.optionId = o.id
           WHERE ro.reponseId = ?`,
                [answer.id],
              )) as any[])
            : []

          userAnswer = selectedOptions.map((o: any) => o.text).join(", ")

          // Récupérer les options correctes
          const correctOptions = (await query(
            "SELECT text FROM option_question WHERE questionId = ? AND isCorrect = 1",
            [question.id],
          )) as any[]

          correctAnswer = correctOptions.map((o: any) => o.text).join(", ")
        }

        return {
          id: question.id,
          text: question.text,
          type: question.type,
          userAnswer,
          correctAnswer,
          isCorrect: answer ? answer.isCorrect === 1 : false,
          points: question.points,
          earnedPoints: answer ? answer.earnedPoints : 0,
        }
      }),
    )

    return {
      success: true,
      data: {
        examTitle: attempt.examTitle,
        examDescription: attempt.examDescription,
        score: attempt.score,
        totalQuestions: questions.length,
        correctAnswers: answers.filter((a: any) => a.isCorrect === 1).length,
        questions: questionResults,
      },
    }
  } catch (error) {
    console.error("Get exam results error:", error)
    return { success: false, error: "Une erreur est survenue lors de la récupération des résultats" }
  }
}

// Helper function to calculate string similarity (simple implementation)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0

  // Simple character-by-character comparison
  const maxLength = Math.max(str1.length, str2.length)
  let matches = 0

  for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
    if (str1[i] === str2[i]) {
      matches++
    }
  }

  return matches / maxLength
}
