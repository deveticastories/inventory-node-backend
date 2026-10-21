import { Router } from "express";
import {
    createUAEStoreStockTransferController,
    getAllUAEStoreStockTransfersController,
    getUAEStoreStockTransferByIdController,
    updateUAEStoreStockTransferController,
    deleteUAEStoreStockTransferController,
} from "./uaeStoreStockTransferController";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: UAE Store Stock Transfers
 *   description: UAE store stock return management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UAEStoreStockReturnProduct:
 *       type: object
 *       required:
 *         - packingList
 *         - packingStyle
 *         - styleNo
 *         - productName
 *         - returnedQty
 *         - invoiceNo
 *         - invoiceValue
 *         - updatedInvoiceValue
 *         - inStore
 *       properties:
 *         packingList:
 *           type: string
 *           description: Packing list MongoDB ObjectId
 *         packingStyle:
 *           type: string
 *           description: Packing style subdocument MongoDB ObjectId
 *         styleNo:
 *           type: string
 *         productName:
 *           type: string
 *         returnedQty:
 *           type: integer
 *           minimum: 1
 *         invoiceNo:
 *           type: string
 *         invoiceValue:
 *           type: number
 *           minimum: 0
 *         updatedInvoiceValue:
 *           type: number
 *           minimum: 0
 *         inStore:
 *           type: number
 *           minimum: 0
 *
 *     UAEStoreStockTransfer:
 *       type: object
 *       required:
 *         - packingList
 *         - fromStore
 *         - toStore
 *         - returnType
 *         - reason
 *         - products
 *         - returnDate
 *       properties:
 *         _id:
 *           type: string
 *           readOnly: true
 *         packingList:
 *           type: string
 *           description: Packing list MongoDB ObjectId
 *         fromStore:
 *           type: string
 *           description: Source store MongoDB ObjectId
 *         toStore:
 *           type: string
 *           description: Destination store MongoDB ObjectId
 *         returnType:
 *           type: string
 *           enum:
 *             - Fully
 *             - Partially
 *         reason:
 *           type: string
 *           enum:
 *             - Damage
 *             - Size issue
 *             - Other
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/UAEStoreStockReturnProduct'
 *         returnDate:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *
 *     UAEStoreStockTransferPaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UAEStoreStockTransfer'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             totalRecords:
 *               type: integer
 *               example: 25
 *             totalPages:
 *               type: integer
 *               example: 3
 *             hasPreviousPage:
 *               type: boolean
 *               example: false
 *             hasNextPage:
 *               type: boolean
 *               example: true
 */

/**
 * @swagger
 * /api/uae-store-stock-transfers:
 *   post:
 *     summary: Create a UAE store stock return
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UAEStoreStockTransfer'
 *           example:
 *             packingList: "671a12345678901234567890"
 *             fromStore: "671a12345678901234567892"
 *             toStore: "671a12345678901234567893"
 *             returnType: Partially
 *             reason: Damage
 *             products:
 *               - packingList: "671a12345678901234567890"
 *                 packingStyle: "671a12345678901234567891"
 *                 styleNo: "ST-001"
 *                 productName: Cotton Shirt
 *                 returnedQty: 2
 *                 invoiceNo: INV-001
 *                 invoiceValue: 1500
 *                 updatedInvoiceValue: 1200
 *                 inStore: 5
 *             returnDate: "2026-10-21T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: UAE store return created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UAEStoreStockTransfer'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get all UAE store stock returns with pagination and filters
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Records per page
 *       - in: query
 *         name: packingList
 *         schema:
 *           type: string
 *         description: Filter by packing list MongoDB ObjectId
 *       - in: query
 *         name: fromStore
 *         schema:
 *           type: string
 *         description: Filter by source store MongoDB ObjectId
 *       - in: query
 *         name: toStore
 *         schema:
 *           type: string
 *         description: Filter by destination store MongoDB ObjectId
 *     responses:
 *       200:
 *         description: UAE store returns retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UAEStoreStockTransferPaginatedResponse'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/uae-store-stock-transfers/{id}:
 *   get:
 *     summary: Get a UAE store stock return by ID
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UAE store return MongoDB ObjectId
 *     responses:
 *       200:
 *         description: UAE store return retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/UAEStoreStockTransfer'
 *       400:
 *         description: Invalid return ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: UAE store return not found
 *
 *   put:
 *     summary: Update a UAE store stock return
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UAE store return MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UAEStoreStockTransfer'
 *           example:
 *             packingList: "671a12345678901234567890"
 *             fromStore: "671a12345678901234567892"
 *             toStore: "671a12345678901234567893"
 *             returnType: Fully
 *             reason: "Size issue"
 *             products:
 *               - packingList: "671a12345678901234567890"
 *                 packingStyle: "671a12345678901234567891"
 *                 styleNo: ST-001
 *                 productName: Cotton Shirt
 *                 returnedQty: 3
 *                 invoiceNo: INV-001
 *                 invoiceValue: 1500
 *                 updatedInvoiceValue: 1400
 *                 inStore: 8
 *             returnDate: "2026-10-21T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: UAE store return updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: UAE store return not found
 *
 *   delete:
 *     summary: Soft delete a UAE store stock return
 *     tags: [UAE Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UAE store return MongoDB ObjectId
 *     responses:
 *       200:
 *         description: UAE store return deleted successfully
 *       400:
 *         description: Invalid return ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: UAE store return not found
 */

router.post("/", createUAEStoreStockTransferController);
router.get("/", getAllUAEStoreStockTransfersController);
router.get("/:id", getUAEStoreStockTransferByIdController);
router.put("/:id", updateUAEStoreStockTransferController);
router.delete("/:id", deleteUAEStoreStockTransferController);

export default router;
