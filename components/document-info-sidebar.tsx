"use client"

import { FileText, CheckCircle, Download, Share, Bookmark, HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const suggestedQuestions = [
  "What's the total budget?",
  "How much goes to public safety?",
  "Show me education spending",
  "What are the largest departments?",
  "Compare to last year's budget",
  "What's the revenue breakdown?",
]

export function DocumentInfoSidebar() {
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <Badge className="bg-blue-100 text-blue-800">County</Badge>
              </div>
              <CardTitle className="text-lg leading-tight">Milwaukee County 2025 Adopted Budget</CardTitle>
              <CardDescription>Comprehensive operating and capital budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Processing complete</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Budget</p>
                  <p className="text-muted-foreground">$1.34 billion</p>
                </div>
                <div>
                  <p className="font-medium">Departments</p>
                  <p className="text-muted-foreground">24 agencies</p>
                </div>
                <div>
                  <p className="font-medium">Pages</p>
                  <p className="text-muted-foreground">342 pages</p>
                </div>
                <div>
                  <p className="font-medium">Year</p>
                  <p className="text-muted-foreground">2025</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Analysis
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Share className="h-4 w-4 mr-2" />
                Share Conversation
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmark Document
              </Button>
            </CardContent>
          </Card>

          {/* Suggested Questions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <CardTitle className="text-base">Suggested Questions</CardTitle>
              </div>
              <CardDescription className="text-xs">Based on this document type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2 text-xs leading-relaxed hover:bg-accent"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Education</span>
                  <span className="font-medium">28.9%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-chart-1 h-2 rounded-full" style={{ width: "28.9%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Public Safety</span>
                  <span className="font-medium">18.3%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-chart-2 h-2 rounded-full" style={{ width: "18.3%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Healthcare</span>
                  <span className="font-medium">15.7%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-chart-3 h-2 rounded-full" style={{ width: "15.7%" }}></div>
                </div>
              </div>

              <Separator />

              <Button variant="outline" size="sm" className="w-full bg-transparent">
                View Full Breakdown
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
