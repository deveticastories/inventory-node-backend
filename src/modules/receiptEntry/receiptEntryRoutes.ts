
import { Router } from "express";
import * as receiptEntryController from "./receiptEntryController";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Receipt Entries
 *   description: Receipt entry management for billing invoices
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReceiptEntry:
 *       type: object
 *       required:
 *         - invoice
 *         - receivedAmount
 *       properties:
 *         invoice:
 *           type: string
 *           description: Billing invoice ObjectId
 *           example: "671a1b2c3d4e5f6071829301"
 *         receivedAmount:
 *           type: number
 *           minimum: 0.01
 *           example: 100
 *     ReceiptEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         receiptNo:
 *           type: string
 *           example: "REC-0001"
 *         invoice:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             invoiceNo:
 *               type: string
 *             date:
 *               type: string
 *               format: date-time
 *             customer:
 *               type: object
 *             netAmount:
 *               type: number
 *             receivedAmount:
 *               type: number
 *             balanceAmount:
 *               type: number
 *         receivedAmount:
 *           type: number
 *         balanceAmount:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ReceiptEntryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/ReceiptEntry'
 */

/**
 * @swagger
 * /api/receipt-entries:
 *   post:
 *     summary: Create a receipt entry
 *     tags: [Receipt Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReceiptEntry'
 *     responses:
 *       201:
 *         description: Receipt entry created successfully
 *       400:
 *         description: Invalid invoice ID or receipt amount
 *       404:
 *         description: Billing invoice not found
 */
router.post("/", receiptEntryController.createReceiptEntry);

/**
 * @swagger
 * /api/receipt-entries:
 *   get:
 *     summary: Get all receipt entries with pagination
 *     tags: [Receipt Entries]
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
 *         description: Receipt entries fetched successfully
 */
router.get("/", receiptEntryController.getAllReceiptEntries);

/**
 * @swagger
 * /api/receipt-entries/invoice/{invoiceId}:
 *   get:
 *     summary: Get receipt entries by billing invoice ID
 *     tags: [Receipt Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt entries fetched successfully
 *       400:
 *         description: Invalid billing invoice ID
 */
router.get(
    "/invoice/:invoiceId",
    receiptEntryController.getReceiptEntriesByInvoice,
);

/**
 * @swagger
 * /api/receipt-entries/{id}:
 *   get:
 *     summary: Get a receipt entry by ID
 *     tags: [Receipt Entries]
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
 *         description: Receipt entry fetched successfully
 *       404:
 *         description: Receipt entry not found
 */
router.get("/:id", receiptEntryController.getReceiptEntryById);

/**
 * @swagger
 * /api/receipt-entries/{id}:
 *   put:
 *     summary: Update a receipt entry
 *     tags: [Receipt Entries]
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
 *         description: Receipt entry updated successfully
 *       400:
 *         description: Receipt amount and invoice cannot be edited
 *       404:
 *         description: Receipt entry not found
 */
router.put("/:id", receiptEntryController.editReceiptEntry);

/**
 * @swagger
 * /api/receipt-entries/{id}:
 *   delete:
 *     summary: Soft-delete a receipt entry
 *     tags: [Receipt Entries]
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
 *         description: Receipt entry deleted successfully
 *       404:
 *         description: Receipt entry not found
 */
router.delete("/:id", receiptEntryController.deleteReceiptEntry);

export default router;
