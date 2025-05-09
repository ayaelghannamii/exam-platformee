import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Plateforme d'Examen</h1>
          <div className="space-x-2">
            <Link href="/login">
              <Button variant="outline">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Inscription</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold tracking-tight">Bienvenue sur la Plateforme d'Examen en Ligne</h2>
          <p className="text-xl text-muted-foreground">
            Une solution complète pour créer, gérer et passer des examens en ligne.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Commencer</Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                En savoir plus
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-bold mb-2">Pour les Enseignants</h3>
            <p className="text-muted-foreground mb-4">
              Créez des examens personnalisés avec différents types de questions et partagez-les facilement avec vos
              étudiants.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-bold mb-2">Pour les Étudiants</h3>
            <p className="text-muted-foreground mb-4">
              Accédez aux examens via un lien unique, répondez aux questions dans le temps imparti et obtenez vos
              résultats instantanément.
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-bold mb-2">Sécurisé et Fiable</h3>
            <p className="text-muted-foreground mb-4">
              Authentification sécurisée, suivi de géolocalisation et interface responsive pour une expérience optimale.
            </p>
          </div>
        </div>
      </main>
      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Plateforme d'Examen en Ligne. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
