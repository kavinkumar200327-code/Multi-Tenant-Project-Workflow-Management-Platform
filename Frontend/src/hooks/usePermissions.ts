import { useAuthStore } from '../store/authStore'
import type { OrgRole } from '../types'

export interface RoleCapability {
  name: string
  description: string
  allowed: boolean
}

export function usePermissions() {
  const { currentOrgRole } = useAuthStore()

  const role: OrgRole = currentOrgRole || 'viewer'

  const isOwner = role === 'owner'
  const isAdmin = role === 'admin' || isOwner
  const isProjectManager = role === 'project_manager' || isAdmin
  const isMember = role === 'member' || isProjectManager
  const isViewer = role === 'viewer'

  // Granular capability flags
  const canCreateProject = isProjectManager
  const canEditProject = isProjectManager
  const canDeleteProject = isAdmin

  const canCreateTask = !isViewer
  const canEditTask = !isViewer
  const canDeleteTask = isProjectManager // Members can delete only own tasks via backend check
  const canMoveKanban = !isViewer

  const canComment = !isViewer
  const canUploadAttachment = !isViewer

  const canManageMembers = isAdmin
  const canDeleteOrg = isOwner
  const canCreateOrg = isOwner || isAdmin

  const roleBadgeConfig: Record<OrgRole, { label: string; color: string; bgColor: string; borderColor: string }> = {
    owner: {
      label: 'Owner',
      color: 'text-amber-300',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/40',
    },
    admin: {
      label: 'Admin',
      color: 'text-indigo-300',
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-500/40',
    },
    project_manager: {
      label: 'Project Manager',
      color: 'text-sky-300',
      bgColor: 'bg-sky-500/20',
      borderColor: 'border-sky-500/40',
    },
    member: {
      label: 'Member',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/40',
    },
    viewer: {
      label: 'Viewer (Read-Only)',
      color: 'text-slate-400',
      bgColor: 'bg-slate-700/50',
      borderColor: 'border-slate-600',
    },
  }

  const capabilitiesList: RoleCapability[] = [
    {
      name: 'View Projects & Kanban Boards',
      description: 'Access and inspect all organization projects, tasks, and dashboards',
      allowed: true,
    },
    {
      name: 'Create & Edit Tasks',
      description: 'Create new tasks, edit descriptions, change priorities and due dates',
      allowed: canCreateTask,
    },
    {
      name: 'Move Kanban Cards',
      description: 'Drag & drop task status cards across Kanban workflow columns',
      allowed: canMoveKanban,
    },
    {
      name: 'Comments & Attachments',
      description: 'Post comments and upload file attachments to tasks',
      allowed: canComment,
    },
    {
      name: 'Create & Edit Projects',
      description: 'Create new projects and update project details/status',
      allowed: canCreateProject,
    },
    {
      name: 'Delete Tasks & Projects',
      description: 'Remove projects and tasks permanently',
      allowed: canDeleteProject,
    },
    {
      name: 'Manage Organization Members',
      description: 'Invite members and change roles within the organization',
      allowed: canManageMembers,
    },
    {
      name: 'Create Organizations',
      description: 'Provision and create new organizational workspaces',
      allowed: canCreateOrg,
    },
    {
      name: 'Full Organization Ownership',
      description: 'Full administrative rights and organization deletion',
      allowed: isOwner,
    },
  ]

  return {
    role,
    isOwner,
    isAdmin,
    isProjectManager,
    isMember,
    isViewer,
    canCreateOrg,
    canManageMembers,
    canDeleteOrg,
    canCreateProject,
    canEditProject,
    canDeleteProject,
    canCreateTask,
    canEditTask,
    canDeleteTask,
    canMoveKanban,
    canComment,
    canUploadAttachment,
    roleBadge: roleBadgeConfig[role] || roleBadgeConfig.viewer,
    capabilitiesList,
  }
}
