export type ExamType = {
  id: string
  title: string
  description: string
  targetAudience: string
  teacherId: string
  accessLink: string
  createdAt: string
  questionCount?: number
}

export type QuestionType = {
  id: string
  examId: string
  text: string
  type: "direct" | "qcm"
  answer?: string
  tolerance?: number
  options?: {
    id: string
    text: string
    isCorrect: boolean
  }[]
  multipleAnswers?: boolean
  duration: number
  points: number
  attachmentType?: string
  attachmentUrl?: string
  createdAt: string
}

export type ExamAttemptType = {
  id: string
  examId: string
  examTitle: string
  examDescription: string
  examAccessLink: string
  startedAt: string
  completedAt?: string
  completed: boolean
  score: number
}
