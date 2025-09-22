import { Header } from "@/components/header"
import { UploadInterface } from "@/components/upload-interface"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">AI-Powered Government Budget Analysis</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload budget documents and get instant insights. Perfect for students, journalists, and engaged citizens
              exploring government spending.
            </p>
          </div>
          <UploadInterface />
        </div>
      </main>
    </div>
  )
}
