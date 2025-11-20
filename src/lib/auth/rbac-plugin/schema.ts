import type { BetterAuthPlugin } from "better-auth"

export const schema = {
  role: {
    modelName: "role",
    fields: {
      id: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      key: {
        type: "string",
        required: true,
        unique: true,
      },
      description: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        fieldName: "is_active",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "created_at",
      },
      updatedAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "updated_at",
      },
      createdBy: {
        type: "string",
        required: false,
        fieldName: "created_by",
      },
      updatedBy: {
        type: "string",
        required: false,
        fieldName: "updated_by",
      },
    },
  },
  permission: {
    modelName: "permission",
    fields: {
      id: {
        type: "string",
        required: true,
      },
      name: {
        type: "string",
        required: true,
      },
      key: {
        type: "string",
        required: true,
        unique: true,
      },
      description: {
        type: "string",
        required: false,
      },
      isActive: {
        type: "boolean",
        required: true,
        defaultValue: true,
        fieldName: "is_active",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "created_at",
      },
      updatedAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "updated_at",
      },
      createdBy: {
        type: "string",
        required: false,
        fieldName: "created_by",
      },
      updatedBy: {
        type: "string",
        required: false,
        fieldName: "updated_by",
      },
    },
  },
  userRole: {
    modelName: "userRole",
    fields: {
      userId: {
        type: "string",
        required: true,
        references: {
          model: "user",
          field: "id",
        },
        fieldName: "user_id",
      },
      roleId: {
        type: "string",
        required: true,
        references: {
          model: "role",
          field: "id",
        },
        fieldName: "role_id",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "created_at",
      },
    },
  },
  rolePermission: {
    modelName: "rolePermission",
    fields: {
      roleId: {
        type: "string",
        required: true,
        references: {
          model: "role",
          field: "id",
        },
        fieldName: "role_id",
      },
      permissionId: {
        type: "string",
        required: true,
        references: {
          model: "permission",
          field: "id",
        },
        fieldName: "permission_id",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "created_at",
      },
    },
  },
} satisfies BetterAuthPlugin["schema"]

export type RbacSchema = typeof schema
