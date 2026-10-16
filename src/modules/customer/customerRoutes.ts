import { Router } from "express";
import * as customerController from "./customerController";
import verifyToken from "../../middleware/verifyToken";
import { validate } from "../../middleware/validate";
import { createCustomerValidation, updateCustomerValidation } from "../../validation/customerValidation";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCustomer:
 *       type: object
 *       required:
 *         - name
 *         - contactNo
 *         - whatsAppNo
 *         - address
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           example: John Smith
 *         contactNo:
 *           type: string
 *           example: "9876543210"
 *         whatsAppNo:
 *           type: string
 *           example: "919876543210"
 *         address:
 *           type: string
 *           example: Kochi, Kerala, India
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *
 *     UpdateCustomer:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         contactNo:
 *           type: string
 *         whatsAppNo:
 *           type: string
 *         address:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *
 *     Customer:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateCustomer'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             status:
 *               type: boolean
 *             isDeleted:
 *               type: boolean
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid customer data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email or WhatsApp number already exists
 */
router.post(
  "/",
  validate(createCustomerValidation),
  customerController.createCustomer,
);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Customers fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", customerController.getAllCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Customer fetched successfully
 *       400:
 *         description: Invalid customer ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get("/:id", customerController.getCustomerById);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCustomer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Invalid customer data or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       409:
 *         description: Email or WhatsApp number already exists
 */
router.put(
  "/:id",
  validate(updateCustomerValidation),
  customerController.editCustomer,
);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Soft-delete a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       400:
 *         description: Invalid customer ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.delete("/:id", customerController.deleteCustomer);

export default router;