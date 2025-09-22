import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Basura</h1>
          <p className="text-slate-600">Start analyzing government budgets with AI-powered insights</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-0 bg-white/80 backdrop-blur-sm",
            }
          }}
        />
      </div>
    </div>
  )
}