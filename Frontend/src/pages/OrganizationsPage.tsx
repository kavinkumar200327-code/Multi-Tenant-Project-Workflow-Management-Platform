import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building2, Users, Shield, Check, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { organizationsApi } from '../api/organizations'
import { notificationsApi } from '../api/notifications'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { usePermissions } from '../hooks/usePermissions'
import { Modal } from '../components/common/Modal'
import { EmptyState } from '../components/common/EmptyState'
import { Spinner } from '../components/common/Spinner'
import type { Organization, OrganizationMemberDetail, OrgRole } from '../types'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens'),
})

type FormValues = z.infer<typeof schema>

const ROLE_BADGE_STYLES: Record<OrgRole, string> = {
  owner: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  admin: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  project_manager: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  member: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  viewer: 'bg-slate-700/50 text-slate-300 border-slate-600',
}

export default function OrganizationsPage() {
  const [showModal, setShowModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [members, setMembers] = useState<OrganizationMemberDetail[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const { setCurrentOrg, setCurrentOrgRole, currentOrgId } = useAuthStore()
  const setNotifications = useNotificationStore((s) => s.setNotifications)
  const { canManageMembers, canCreateOrg, roleBadge } = usePermissions()

  const loadOrganizations = () => {
    organizationsApi
      .list()
      .then((data) => {
        setOrgs(data)
        if (data.length > 0) {
          const active = data.find((o) => o.id === currentOrgId) || data[0]
          setCurrentOrg(active.id)
          setCurrentOrgRole(active.role || 'viewer')
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false))
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  const handleSelectOrg = (org: Organization) => {
    setCurrentOrg(org.id)
    setCurrentOrgRole(org.role || 'viewer')
    toast.success(`Switched to "${org.name}"`)
  }

  const handleOpenMembersModal = async () => {
    if (!currentOrgId) return
    setShowMembersModal(true)
    setLoadingMembers(true)
    try {
      const data = await organizationsApi.getMembers(currentOrgId)
      setMembers(data)
    } catch {
      toast.error('Failed to load organization members')
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleRoleChange = async (userId: number, newRole: OrgRole) => {
    if (!currentOrgId) return
    setUpdatingUserId(userId)
    try {
      const updated = await organizationsApi.updateMemberRole(currentOrgId, userId, newRole)
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? updated : m)))
      toast.success(`Role updated to ${newRole.replace('_', ' ').toUpperCase()}`)
      loadOrganizations()
    } catch {
    } finally {
      setUpdatingUserId(null)
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    if (!canCreateOrg && orgs.length > 0) {
      toast.error('Only Organization Owners and Admins can create new organizations.')
      setShowModal(false)
      return
    }
    setIsLoading(true)
    try {
      const org = await organizationsApi.create(data)
      setOrgs((prev) => [org, ...prev])
      setCurrentOrg(org.id)
      setCurrentOrgRole(org.role || 'owner')
      toast.success(`Organization "${org.name}" created!`)
      setShowModal(false)
      reset()
      notificationsApi.list().then(setNotifications).catch(() => {})
    } catch {
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) return <Spinner fullScreen />

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">Organizations</h1>
            <span className={`text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border ${roleBadge.bgColor} ${roleBadge.color} ${roleBadge.borderColor}`}>
              {roleBadge.label} Role
            </span>
          </div>
          <p className="text-slate-400 mt-1">Manage your organizations, roles, and teams</p>
        </div>
        <div className="flex items-center gap-3">
          {canManageMembers && (
            <button onClick={handleOpenMembersModal} className="btn-secondary">
              <Users size={18} />
              Team Members & Roles
            </button>
          )}
          {canCreateOrg && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={18} />
              New Organization
            </button>
          )}
        </div>
      </div>

      {orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description={
            canCreateOrg || orgs.length === 0
              ? "Create your first organization to start managing projects and teams."
              : "You do not belong to any organization yet. Please contact an organization owner or administrator to invite you."
          }
          action={
            canCreateOrg || orgs.length === 0
              ? { label: 'Create Organization', onClick: () => setShowModal(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => {
            const isSelected = currentOrgId === org.id
            const roleKey = (org.role || 'viewer') as OrgRole
            return (
              <div
                key={org.id}
                className={`card cursor-pointer border-2 transition-all hover:border-indigo-500 ${
                  isSelected ? 'border-indigo-500 bg-indigo-950/10' : 'border-slate-700'
                }`}
                onClick={() => handleSelectOrg(org)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <Building2 size={24} className="text-indigo-400" />
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                      ROLE_BADGE_STYLES[roleKey] || ROLE_BADGE_STYLES.viewer
                    }`}
                  >
                    {roleKey.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-base">{org.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">/{org.slug}</p>
                </div>
                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                      <Check size={14} /> Currently Active
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Team Members & Roles Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title="Organization Members & Roles"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            View and manage permissions for members of the active organization.
          </p>

          {loadingMembers ? (
            <div className="py-8 flex justify-center"><Spinner size={24} /></div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {member.user_full_name?.charAt(0).toUpperCase() || member.user_id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{member.user_full_name || `User #${member.user_id}`}</p>
                      <p className="text-xs text-slate-400">{member.user_email || `User ID: ${member.user_id}`}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      disabled={updatingUserId === member.user_id || member.role === 'owner'}
                      onChange={(e) => handleRoleChange(member.user_id, e.target.value as OrgRole)}
                      className="input-field text-xs py-1.5 px-2.5 w-40"
                    >
                      <option value="owner" disabled>Owner</option>
                      <option value="admin">Admin</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {updatingUserId === member.user_id && <Spinner size={14} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={() => setShowMembersModal(false)} className="btn-secondary px-6">
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Org Modal */}
      {canCreateOrg && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); reset() }}
          title="Create Organization"
          size="sm"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                {...register('name')}
                className="input-field"
                placeholder="Acme Corp"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Slug <span className="text-red-400">*</span>
              </label>
              <input
                {...register('slug')}
                className="input-field"
                placeholder="acme-corp"
              />
              <p className="text-xs text-slate-500 mt-1">
                Lowercase letters, numbers, and hyphens only
              </p>
              {errors.slug && (
                <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); reset() }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                {isLoading ? <Spinner size={16} /> : null}
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
