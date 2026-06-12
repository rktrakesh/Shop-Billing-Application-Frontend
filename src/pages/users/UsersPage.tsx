import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Lock, Unlock, KeyRound, UserCog } from 'lucide-react'
import { userService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card, CardContent, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
  SelectField, SelectItem,
} from '@/components/ui/index'
import { DataTable } from '@/components/common/DataTable'
import { PageHeader, ConfirmDialog } from '@/components/common'
import { formatDate, getRoleLabel } from '@/utils'
import type { CreateUserRequest, ResetPasswordRequest, Role, UserResponse } from '@/types'
import toast from 'react-hot-toast'

const userSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(50),
  password: z.string().optional(),
  role: z.enum(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER']),
  fullName: z.string().optional(),
})
type UserFormData = z.infer<typeof userSchema>

const resetSchema = z.object({
  newPassword: z.string().min(6, 'Min 6 characters'),
})
type ResetFormData = z.infer<typeof resetSchema>

export default function UsersPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [toggleUser, setToggleUser] = useState<UserResponse | null>(null)
  const [editing, setEditing] = useState<UserResponse | null>(null)
  const [resetTarget, setResetTarget] = useState<UserResponse | null>(null)

  const { data: res, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  })
  const users = res?.data?.data ?? []

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  const { register: registerReset, handleSubmit: handleResetSubmit, reset: resetResetForm, formState: { errors: resetErrors } } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const openCreate = () => { setEditing(null); reset({ role: 'ROLE_USER' }); setFormOpen(true) }
  const openEdit = (u: UserResponse) => {
    setEditing(u)
    reset({ username: u.username, role: u.role, fullName: u.fullName, password: '' })
    setFormOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      if (!editing && (!data.password || data.password.length < 6)) {
        throw new Error('Password must be at least 6 characters')
      }
      const payload = { ...data, password: data.password || 'unchanged' } as CreateUserRequest
      return editing ? userService.update(editing.id, payload) : userService.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(editing ? 'User updated' : 'User created')
      setFormOpen(false)
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message.includes('Password')) {
        toast.error(err.message)
      }
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (u: UserResponse) => u.active ? userService.disable(u.id) : userService.enable(u.id),
    onSuccess: (_, u) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(u.active ? 'User disabled' : 'User enabled')
      setToggleUser(null)
    },
  })

  const resetMutation = useMutation({
    mutationFn: (data: ResetFormData) => userService.resetPassword(resetTarget!.id, data as ResetPasswordRequest),
    onSuccess: () => {
      toast.success('Password reset successfully')
      setResetOpen(false)
      resetResetForm()
    },
  })

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create and manage staff accounts"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New User
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable
            loading={isLoading}
            data={users as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search by username..."
            emptyMessage="No users found."
            columns={[
              { key: 'username', header: 'Username', sortable: true },
              { key: 'fullName', header: 'Full Name', render: (r) => (r as unknown as UserResponse).fullName || '-' },
              { key: 'role', header: 'Role', render: (r) => {
                const role = (r as unknown as UserResponse).role
                return <Badge variant={role === 'ROLE_ADMIN' ? 'danger' : role === 'ROLE_MANAGER' ? 'warning' : 'primary'}>{getRoleLabel(role)}</Badge>
              }},
              { key: 'active', header: 'Status', render: (r) => (r as unknown as UserResponse).active
                  ? <Badge variant="success">Active</Badge>
                  : <Badge variant="danger">Disabled</Badge>
              },
              { key: 'createdAt', header: 'Created', render: (r) => formatDate((r as unknown as UserResponse).createdAt) },
            ]}
            actions={(row) => {
              const u = row as unknown as UserResponse
              return (
                <>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(u)} title="Edit">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => { setResetTarget(u); resetResetForm(); setResetOpen(true) }} title="Reset Password">
                    <KeyRound className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setToggleUser(u)} title={u.active ? 'Disable' : 'Enable'}>
                    {u.active ? <Lock className="h-3.5 w-3.5 text-danger" /> : <Unlock className="h-3.5 w-3.5 text-success" />}
                  </Button>
                </>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              {editing ? 'Edit User' : 'New User / Manager'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
            <DialogBody className="space-y-3">
              <Input label="Username *" error={errors.username?.message} {...register('username')} disabled={!!editing} />
              <Input label="Full Name" {...register('fullName')} />
              <Input
                label={editing ? 'New Password (leave blank to keep)' : 'Password *'}
                type="password"
                error={errors.password?.message}
                {...register('password')}
              />
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <SelectField label="Role *" value={field.value} onValueChange={(v) => field.onChange(v as Role)} error={errors.role?.message}>
                    <SelectItem value="ROLE_USER">Cashier (User)</SelectItem>
                    <SelectItem value="ROLE_MANAGER">Manager</SelectItem>
                    <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
                  </SelectField>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saveMutation.isPending}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={(o) => !o && setResetOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password: {resetTarget?.username}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetSubmit((d) => resetMutation.mutate(d))}>
            <DialogBody>
              <Input label="New Password *" type="password" error={resetErrors.newPassword?.message} {...registerReset('newPassword')} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button type="submit" loading={resetMutation.isPending}>Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={() => toggleUser && toggleMutation.mutate(toggleUser)}
        title={toggleUser?.active ? 'Disable User' : 'Enable User'}
        description={toggleUser?.active
          ? `${toggleUser?.username} will no longer be able to log in.`
          : `${toggleUser?.username} will regain access to the system.`}
        confirmLabel={toggleUser?.active ? 'Disable' : 'Enable'}
        variant={toggleUser?.active ? 'danger' : 'warning'}
        loading={toggleMutation.isPending}
      />
    </div>
  )
}
