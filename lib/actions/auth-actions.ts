"use server"

import { query, generateId } from "@/lib/db"

export async function registerUser(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const birthDate = formData.get("birthDate") as string
    const gender = formData.get("gender") as string
    const establishment = formData.get("establishment") as string
    const department = formData.get("department") as string
    const role = formData.get("role") as string

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = (await query("SELECT * FROM utilisateur WHERE email = ?", [email])) as any[]

    if (existingUsers.length > 0) {
      return { success: false, error: "Un utilisateur avec cet email existe déjà" }
    }

    // Créer un nouvel utilisateur
    const userId = generateId()
    await query(
      `INSERT INTO utilisateur 
      (id, email, password, firstName, lastName, birthDate, gender, establishment, department, role) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, password, firstName, lastName, birthDate, gender, establishment, department, role],
    )

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Une erreur est survenue lors de l'inscription" }
  }
}

export async function loginUser({ email, password }: { email: string; password: string }) {
  try {
    // Rechercher l'utilisateur par email
    const users = (await query("SELECT * FROM utilisateur WHERE email = ? AND password = ?", [
      email,
      password,
    ])) as any[]

    if (users.length === 0) {
      return { success: false, error: "Email ou mot de passe incorrect" }
    }

    const user = users[0]

    // Retourner les données de l'utilisateur (sans le mot de passe)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Une erreur est survenue lors de la connexion" }
  }
}
