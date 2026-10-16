
import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Proventry Admin Backend API",
      version: "1.0.0",
      description: "API documentation for Proventry Admin Backend",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication APIs",
      },
      {
        name: "Users",
        description: "User management APIs",
      },
      {
        name: "Customers",
        description: "Customer management APIs",
      },
      {
        name: "Vendors",
        description: "Vendor management APIs",
      },
      {
        name: "Purchase Entries",
        description:
          "Purchase entry management, product quantities, amounts, and quality control",
      },
      {
        name: "Purchase Quality Checks",
        description: "Purchase entry quality inspection APIs",
      },
    ],
    components: {
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "admin@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "Admin@123",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login successful",
            },
            token: {
              type: "string",
              example: "your-jwt-access-token",
            },
            user: {
              type: "object",
              properties: {
                staffName: {
                  type: "string",
                  example: "Admin User",
                },
                mobileNumber: {
                  type: "string",
                  example: "+919876543210",
                },
                employeeId: {
                  type: "string",
                  example: "EMP001",
                },
                email: {
                  type: "string",
                  format: "email",
                  example: "admin@example.com",
                },
                employeeType: {
                  type: "string",
                  enum: ["Admin", "Biller", "Purchaser"],
                  example: "Admin",
                },
              },
            },
          },
        },
        CreateUser: {
          type: "object",
          required: [
            "staffName",
            "mobileNumber",
            "employeeId",
            "email",
            "password",
            "employeeType",
          ],
          properties: {
            staffName: {
              type: "string",
              example: "John Smith",
            },
            mobileNumber: {
              type: "string",
              example: "+919876543210",
            },
            employeeId: {
              type: "string",
              example: "EMP001",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "Test@123",
            },
            employeeType: {
              type: "string",
              enum: ["Admin", "Biller", "Purchaser"],
              example: "Biller",
            },
          },
        },
        UpdateUser: {
          type: "object",
          properties: {
            staffName: {
              type: "string",
              example: "John Smith",
            },
            mobileNumber: {
              type: "string",
              example: "+919876543210",
            },
            employeeId: {
              type: "string",
              example: "EMP001",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 6,
              example: "NewPass@123",
            },
            employeeType: {
              type: "string",
              enum: ["Admin", "Biller", "Purchaser"],
            },
          },
        },
        UpdateUserStatus: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "boolean",
              example: false,
            },
          },
        },
        CreateVendor: {
          type: "object",
          required: [
            "vendorName",
            "contactNo",
            "bankName",
            "accountNo",
            "ifsc",
          ],
          properties: {
            vendorName: {
              type: "string",
              example: "ABC Suppliers",
            },
            contactNo: {
              type: "string",
              example: "9876543210",
            },
            bankName: {
              type: "string",
              example: "State Bank of India",
            },
            accountNo: {
              type: "string",
              example: "123456789012",
            },
            ifsc: {
              type: "string",
              example: "SBIN0001234",
            },
          },
        },
        UpdateVendor: {
          type: "object",
          properties: {
            vendorName: {
              type: "string",
              example: "ABC Suppliers",
            },
            contactNo: {
              type: "string",
              example: "9876543210",
            },
            bankName: {
              type: "string",
              example: "State Bank of India",
            },
            accountNo: {
              type: "string",
              example: "123456789012",
            },
            ifsc: {
              type: "string",
              example: "SBIN0001234",
            },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "User retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                _id: {
                  type: "string",
                  example: "671234567890abcdef123456",
                },
                staffName: {
                  type: "string",
                  example: "John Smith",
                },
                mobileNumber: {
                  type: "string",
                  example: "+919876543210",
                },
                employeeId: {
                  type: "string",
                  example: "EMP001",
                },
                email: {
                  type: "string",
                  format: "email",
                  example: "john@example.com",
                },
                employeeType: {
                  type: "string",
                  enum: ["Admin", "Biller", "Purchaser"],
                },
                status: {
                  type: "boolean",
                  example: true,
                },
              },
            },
          },
        },
        CreateCustomer: {
          type: "object",
          required: [
            "name",
            "contactNo",
            "whatsAppNo",
            "address",
            "email",
          ],
          properties: {
            name: {
              type: "string",
              example: "John Smith",
            },
            contactNo: {
              type: "string",
              example: "9876543210",
            },
            whatsAppNo: {
              type: "string",
              example: "+919876543210",
            },
            address: {
              type: "string",
              example: "Kochi, Kerala, India",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
          },
        },
        UpdateCustomer: {
          type: "object",
          properties: {
            name: {
              type: "string",
              example: "John Smith",
            },
            contactNo: {
              type: "string",
              example: "9876543210",
            },
            whatsAppNo: {
              type: "string",
              example: "+919876543210",
            },
            address: {
              type: "string",
              example: "Kochi, Kerala, India",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
          },
        },
        PurchaseEntryProductInput: {
          type: "object",
          required: ["productName", "purchaseQty", "purchaseRate"],
          properties: {
            productName: {
              type: "string",
              example: "Cotton Fabric",
            },
            purchaseQty: {
              type: "integer",
              minimum: 1,
              example: 10,
            },
            purchaseRate: {
              type: "number",
              minimum: 0,
              example: 25.5,
            },
          },
        },
        PurchaseEntryProduct: {
          type: "object",
          properties: {
            productName: {
              type: "string",
              example: "Cotton Fabric",
            },
            purchaseQty: {
              type: "integer",
              example: 10,
            },
            purchaseRate: {
              type: "number",
              example: 25.5,
            },
            amount: {
              type: "number",
              example: 255,
            },
          },
        },
        CreatePurchaseEntry: {
          type: "object",
          required: [
            "purchaseDate",
            "vendor",
            "products",
            "totalIncludingGST",
          ],
          properties: {
            purchaseDate: {
              type: "string",
              format: "date-time",
              example: "2026-10-16T00:00:00.000Z",
            },
            vendor: {
              type: "string",
              description: "Vendor MongoDB ObjectId",
              example: "671234567890123456789012",
            },
            products: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/PurchaseEntryProductInput",
              },
            },
            totalIncludingGST: {
              type: "number",
              minimum: 0,
              example: 267.75,
            },
          },
        },
        UpdatePurchaseEntry: {
          type: "object",
          properties: {
            purchaseDate: {
              type: "string",
              format: "date-time",
              example: "2026-10-16T00:00:00.000Z",
            },
            vendor: {
              type: "string",
              example: "671234567890123456789012",
            },
            products: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/PurchaseEntryProductInput",
              },
            },
            totalIncludingGST: {
              type: "number",
              minimum: 0,
              example: 267.75,
            },
            qcStatus: {
              type: "string",
              enum: ["Pending", "Done"],
              example: "Pending",
            },
          },
        },
        UpdatePurchaseEntryQC: {
          type: "object",
          required: ["qcStatus"],
          properties: {
            qcStatus: {
              type: "string",
              enum: ["Pending", "Done"],
              example: "Done",
            },
          },
        },
        Customer: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "671a12345678901234567890",
            },
            name: {
              type: "string",
              example: "John Smith",
            },
            contactNo: {
              type: "string",
              example: "9876543210",
            },
            whatsAppNo: {
              type: "string",
              example: "+919876543210",
            },
            address: {
              type: "string",
              example: "Kochi, Kerala, India",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            status: {
              type: "boolean",
              example: true,
            },
            isDeleted: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
