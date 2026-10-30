
import { Router } from "express";
import * as packingListController from "./packingListController";
import verifyToken from "../../middleware/verifyToken";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Packing Lists
 *   description: Packing list management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PackingStyle:
 *       type: object
 *       description: Qty is taken from TRP_MAIN STORE for the product + vendor, oldest purchase first
 *       required:
 *         - styleNo
 *         - productName
 *         - vendor
 *         - qty
 *       properties:
 *         styleNo:
 *           type: string
 *           description: Must be unique across all packing lists
 *           example: ST-201
 *         productName:
 *           type: string
 *           example: Cotton Kurti
 *         vendor:
 *           type: string
 *           description: Vendor MongoDB ObjectId
 *           example: "68f1a1234567890123456789"
 *         qty:
 *           type: integer
 *           minimum: 1
 *           example: 20
 *
 *     TransferStylesToUAE:
 *       type: object
 *       required:
 *         - styleIds
 *       properties:
 *         styleIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: string
 *           description: _id values of styles inside PackingList.styles
 *
 *     UpdatePackingListsStatus:
 *       type: object
 *       required:
 *         - packingListIds
 *         - packingListStatus
 *       properties:
 *         packingListIds:
 *           type: array
 *           minItems: 1
 *           uniqueItems: true
 *           items:
 *             type: string
 *             pattern: '^[0-9a-fA-F]{24}$'
 *           description: Array of packing list MongoDB ObjectIds
 *           example:
 *             - "68f1a1234567890123456780"
 *             - "68f1a1234567890123456781"
 *         packingListStatus:
 *           type: string
 *           enum:
 *             - Pending
 *             - In Transit queue
 *             - Completed
 *           example: Completed
 *
 *     UpdatePackingListsStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Packing list statuses updated successfully
 *         data:
 *           type: object
 *           properties:
 *             matchedCount:
 *               type: integer
 *               example: 2
 *             modifiedCount:
 *               type: integer
 *               example: 2
 *             packingListStatus:
 *               type: string
 *               enum:
 *                 - Pending
 *                 - In Transit queue
 *                 - Completed
 *               example: Completed
 *
 *     CreatePackingList:
 *       type: object
 *       required:
 *         - packingDate
 *         - styles
 *       properties:
 *         packingDate:
 *           type: string
 *           format: date-time
 *           example: "2026-10-18T00:00:00.000Z"
 *         salary:
 *           type: number
 *           minimum: 0
 *           example: 1500
 *         styles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PackingStyle'
 *         dailyExpenses:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of DailyExpense MongoDB ObjectIds
 *           example:
 *             - "68f1a1234567890123456781"
 *             - "68f1a1234567890123456782"
 *         packingListStatus:
 *           type: string
 *           enum:
 *             - Pending
 *             - In Transit queue
 *             - Completed
 *           default: In Transit queue
 *
 *     UpdatePackingList:
 *       type: object
 *       properties:
 *         packingDate:
 *           type: string
 *           format: date-time
 *         salary:
 *           type: number
 *           minimum: 0
 *         styles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PackingStyle'
 *         dailyExpenses:
 *           type: array
 *           items:
 *             type: string
 *         packingListStatus:
 *           type: string
 *           enum:
 *             - Pending
 *             - In Transit queue
 *             - Completed
 *
 *     PackingList:
 *       allOf:
 *         - $ref: '#/components/schemas/CreatePackingList'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "68f1a1234567890123456780"
 *             packingId:
 *               type: string
 *               readOnly: true
 *               description: Auto-generated in the format PK-0001, PK-0002, ...
 *               example: PK-0004
 *             totalQty:
 *               type: number
 *               readOnly: true
 *               description: Sum of qty across all styles
 *               example: 100
 *             totalExpense:
 *               type: number
 *               readOnly: true
 *               example: 1500
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
 *
 *     PackingListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Packing list fetched successfully
 *         data:
 *           $ref: '#/components/schemas/PackingList'
 *
 *     PackingListListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Packing lists fetched successfully
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PackingList'
 *         pagination:
 *           type: object
 *           description: Pagination metadata
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Invalid packing list ID
 */

