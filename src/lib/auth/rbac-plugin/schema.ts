import { type BetterAuthPluginDBSchema } from "@better-auth/core/db"

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
        fieldName: "isActive",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "createdAt",
      },
      updatedAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "updatedAt",
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
        fieldName: "isActive",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "createdAt",
      },
      updatedAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "updatedAt",
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
        fieldName: "userId",
      },
      roleId: {
        type: "string",
        required: true,
        references: {
          model: "role",
          field: "id",
        },
        fieldName: "roleId",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "createdAt",
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
        fieldName: "roleId",
      },
      permissionId: {
        type: "string",
        required: true,
        references: {
          model: "permission",
          field: "id",
        },
        fieldName: "permissionId",
      },
      createdAt: {
        type: "date",
        required: true,
        defaultValue: () => new Date(),
        fieldName: "createdAt",
      },
    },
  },
} satisfies BetterAuthPluginDBSchema

export type RbacSchema = typeof schema
