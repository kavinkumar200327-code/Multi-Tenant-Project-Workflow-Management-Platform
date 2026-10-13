import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Shield, Save, CheckCircle2, XCircle, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { usePermissions } from '../hooks/usePermissions'
import api from '../api/axios'
import type { User as UserType } from '../types'
import { Spinner } from '../components/common/Spinner'


const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().email('Invalid email address'),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

const ROLES_INFO = [
  {
    role: 'Owner',
    desc: 'Complete administrative authority over the organization, manage members & billing, create/delete organizations and projects.',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  {
    role: 'Admin',
    desc: 'Can create organizations, manage organization members, promote/demote roles, create and delete projects, and moderate tasks.',
    color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  },
  {
    role: 'Project Manager',
    desc: 'Can create new projects, edit project details, assign tasks, manage task dependencies, and oversee workflows.',
    color: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  },
  {
    role: 'Member / Contributor',
    desc: 'Can create tasks, update assigned task statuses, move Kanban cards, add comments, and upload attachments.',
    color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  {
    role: 'Viewer',
    desc: 'Strictly read-only access to view organization projects, Kanban boards, task metrics, comments, and attachments.',
    color: 'border-slate-600 bg-slate-700/30 text-slate-300',
  },
]

export default function ProfilePage() {
  const { user, setUser, currentOrgId } = useAuthStore()
  const { roleBadge, capabilitiesList } = usePermissions()

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name ?? '', email: user?.email ?? '' },
  })

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  const onSaveProfile = async (data: ProfileValues) => {
    setSavingProfile(true)
    try {
      const updated = await api.put<UserType>('/users/me', data).then((r) => r.data)
      setUser(updated)
      toast.success('Profile updated!')
    } catch {
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async (data: PasswordValues) => {
    setSavingPassword(true)
    try {
      await api.post('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully!')
      resetPwd()
    } catch {
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profile & Role Permissions</h1>
        <p className="text-slate-400 mt-1">Manage your account settings and review your access capabilities</p>
      </div>

      {/* Avatar & Active Role */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-600/20">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg text-slate-100">{user?.full_name}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield size={12} className="text-green-400" />
                <span className="text-xs text-green-400">Account Active</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block mb-1">Your Active Role</span>
            <span className={`text-sm uppercase tracking-wider font-bold px-3 py-1.5 rounded-xl border inline-block ${roleBadge.bgColor} ${roleBadge.color} ${roleBadge.borderColor}`}>
              {roleBadge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Role Capabilities Breakdown */}
      <div className="card">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <Award size={18} className="text-indigo-400" />
          Your Permissions in Active Organization
        </h2>
        {!currentOrgId ? (
          <div className="py-6 text-center border border-dashed border-slate-700/80 rounded-xl bg-slate-800/40 p-4">
            <p className="text-sm text-slate-300 font-medium">No active organization selected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Select or create an organization to view your role-based capabilities and workspace permissions.
            </p>
            <Link to="/organizations" className="btn-secondary text-xs py-1.5 px-3 mt-3 inline-flex items-center gap-1.5">
              Go to Organizations →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capabilitiesList.map((cap) => (
              <div
                key={cap.name}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                  cap.allowed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                {cap.allowed ? (
                  <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-slate-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${cap.allowed ? 'text-slate-100' : 'text-slate-400'}`}>
                    {cap.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* All Role Definitions Matrix */}
      <div className="card">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <Shield size={18} className="text-indigo-400" />
          Role Hierarchy & Definitions
        </h2>
        <div className="space-y-2.5">
          {ROLES_INFO.map((r) => (
            <div key={r.role} className={`p-3 rounded-xl border flex items-start gap-3 ${r.color}`}>
              <div className="font-semibold text-sm min-w-32">{r.role}</div>
              <p className="text-xs leading-relaxed opacity-90">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-5">
          <User size={18} className="text-indigo-400" />
          Personal Information
        </h2>
        <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input {...regProfile('full_name')} className="input-field" />
            {profileErrors.full_name && (
              <p className="text-xs text-red-400 mt-1">{profileErrors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...regProfile('email')} type="email" className="input-field pl-9" />
            </div>
            {profileErrors.email && (
              <p className="text-xs text-red-400 mt-1">{profileErrors.email.message}</p>
            )}
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Spinner size={16} /> : <Save size={16} />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Password Form */}
      <div className="card">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2 mb-5">
          <Shield size={18} className="text-indigo-400" />
          Change Password
        </h2>
        <form onSubmit={handlePwd(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Current Password
            </label>
            <input {...regPwd('current_password')} type="password" className="input-field" />
            {pwdErrors.current_password && (
              <p className="text-xs text-red-400 mt-1">{pwdErrors.current_password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
            <input {...regPwd('new_password')} type="password" className="input-field" />
            {pwdErrors.new_password && (
              <p className="text-xs text-red-400 mt-1">{pwdErrors.new_password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input {...regPwd('confirm_password')} type="password" className="input-field" />
            {pwdErrors.confirm_password && (
              <p className="text-xs text-red-400 mt-1">{pwdErrors.confirm_password.message}</p>
            )}
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary">
            {savingPassword ? <Spinner size={16} /> : <Save size={16} />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
