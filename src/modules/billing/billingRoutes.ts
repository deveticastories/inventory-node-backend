
import { Router } from "express";
import {
    createBillingController,
    getAllBillingsController,
    getBillingByIdController,
    updateBillingController,
    deleteBillingController,
} from "./billingController";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Billings
 *   description: Billing and invoice management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BillingProductInput:
 *       type: object
 *       required:
 *         - uaeStoreStockTransfer
 *         - packingStyle
 *         - styleNo
 *         - productName
 *         - qty
 *         - unitPrice
 *       properties:
 *         uaeStoreStockTransfer:
 *           type: string
 *           description: UAE Store Stock Transfer document ID
 *         packingStyle:
 *           type: string
 *           description: Packing style subdocument ID
 *         styleNo:
 *           type: string
 *         productName:
 *           type: string
 *         qty:
 *           type: integer
 *           minimum: 1
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *     BillingInput:
 *       type: object
 *       required:
 *         - customer
 *         - products
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *         customer:
 *           type: string
 *           description: User document ID
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/BillingProductInput'
 *         returnAmount:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         receivedAmount:
 *           type: number
 *           minimum: 0
 *           default: 0
 *     Billing:
 *       allOf:
 *         - $ref: '#/components/schemas/BillingInput'
 *         - type: object
 *           properties:
 *             invoiceNo:
 *               type: string
 *               readOnly: true
 *             totalQty:
 *               type: integer
 *               readOnly: true
 *             invoiceTotal:
 *               type: number
 *               readOnly: true
 *             netAmount:
 *               type: number
 *               readOnly: true
 *             balanceAmount:
 *               type: number
 *               readOnly: true
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *     BillingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Billing'
 *     BillingPaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Billing'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             limit:
 *               type: integer
 *             totalRecords:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             hasPreviousPage:
 *               type: boolean
 *             hasNextPage:
 *               type: boolean
 */

/**
 * @swagger
 * /api/billings:
 *   post:
 *     summary: Create a billing invoice
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillingInput'
 *     responses:
 *       201:
 *         description: Billing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingResponse'
 *       400:
 *         description: Invalid billing input
 */
router.post("/", createBillingController);

/**
 * @swagger
 * /api/billings:
 *   get:
 *     summary: Get all billing invoices
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Filter by User document ID
 *     responses:
 *       200:
 *         description: Billing invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingPaginatedResponse'
 */
router.get("/", getAllBillingsController);

/**
 * @swagger
 * /api/billings/{id}:
 *   get:
 *     summary: Get a billing invoice by ID
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Billing invoice retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingResponse'
 *       404:
 *         description: Billing invoice not found
 */
router.get("/:id", getBillingByIdController);

/**
 * @swagger
 * /api/billings/{id}:
 *   put:
 *     summary: Update a billing invoice
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillingInput'
 *     responses:
 *       200:
 *         description: Billing invoice updated successfully
 *       400:
 *         description: Invalid billing input
 *       404:
 *         description: Billing invoice not found
 */
router.put("/:id", updateBillingController);

/**
 * @swagger
 * /api/billings/{id}:
 *   delete:
 *     summary: Soft delete a billing invoice
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Billing invoice deleted successfully
 *       404:
 *         description: Billing invoice not found
 */
router.delete("/:id", deleteBillingController);

export default router;
