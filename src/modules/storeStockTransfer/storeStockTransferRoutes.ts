
import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import {
    createStockTransferController,
    getAllStockTransfersController,
    getStoreStockController,
} from "./storeStockTransferController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Store Stock Transfers
 *   description: APIs for transferring stock between stores and viewing available stock
 */

/**
 * @swagger
 * /api/store-stock-transfers:
 *   post:
 *     summary: Transfer approved stock to a store
 *     tags: [Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stores
 *             properties:
 *               transferDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-17T10:00:00.000Z"
 *               stores:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - storeName
 *                     - products
 *                   properties:
 *                     storeName:
 *                       type: string
 *                       example: "TRP_SAMPLE_STORE"
 *                     products:
 *                       type: array
 *                       minItems: 1
 *                       items:
 *                         type: object
 *                         required:
 *                           - purchaseEntry
 *                           - productName
 *                           - qty
 *                           - rate
 *                         properties:
 *                           purchaseEntry:
 *                             type: string
 *                             example: "671234567890123456789014"
 *                           productName:
 *                             type: string
 *                             example: "Cotton Fabric"
 *                           qty:
 *                             type: integer
 *                             minimum: 1
 *                             example: 5
 *                           rate:
 *                             type: number
 *                             minimum: 0
 *                             example: 100
 *                           total:
 *                             type: number
 *                             readOnly: true
 *                             example: 500
 *     responses:
 *       201:
 *         description: Stock transferred successfully
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Purchase entry or quality check not found
 *       500:
 *         description: Internal server error
 */
router.post("/", verifyToken, createStockTransferController);

/**
 * @swagger
 * /api/store-stock-transfers:
 *   get:
 *     summary: Get all stock transfer records
 *     tags: [Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stock transfers fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, getAllStockTransfersController);

/**
 * @swagger
 * /api/store-stock-transfers/stock/{storeName}:
 *   get:
 *     summary: Get stock transfers for a specific store
 *     tags: [Store Stock Transfers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeName
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination store name
 *         example: "TRP_SAMPLE_STORE"
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
 *     responses:
 *       200:
 *         description: Store stock fetched successfully
 *       400:
 *         description: Invalid store name
 *       500:
 *         description: Internal server error
 */
router.get("/stock/:storeName", verifyToken, getStoreStockController);

export default router;
