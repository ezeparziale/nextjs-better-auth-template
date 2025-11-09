export type Permission = {
  id: string
  name: string
  key: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type Role = {
  id: string
  name: string
  key: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type RolePermission = {
  id: string
  roleId: string
  permissionId: string
  createdAt: Date
}

export type UserRole = {
  id: string
  userId: string
  roleId: string
  createdAt: Date
}

export type User = {
  id: string
  email: string
  name?: string
  role?: string
  createdAt: Date
  updatedAt: Date
}
