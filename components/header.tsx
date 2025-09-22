'use client'

import { UserButton, useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, BarChart3, Upload, Settings } from 'lucide-react'
import { getUserRole } from '@/lib/supabase/database'

export function Header() {
  const { isSignedIn, user } = useUser()
  const [userRole, setUserRole] = useState<string>('user')

  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.id) {
        try {
          const role = await getUserRole(user.id)
          setUserRole(role)
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      }
    }

    checkUserRole()
  }, [user?.id])

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Basura</span>
          </Link>

          {isSignedIn && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1"
              >
                <FileText className="h-4 w-4" />
                <span>{userRole === 'admin' ? 'Upload' : 'Browse'}</span>
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/compare"
                className="text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Compare</span>
              </Link>
              {userRole === 'admin' && (
                <Link
                  href="/admin"
                  className="text-slate-600 hover:text-slate-900 transition-colors flex items-center space-x-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <Button variant="default">
                Sign In
              </Button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  )
}