/**
 * @swagger
 * /api/packing-lists:
 *   post:
 *     summary: Create a packing list
 *     description: >
 *       The packing ID is generated by the server. Total quantity is
 *       calculated from the styles array.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePackingList'
 *     responses:
 *       201:
 *         description: Packing list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackingListResponse'
 *       400:
 *         description: Invalid packing list data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Duplicate entry or packing ID generation failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.post("/", packingListController.createPackingList);

/**
 * @swagger
 * /api/packing-lists:
 *   get:
 *     summary: Get all packing lists
 *     description: Returns paginated packing lists, newest packing date first. Can be filtered by status.
 *     tags: [Packing Lists]
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
 *         description: Number of packing lists per page
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - Pending
 *             - In Transit queue
 *             - Completed
 *         description: Filter by packing list status. Omit to return all.
 *     responses:
 *       200:
 *         description: Packing lists fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackingListListResponse'
 *       400:
 *         description: Invalid status filter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch packing lists
 */
router.get("/", packingListController.getAllPackingLists);

/**
 * @swagger
 * /api/packing-lists/available-stock:
 *   get:
 *     summary: TRP_MAIN STORE stock available for packing
 *     description: >
 *       No query - products that have stock. productName - vendors that have
 *       that product. productName + vendor - available qty for the pair.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productName
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available stock fetched
 */
router.get("/available-stock", packingListController.getAvailableStock);

/**
 * @swagger
 * /api/packing-lists/{id}/transit:
 *   get:
 *     summary: Transit view - AED conversion and expense recommendation per style
 *     description: >
 *       Uses the saved exchange rate and profit %. Updated unit rate = per pc AED +
 *       (salary + attached expenses) / exchange rate / number of styles.
 *     tags: [Packing Lists]
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
 *         description: Transit details fetched
 *       404:
 *         description: Packing list not found
 */
router.get("/:id/transit", packingListController.getTransitDetails);

/**
 * @swagger
 * /api/packing-lists/{id}/transfer-to-uae:
 *   patch:
 *     summary: Transfer selected styles to UAE_MAIN STORE
 *     tags: [Packing Lists]
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
 *             $ref: '#/components/schemas/TransferStylesToUAE'
 *     responses:
 *       200:
 *         description: Styles transferred; returns the refreshed transit details
 *       400:
 *         description: Invalid or already transferred styles
 *       404:
 *         description: Packing list or style not found
 */
router.patch(
    "/:id/transfer-to-uae",
    packingListController.transferStylesToUAE,
);

/**
 * @swagger
 * /api/packing-lists/update-status:
 *   patch:
 *     summary: Update status of multiple packing lists
 *     description: >
 *       Updates packingListStatus for multiple packing lists.
 *       Every supplied ID receives the same status.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePackingListsStatus'
 *           example:
 *             packingListIds:
 *               - "68f1a1234567890123456780"
 *               - "68f1a1234567890123456781"
 *             packingListStatus: Completed
 *     responses:
 *       200:
 *         description: Packing list statuses updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdatePackingListsStatusResponse'
 *       400:
 *         description: Invalid IDs, duplicate IDs, or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: One or more packing lists were not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.patch(
    "/update-status",
    packingListController.updatePackingListsStatus,
);

/**
 * @swagger
 * /api/packing-lists/{id}:
 *   get:
 *     summary: Get a packing list by ID
 *     description: Returns the packing list with its stock transfer and daily expense details.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Packing list MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Packing list fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackingListResponse'
 *       400:
 *         description: Invalid packing list ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Packing list not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", packingListController.getPackingListById);

/**
 * @swagger
 * /api/packing-lists/{id}:
 *   put:
 *     summary: Update a packing list
 *     description: >
 *       The packing ID cannot be changed through this endpoint. Total
 *       quantity is recalculated by the server whenever styles are sent.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Packing list MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePackingList'
 *     responses:
 *       200:
 *         description: Packing list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackingListResponse'
 *       400:
 *         description: Invalid packing list ID or packing list data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Packing list not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", packingListController.editPackingList);

/**
 * @swagger
 * /api/packing-lists/{id}:
 *   delete:
 *     summary: Soft-delete a packing list
 *     description: Marks the packing list as deleted. Its packing ID is never reused.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Packing list MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Packing list deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackingListResponse'
 *       400:
 *         description: Invalid packing list ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Packing list not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", packingListController.deletePackingList);

export default router;
