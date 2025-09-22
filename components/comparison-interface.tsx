"use client"

import { useState } from "react"
import { Plus, X, BarChart3, TrendingUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ComparisonCharts } from "./comparison-charts"

type Document = {
  id: string
  title: string
  jurisdiction: "City" | "County" | "State" | "Federal"
  year: number
  totalBudget: number
  departments: {
    education: number
    publicSafety: number
    healthcare: number
    infrastructure: number
    socialServices: number
    administration: number
  }
}

const availableDocuments: Document[] = [
  {
    id: "milwaukee-2025",
    title: "Milwaukee County 2025 Budget",
    jurisdiction: "County",
    year: 2025,
    totalBudget: 1340,
    departments: {
      education: 387.5,
      publicSafety: 245.2,
      healthcare: 210.4,
      infrastructure: 156.8,
      socialServices: 134.0,
      administration: 89.3,
    },
  },
  {
    id: "milwaukee-2024",
    title: "Milwaukee County 2024 Budget",
    jurisdiction: "County",
    year: 2024,
    totalBudget: 1310,
    departments: {
      education: 375.0,
      publicSafety: 240.0,
      healthcare: 205.0,
      infrastructure: 150.0,
      socialServices: 130.0,
      administration: 85.0,
    },
  },
  {
    id: "chicago-2025",
    title: "Chicago City Budget 2025",
    jurisdiction: "City",
    year: 2025,
    totalBudget: 16800,
    departments: {
      education: 7200,
      publicSafety: 4200,
      healthcare: 1680,
      infrastructure: 2100,
      socialServices: 840,
      administration: 780,
    },
  },
  {
    id: "california-2024",
    title: "California State Budget 2024",
    jurisdiction: "State",
    year: 2024,
    totalBudget: 310000,
    departments: {
      education: 124000,
      publicSafety: 31000,
      healthcare: 93000,
      infrastructure: 31000,
      socialServices: 18600,
      administration: 12400,
    },
  },
  {
    id: "federal-doe-2025",
    title: "Federal Department of Education Budget 2025",
    jurisdiction: "Federal",
    year: 2025,
    totalBudget: 80000,
    departments: {
      education: 80000,
      publicSafety: 0,
      healthcare: 0,
      infrastructure: 0,
      socialServices: 0,
      administration: 0,
    },
  },
]

export function ComparisonInterface() {
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([availableDocuments[0], availableDocuments[2]])
  const [compareBy, setCompareBy] = useState<"department" | "function" | "revenue">("department")
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false)
  const [showComparison, setShowComparison] = useState(true)

  const addDocument = (documentId: string) => {
    const document = availableDocuments.find((doc) => doc.id === documentId)
    if (document && !selectedDocuments.find((doc) => doc.id === documentId)) {
      setSelectedDocuments([...selectedDocuments, document])
    }
  }

  const removeDocument = (documentId: string) => {
    setSelectedDocuments(selectedDocuments.filter((doc) => doc.id !== documentId))
    if (selectedDocuments.length <= 2) {
      setShowComparison(false)
    }
  }

  const getJurisdictionColor = (jurisdiction: string) => {
    switch (jurisdiction) {
      case "County":
        return "bg-blue-100 text-blue-800"
      case "State":
        return "bg-green-100 text-green-800"
      case "City":
        return "bg-purple-100 text-purple-800"
      case "Federal":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatBudget = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}B`
    }
    return `$${amount.toFixed(1)}M`
  }

  return (
    <div className="space-y-8">
      {/* Document Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Documents to Compare
          </CardTitle>
          <CardDescription>Choose 2 or more budget documents to analyze side by side</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected Documents */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedDocuments.map((doc) => (
              <Card key={doc.id} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeDocument(doc.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Badge className={getJurisdictionColor(doc.jurisdiction)} variant="secondary">
                      {doc.jurisdiction}
                    </Badge>
                    <Badge variant="outline">{doc.year}</Badge>
                  </div>
                  <CardTitle className="text-base leading-tight pr-8">{doc.title}</CardTitle>
                  <CardDescription>{formatBudget(doc.totalBudget)} Total Budget</CardDescription>
                </CardHeader>
              </Card>
            ))}

            {/* Add Document Card */}
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <CardContent className="flex items-center justify-center h-full min-h-[120px]">
                <Select onValueChange={addDocument}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <SelectValue placeholder="Add document" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDocuments
                      .filter((doc) => !selectedDocuments.find((selected) => selected.id === doc.id))
                      .map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          <div className="flex items-center gap-2">
                            <Badge className={getJurisdictionColor(doc.jurisdiction)} variant="secondary">
                              {doc.jurisdiction}
                            </Badge>
                            <span>{doc.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Controls */}
          {selectedDocuments.length >= 2 && (
            <div className="flex flex-wrap items-center gap-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label htmlFor="compare-by">Compare by:</Label>
                <Select value={compareBy} onValueChange={(value: any) => setCompareBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="function">Function</SelectItem>
                    <SelectItem value="revenue">Revenue Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="differences-only" checked={showDifferencesOnly} onCheckedChange={setShowDifferencesOnly} />
                <Label htmlFor="differences-only">Show differences only</Label>
              </div>

              <Button onClick={() => setShowComparison(true)} className="ml-auto">
                <TrendingUp className="h-4 w-4 mr-2" />
                Compare Documents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {showComparison && selectedDocuments.length >= 2 && (
        <ComparisonCharts
          documents={selectedDocuments}
          compareBy={compareBy}
          showDifferencesOnly={showDifferencesOnly}
        />
      )}
    </div>
  )
}
