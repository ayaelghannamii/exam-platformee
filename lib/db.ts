import mysql from "mysql2/promise"
import { v4 as uuidv4 } from "uuid"

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "exam_platform",
}

// Création d'un pool de connexions
const pool = mysql.createPool(dbConfig)

// Fonction pour exécuter des requêtes SQL
export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête SQL:", error)
    throw error
  }
}

// Fonction pour générer un ID unique
export function generateId() {
  return uuidv4()
}

// Fonction pour convertir les résultats de la base de données en objets JavaScript
export function mapUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    birthDate: user.birthDate,
    gender: user.gender,
    establishment: user.establishment,
    department: user.department,
    createdAt: user.createdAt,
  }
}

export function mapExam(exam: any) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    targetAudience: exam.targetAudience,
    teacherId: exam.teacherId,
    accessLink: exam.accessLink,
    createdAt: exam.createdAt,
    questionCount: exam.questionCount || 0,
  }
}

export function mapQuestion(question: any, options: any[] = []) {
  return {
    id: question.id,
    examId: question.examId,
    text: question.text,
    type: question.type,
    answer: question.answer,
    tolerance: question.tolerance,
    multipleAnswers: question.multipleAnswers === 1,
    duration: question.duration,
    points: question.points,
    attachmentType: question.attachmentType,
    attachmentUrl: question.attachmentUrl,
    createdAt: question.createdAt,
    options: options,
  }
}

export function mapAttempt(attempt: any, examTitle = "", examDescription = "", accessLink = "") {
  return {
    id: attempt.id,
    examId: attempt.examId,
    examTitle: examTitle || "Examen inconnu",
    examDescription: examDescription || "",
    examAccessLink: accessLink || "",
    studentId: attempt.studentId,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    completed: attempt.completed === 1,
    currentQuestionIndex: attempt.currentQuestionIndex,
    score: attempt.score,
  }
}

// Exporter la base de données en mémoire pour la compatibilité avec le code existant
// Cette partie sera progressivement supprimée lors de la migration complète vers MySQL
export const db = {
  users: [],
  exams: [],
  questions: [],
  attempts: [],
}
