"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import {
  FileText,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FolderPlus,
  Search,
  Download,
  Settings,
  Users,
  BarChart3,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Document {
  id: string
  name: string
  original_filename: string
  file_size: number
  jurisdiction_type: string
  jurisdiction_name: string
  fiscal_year: string
  document_type: string
  page_count: number
  processing_status: string
  is_visible?: boolean
  folder_id?: string
  created_at: string
  updated_at: string
}

interface Folder {
  id: string
  name: string
  description?: string
  document_count: number
}

export default function AdminPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string>("all")
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isLoaded) return

      try {
        const response = await fetch('/api/user/role')
        const data = await response.json()

        if (data.role === 'admin') {
          setUserRole('admin')
          fetchDocuments()
          fetchFolders()
        } else {
          router.push('/dashboard') // Redirect non-admins
        }
      } catch (error) {
        console.error('Failed to check admin access:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [isLoaded, router])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents')
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/admin/folders')
      const data = await response.json()

      if (data.success) {
        setFolders(data.folders)
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }

  const toggleDocumentVisibility = async (documentId: string, currentVisibility: boolean) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_visible: !currentVisibility
        }),
      })

      if (response.ok) {
        fetchDocuments() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to toggle document visibility:', error)
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchDocuments() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const saveDocumentChanges = async () => {
    if (!editingDocument) return

    try {
      const response = await fetch(`/api/documents/${editingDocument.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingDocument.name,
          jurisdiction_type: editingDocument.jurisdiction_type,
          jurisdiction_name: editingDocument.jurisdiction_name,
          fiscal_year: editingDocument.fiscal_year,
          document_type: editingDocument.document_type
        }),
      })

      if (response.ok) {
        setEditingDocument(null)
        fetchDocuments()
      }
    } catch (error) {
      console.error('Failed to update document:', error)
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/admin/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName
        }),
      })

      if (response.ok) {
        setNewFolderName("")
        fetchFolders()
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.jurisdiction_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = selectedFolder === "all" || doc.folder_id === selectedFolder
    return matchesSearch && matchesFolder
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage documents, folders, and system settings</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
              <p className="text-xs text-muted-foreground">
                {documents.filter(d => d.is_visible !== false).length} visible to users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.processing_status === 'processed').length}
              </div>
              <p className="text-xs text-muted-foreground">Ready for analysis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Folders</CardTitle>
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{folders.length}</div>
              <p className="text-xs text-muted-foreground">Organization categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0))}
              </div>
              <p className="text-xs text-muted-foreground">Total file storage</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="unorganized">Unorganized</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name} ({folder.document_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your documents.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="folder-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter folder name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createFolder}>Create Folder</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            <CardDescription>
              Manage your uploaded budget documents and their visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{document.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {document.jurisdiction_name} • {document.fiscal_year}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{document.jurisdiction_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(document.processing_status)}>
                          {document.processing_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(document.file_size || 0)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDocumentVisibility(document.id, document.is_visible ?? true)}
                        >
                          {(document.is_visible ?? true) ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(document.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDocument(document)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(document.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Edit Document Dialog */}
        {editingDocument && (
          <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Document</DialogTitle>
                <DialogDescription>
                  Update document information and organization.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                  <Input
                    id="edit-name"
                    value={editingDocument.name}
                    onChange={(e) => setEditingDocument({...editingDocument, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-jurisdiction-type" className="text-right">Type</Label>
                  <Select
                    value={editingDocument.jurisdiction_type}
                    onValueChange={(value) => setEditingDocument({...editingDocument, jurisdiction_type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="county">County</SelectItem>
                      <SelectItem value="city">City</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="federal">Federal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-jurisdiction-name" className="text-right">Location</Label>
                  <Input
                    id="edit-jurisdiction-name"
                    value={editingDocument.jurisdiction_name}
                    onChange={(e) => setEditingDocument({...editingDocument, jurisdiction_name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-fiscal-year" className="text-right">Fiscal Year</Label>
                  <Input
                    id="edit-fiscal-year"
                    value={editingDocument.fiscal_year}
                    onChange={(e) => setEditingDocument({...editingDocument, fiscal_year: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingDocument(null)}>
                  Cancel
                </Button>
                <Button onClick={saveDocumentChanges}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}