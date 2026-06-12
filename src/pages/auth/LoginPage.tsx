import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shirt, LogIn } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services'
import toast from 'react-hot-toast'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authService.login({ username: data.username, password: data.password })
      const auth = res.data.data
      login({
        token: auth.token,
        username: auth.username,
        role: auth.role,
        fullName: auth.fullName,
      })
      toast.success(`Welcome back, ${auth.fullName || auth.username}!`)
      if (auth.role === 'ROLE_USER') {
        navigate('/billing')
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <Shirt className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">RKT APPARELS</h1>
          <p className="text-sm text-text-muted mt-1">Shop Billing Management System</p>
        </div>

        {/* Card */}
        <div className="bg-sidebar border border-border/40 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              error={errors.username?.message}
              {...register('username')}
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                className="rounded border-border bg-card text-primary focus:ring-primary/30"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="text-sm text-text-secondary">Remember me</label>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              loading={loading}
            >
              {!loading && <LogIn className="h-4 w-4" />}
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-4">
          © {new Date().getFullYear()} RKT Apparels. All rights reserved.
        </p>
      </div>
    </div>
  )
}
