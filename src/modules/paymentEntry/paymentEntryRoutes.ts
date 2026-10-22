
import { Router } from "express";
import * as paymentEntryController from "./paymentEntryController";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Payment Entries
 *   description: Payment entry management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePaymentEntry:
 *       type: object
 *       required:
 *         - purchaseInvoice
 *         - paidAmount
 *       properties:
 *         purchaseInvoice:
 *           type: string
 *           description: PurchaseEntry MongoDB ObjectId
 *           example: 671a2b3c4d5e6f7890123456
 *         paidAmount:
 *           type: number
 *           minimum: 0.01
 *           example: 5000
 *
 *     PaymentEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         paymentVoucherNo:
 *           type: string
 *           example: PAY-0001
 *         purchaseInvoice:
 *           type: object
 *           description: Aggregated purchase entry and vendor details
 *         paidAmount:
 *           type: number
 *           example: 5000
 *         balanceAmount:
 *           type: number
 *           example: 24500
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PaymentEntryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/PaymentEntry'
 *
 *     PaymentEntryListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PaymentEntry'
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
 * /api/payment-entries:
 *   post:
 *     summary: Create a payment entry
 *     description: Payment voucher number is generated automatically in PAY-0001 format.
 *     tags: [Payment Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentEntry'
 *     responses:
 *       201:
 *         description: Payment entry created successfully
 *       400:
 *         description: Invalid purchase entry or payment amount
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase entry not found
 *       409:
 *         description: Payment voucher number already exists
 */
router.post("/", paymentEntryController.createPaymentEntry);

/**
 * @swagger
 * /api/payment-entries:
 *   get:
 *     summary: Get all payment entries
 *     tags: [Payment Entries]
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
 *         description: Payment entries fetched successfully with aggregated purchase and vendor details
 *       401:
 *         description: Unauthorized
 */
router.get("/", paymentEntryController.getAllPaymentEntries);

/**
 * @swagger
 * /api/payment-entries/purchase/{purchaseInvoice}:
 *   get:
 *     summary: Get payment entries by purchase entry ID
 *     tags: [Payment Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseInvoice
 *         required: true
 *         schema:
 *           type: string
 *         description: PurchaseEntry MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Payment entries fetched successfully
 *       400:
 *         description: Invalid purchase entry ID
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/purchase/:purchaseInvoice",
    paymentEntryController.getPaymentEntriesByPurchaseEntry,
);

/**
 * @swagger
 * /api/payment-entries/{id}:
 *   get:
 *     summary: Get a payment entry by ID
 *     tags: [Payment Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PaymentEntry MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Payment entry fetched successfully
 *       400:
 *         description: Invalid payment entry ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment entry not found
 */
router.get("/:id", paymentEntryController.getPaymentEntryById);

/**
 * @swagger
 * /api/payment-entries/{id}:
 *   put:
 *     summary: Update a payment entry
 *     description: Payment amount and purchase entry cannot be edited.
 *     tags: [Payment Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PaymentEntry MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: Payment entry updated successfully
 *       400:
 *         description: Invalid ID or update not allowed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment entry not found
 */
router.put("/:id", paymentEntryController.editPaymentEntry);

/**
 * @swagger
 * /api/payment-entries/{id}:
 *   delete:
 *     summary: Soft-delete a payment entry
 *     tags: [Payment Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PaymentEntry MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Payment entry deleted successfully
 *       400:
 *         description: Invalid payment entry ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment entry not found
 */
router.delete("/:id", paymentEntryController.deletePaymentEntry);

export default router;
