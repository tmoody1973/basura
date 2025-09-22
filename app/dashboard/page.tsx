import { Header } from "@/components/header"
import { ChatInterface } from "@/components/chat-interface"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { DocumentInfoSidebar } from "@/components/document-info-sidebar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - 25% width */}
        <div className="w-1/4 border-r bg-sidebar">
          <ConversationSidebar />
        </div>

        {/* Center Panel - 50% width */}
        <div className="w-1/2 flex flex-col">
          <ChatInterface />
        </div>

        {/* Right Sidebar - 25% width */}
        <div className="w-1/4 border-l bg-sidebar">
          <DocumentInfoSidebar />
        </div>
      </div>
    </div>
  )
}
