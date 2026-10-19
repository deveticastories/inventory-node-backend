import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import * as indianStoreStockTransferController from "./indianStoreStockTransferController";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Indian Store Stock Transfers
 *   description: Transfer stock between stores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     IndianStoreStockTransferProductInput:
 *       type: object
 *       required:
 *         - qualityCheckProduct
 *         - qty
 *       properties:
 *         qualityCheckProduct:
 *           type: string
 *           description: MongoDB ObjectId of the product subdocument in Purchase Quality Check
 *           example: "671a12345678901234567890"
 *         qty:
 *           type: integer
 *           minimum: 1
 *           description: Quantity to transfer
 *           example: 10
 *
 *     IndianStoreStockTransferCreate:
 *       type: object
 *       required:
 *         - fromStore
 *         - toStore
 *         - products
 *       properties:
 *         fromStore:
 *           type: string
 *           description: Source store MongoDB ObjectId
 *           example: "671a12345678901234567891"
 *         toStore:
 *           type: string
 *           description: Destination store MongoDB ObjectId
 *           example: "671a12345678901234567892"
 *         transferDate:
 *           type: string
 *           format: date-time
 *           description: Transfer date; defaults to the current date and time
 *           example: "2026-10-19T09:00:00.000Z"
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/IndianStoreStockTransferProductInput'
 *
 *     IndianStoreStockTransferProduct:
 *       type: object
 *       required:
 *         - qualityCheckProduct
 *         - productName
 *         - transferredQty
 *         - availableQty
 *         - rate
 *         - total
 *       properties:
 *         qualityCheckProduct:
 *           type: string
 *           description: Purchase Quality Check product subdocument ID
 *           example: "671a12345678901234567890"
 *         productName:
 *           type: string
 *           example: "Cotton Fabric"
 *         transferredQty:
 *           type: integer
 *           minimum: 1
 *           description: Quantity transferred in this transfer record
 *           example: 10
 *         availableQty:
 *           type: integer
 *           minimum: 0
 *           description: Remaining source-store quantity recorded when the transfer was created
 *           example: 90
 *         rate:
 *           type: number
 *           example: 125.5
 *         total:
 *           type: number
 *           example: 1255
 *
 *     IndianStoreStockTransferStore:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "671a12345678901234567891"
 *         location:
 *           type: string
 *           example: "Main Store"
 *         contact:
 *           type: string
 *           example: "9876543210"
 *         inCharge:
 *           type: string
 *           example: "Store Manager"
 *
 *     IndianStoreStockTransfer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "671a12345678901234567893"
 *         fromStore:
 *           $ref: '#/components/schemas/IndianStoreStockTransferStore'
 *         toStore:
 *           $ref: '#/components/schemas/IndianStoreStockTransferStore'
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IndianStoreStockTransferProduct'
 *         transferDate:
 *           type: string
 *           format: date-time
 *         stockValue:
 *           type: number
 *           example: 1255
 *         status:
 *           type: boolean
 *           example: true
 *         isDeleted:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     IndianStoreStockTransferProductOption:
 *       type: object
 *       properties:
 *         qualityCheckProduct:
 *           type: string
 *           example: "671a12345678901234567890"
 *         productName:
 *           type: string
 *           example: "Cotton Fabric"
 *         rate:
 *           type: number
 *           example: 125.5
 *         transferredQty:
 *           type: integer
 *           description: Total quantity transferred into the selected destination store
 *           example: 42
 *         availableQty:
 *           type: integer
 *           description: Remaining stock currently available in the selected store
 *           example: 35
 *
 *     IndianStoreStockTransferSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Indian store stock transfer fetched successfully"
 *         data:
 *           $ref: '#/components/schemas/IndianStoreStockTransfer'
 *
 *     IndianStoreStockTransferErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "INSUFFICIENT_STORE_STOCK"
 *
 *     IndianStoreStockTransferListResponse:
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
 *             $ref: '#/components/schemas/IndianStoreStockTransfer'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     IndianStoreStockTransferStoreStockListResponse:
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
 *             $ref: '#/components/schemas/IndianStoreStockTransferProductOption'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *
 *     Pagination:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: integer
 *           example: 1
 *         totalPages:
 *           type: integer
 *           example: 3
 *         totalRecords:
 *           type: integer
 *           example: 25
 *         limit:
 *           type: integer
 *           example: 10
 */

/**
 * @swagger
 * /api/indian-store-stock-transfers/products:
 *   get:
 *     summary: Get products and available stock for a store
 *     description: |
 *       fromStore returns Purchase Quality Check products and available stock.
 *       toStore returns products transferred into the selected store,
 *       including transferredQty and availableQty.
 *     tags: [Indian Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store MongoDB ObjectId
 *         example: "671a12345678901234567891"
 *       - in: query
 *         name: storeType
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - fromStore
 *             - toStore
 *         description: Source or destination store product list
 *         example: fromStore
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IndianStoreStockTransferProductOption'
 *       400:
 *         description: Invalid store ID or store type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get(
    "/products",
    indianStoreStockTransferController.getIndianStoreStockTransferProductsController,
);

/**
 * @swagger
 * /api/indian-store-stock-transfers:
 *   post:
 *     summary: Create an Indian Store Stock Transfer
 *     tags: [Indian Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IndianStoreStockTransferCreate'
 *     responses:
 *       201:
 *         description: Stock transfer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferSuccessResponse'
 *       400:
 *         description: Invalid request or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       404:
 *         description: Store or QC product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.post(
    "/",
    indianStoreStockTransferController.createIndianStoreStockTransferController,
);

/**
 * @swagger
 * /api/indian-store-stock-transfers:
 *   get:
 *     summary: Get transfer history or products filtered by store
 *     description: |
 *       Without store filters, returns transfer history.
 *       With fromStore, returns QC products and available stock for the source store.
 *       With toStore, returns products transferred into the destination store.
 *       Destination products include transferredQty and availableQty.
 *       Only one store filter can be supplied at a time.
 *     tags: [Indian Store Stock Transfers]
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
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: fromStore
 *         schema:
 *           type: string
 *         description: Source store MongoDB ObjectId
 *         example: "671a12345678901234567891"
 *       - in: query
 *         name: toStore
 *         schema:
 *           type: string
 *         description: Destination store MongoDB ObjectId
 *         example: "671a12345678901234567892"
 *     responses:
 *       200:
 *         description: Transfer history or store stock fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/IndianStoreStockTransferListResponse'
 *                 - $ref: '#/components/schemas/IndianStoreStockTransferStoreStockListResponse'
 *       400:
 *         description: Invalid store ID or both store filters supplied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get(
    "/",
    indianStoreStockTransferController.getAllIndianStoreStockTransfersController,
);

/**
 * @swagger
 * /api/indian-store-stock-transfers/{id}:
 *   get:
 *     summary: Get an Indian Store Stock Transfer by ID
 *     tags: [Indian Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transfer MongoDB ObjectId
 *         example: "671a12345678901234567893"
 *     responses:
 *       200:
 *         description: Transfer fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferSuccessResponse'
 *       400:
 *         description: Invalid transfer ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IndianStoreStockTransferErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.get(
    "/:id",
    indianStoreStockTransferController.getIndianStoreStockTransferByIdController,
);

export default router;