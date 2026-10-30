import { Router } from "express";
import * as uaeController from "./uaeStoreStockTransferController";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: UAE Store Stock Transfers
 *   description: UAE_MAIN STORE stock, customer returns (UAE_RETURN STORE) and moving returns back to main
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UAEReturnCreate:
 *       type: object
 *       required:
 *         - invoice
 *         - returnType
 *         - reason
 *       properties:
 *         invoice:
 *           type: string
 *           description: Billing invoice MongoDB ObjectId
 *         returnType:
 *           type: string
 *           enum: [Fully, Partial]
 *           description: Fully returns every line's returnable qty; Partial uses `products`
 *         reason:
 *           type: string
 *           enum: [Damage, Size issue, Other]
 *         returnDate:
 *           type: string
 *           format: date
 *         products:
 *           type: array
 *           description: Required for Partial returns
 *           items:
 *             type: object
 *             properties:
 *               billingProduct:
 *                 type: string
 *                 description: _id of the line inside Billing.products
 *               qty:
 *                 type: integer
 *                 minimum: 1
 *     UAEReturnMoveToMain:
 *       type: object
 *       required:
 *         - returnId
 *         - returnProduct
 *         - qty
 *       properties:
 *         returnId:
 *           type: string
 *         returnProduct:
 *           type: string
 *           description: _id of the line inside the return's products
 *         qty:
 *           type: integer
 *           minimum: 1
 */

/**
 * @swagger
 * /api/uae-store-stock-transfers/main-stock:
 *   get:
 *     summary: UAE_MAIN STORE stock with stock volume / value (at cost)
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Style no or product name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, style, product]
 *     responses:
 *       200:
 *         description: Stock fetched
 */
router.get("/main-stock", uaeController.getUAEMainStockController);

/**
 * @swagger
 * /api/uae-store-stock-transfers/return-stock:
 *   get:
 *     summary: UAE_RETURN STORE rows (returned qty, reason, invoice value, updated invoice value, in store)
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, style, product]
 *     responses:
 *       200:
 *         description: Return store rows fetched
 */
router.get("/return-stock", uaeController.getReturnStoreStockController);

/**
 * @swagger
 * /api/uae-store-stock-transfers/returnable/{invoiceId}:
 *   get:
 *     summary: Invoice lines with invoiced, already returned and returnable qty
 *     tags: [UAE Store Stock Transfers]
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
 *         description: Returnable products fetched
 *       404:
 *         description: Invoice not found
 */
router.get("/returnable/:invoiceId", uaeController.getReturnableProductsController);

/**
 * @swagger
 * /api/uae-store-stock-transfers/move-to-main:
 *   post:
 *     summary: Move non-damaged returned stock back to UAE_MAIN STORE
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UAEReturnMoveToMain'
 *     responses:
 *       200:
 *         description: Stock moved; returns the UAE_MAIN STORE row
 *       400:
 *         description: Damaged return or qty above what is in the return store
 */
router.post("/move-to-main", uaeController.moveReturnToMainStoreController);

/**
 * @swagger
 * /api/uae-store-stock-transfers:
 *   post:
 *     summary: Create a customer return against an invoice
 *     description: Adds the stock to UAE_RETURN STORE and reduces the invoice's net / balance amount.
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UAEReturnCreate'
 *     responses:
 *       201:
 *         description: Return created
 *       400:
 *         description: Validation failed or qty exceeds returnable qty
 *   get:
 *     summary: List returns
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: invoice
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns fetched
 */
router.post("/", uaeController.createUAEStoreStockTransferController);
router.get("/", uaeController.getAllUAEStoreStockTransfersController);

/**
 * @swagger
 * /api/uae-store-stock-transfers/{id}:
 *   get:
 *     summary: Get a return by ID
 *     tags: [UAE Store Stock Transfers]
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
 *         description: Return fetched
 *       404:
 *         description: Return not found
 *   delete:
 *     summary: Cancel a return (only while nothing was moved back to main)
 *     tags: [UAE Store Stock Transfers]
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
 *         description: Return cancelled and invoice amounts restored
 *       409:
 *         description: Part of the return was already moved to UAE_MAIN STORE
 */
router.get("/:id", uaeController.getUAEStoreStockTransferByIdController);
router.delete("/:id", uaeController.deleteUAEStoreStockTransferController);

export default router;
