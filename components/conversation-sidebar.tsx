"use client"

import { useState } from "react"
import { Search, Clock, Bookmark, FileText, Building2, MapPin, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const recentConversations = [
  {
    id: 1,
    documentName: "Milwaukee County 2025 Budget",
    firstQuestion: "How much does Milwaukee County spend on public safety?",
    timestamp: "2 hours ago",
    jurisdiction: "County",
    bookmarked: true,
  },
  {
    id: 2,
    documentName: "California State Budget 2024",
    firstQuestion: "What's the total education spending allocation?",
    timestamp: "1 day ago",
    jurisdiction: "State",
    bookmarked: false,
  },
  {
    id: 3,
    documentName: "Chicago City Budget 2025",
    firstQuestion: "Show me infrastructure spending breakdown",
    timestamp: "3 days ago",
    jurisdiction: "City",
    bookmarked: true,
  },
]

const documentLibrary = [
  {
    category: "County Budgets",
    icon: Building2,
    documents: ["Milwaukee County 2025", "Cook County 2024", "Orange County 2025"],
  },
  {
    category: "State Budgets",
    icon: MapPin,
    documents: ["California 2024", "Texas 2025", "New York 2024"],
  },
  {
    category: "Federal Budgets",
    icon: Flag,
    documents: ["DOE Budget 2025", "HHS Budget 2024", "DOD Budget 2025"],
  },
]

export function ConversationSidebar() {
  const [searchQuery, setSearchQuery] = useState("")

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

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Recent Conversations */}
          <div>
            <h3 className="font-semibold text-sidebar-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Conversations
            </h3>
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <Card key={conversation.id} className="cursor-pointer hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Badge className={getJurisdictionColor(conversation.jurisdiction)} variant="secondary">
                        {conversation.jurisdiction}
                      </Badge>
                      {conversation.bookmarked && <Bookmark className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <CardTitle className="text-sm font-medium leading-tight">{conversation.documentName}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs line-clamp-2 mb-2">
                      {conversation.firstQuestion}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground">{conversation.timestamp}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Document Library */}
          <div>
            <h3 className="font-semibold text-sidebar-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Library
            </h3>
            <div className="space-y-3">
              {documentLibrary.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-2">
                    <category.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-sidebar-foreground">{category.category}</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {category.documents.map((doc, docIndex) => (
                      <Button
                        key={docIndex}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8 text-muted-foreground hover:text-sidebar-foreground"
                      >
                        {doc}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
