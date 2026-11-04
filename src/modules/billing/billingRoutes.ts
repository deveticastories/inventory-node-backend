import { Router } from "express";
import {
    createBillingController,
    getAllBillingsController,
    getBillingByIdController,
    updateBillingController,
    deleteBillingController,
    updateBillingPaymentStatusController,
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
 *         - uaeMainStock
 *         - qty
 *         - unitPrice
 *       properties:
 *         uaeMainStock:
 *           type: string
 *           description: UAE_MAIN STORE stock row ID (from /api/uae-store-stock-transfers/main-stock); style no and product are taken from it
 *         qty:
 *           type: integer
 *           minimum: 1
 *           description: Must not exceed the available qty; deducted from UAE_MAIN STORE
 *         unitPrice:
 *           type: number
 *           description: Selling price in AED (defaults to the stock row's selling price on the UI, editable)
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
 *           description: Customer document ID
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/BillingProductInput'
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
 *             returnAmount:
 *               type: number
 *               readOnly: true
 *               description: Sum of customer returns against this invoice
 *             receivedAmount:
 *               type: number
 *               readOnly: true
 *               description: Sum of receipt entries against this invoice
 *             netAmount:
 *               type: number
 *               readOnly: true
 *             paidAmount:
 *               type: number
 *               readOnly: true
 *             balanceAmount:
 *               type: number
 *               readOnly: true
 *             isPaid:
 *               type: boolean
 *               readOnly: true
 *             paidStatus:
 *               type: string
 *               enum:
 *                 - Fully Paid
 *                 - Partial Paid
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
 * /api/billings/{id}/payment-status:
 *   patch:
 *     summary: Update billing payment status
 *     tags: [Billings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Billing document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paidAmount
 *               - paidStatus
 *             properties:
 *               paidAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 300
 *                 description: Payment amount to add to the existing paid amount
 *               paidStatus:
 *                 type: string
 *                 enum:
 *                   - Fully Paid
 *                   - Partial Paid
 *                 example: Partial Paid
 *                 description: Payment status based on the remaining balance
 *     responses:
 *       200:
 *         description: Billing payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BillingResponse'
 *       400:
 *         description: Invalid payment amount, invalid payment status, or payment exceeds balance
 *       404:
 *         description: Billing invoice not found
 */
router.patch("/:id/payment-status", updateBillingPaymentStatusController);
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