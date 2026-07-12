"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginClient() {
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })
    if (res?.error) {
      setError("Email ou mot de passe incorrect")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="bg-card border rounded-lg p-8 w-full max-w-sm shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">CRM Tourneur</h1>
          <p className="text-sm text-muted-foreground mt-1">Connectez-vous</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" name="email" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="admin@productionsdeschaumes.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Mot de passe</label>
            <input type="password" name="password" required className="w-full mt-1 bg-background border rounded-md px-3 py-2 text-sm" placeholder="••••••••" />
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}