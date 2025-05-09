import { NextResponse } from "next/server"
import { query, generateId } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { tentativeId, latitude, longitude } = await request.json()

    if (!tentativeId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "Données de géolocalisation incomplètes" }, { status: 400 })
    }

    // Vérifier que la tentative existe
    const attempts = (await query("SELECT * FROM tentative WHERE id = ?", [tentativeId])) as any[]

    if (attempts.length === 0) {
      return NextResponse.json({ success: false, error: "Tentative non trouvée" }, { status: 404 })
    }

    // Enregistrer la géolocalisation
    const geoId = generateId()
    await query(
      `INSERT INTO geolocalisation (id, tentativeId, latitude, longitude)
       VALUES (?, ?, ?, ?)`,
      [geoId, tentativeId, latitude, longitude],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Geolocation error:", error)
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue lors de l'enregistrement de la géolocalisation" },
      { status: 500 },
    )
  }
}
