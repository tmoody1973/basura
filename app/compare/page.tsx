import { Header } from "@/components/header"
import { ComparisonInterface } from "@/components/comparison-interface"

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Budget Comparison</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compare budget data across different jurisdictions, years, or document types to identify trends and
              differences.
            </p>
          </div>
          <ComparisonInterface />
        </div>
      </main>
    </div>
  )
}
