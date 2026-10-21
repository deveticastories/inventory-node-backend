
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
 *       required:
 *         - styleNo
 *         - indianStoreStockTransfer
 *         - indianStoreStockTransferProduct
 *         - qty
 *       properties:
 *         styleNo:
 *           type: string
 *           example: STY001
 *         indianStoreStockTransfer:
 *           type: string
 *           description: Indian Store Stock Transfer MongoDB ObjectId
 *           example: "68f1a1234567890123456789"
 *         indianStoreStockTransferProduct:
 *           type: string
 *           description: Product subdocument ID from the transfer's products array
 *           example: "68f1a1234567890123456788"
 *         qty:
 *           type: number
 *           minimum: 1
 *           example: 100
 *
 *     PackingStyleTransitUpdate:
 *       type: object
 *       required:
 *         - styleId
 *         - transit
 *       properties:
 *         styleId:
 *           type: string
 *           description: MongoDB ObjectId of a style subdocument inside PackingList.styles
 *           example: "68f1a1234567890123456788"
 *         transit:
 *           type: object
 *           required:
 *             - perPcAED
 *             - expenseRecAED
 *             - updatedUnitRateAED
 *           properties:
 *             perPcAED:
 *               type: number
 *               minimum: 0
 *               example: 12.5
 *             expenseRecAED:
 *               type: number
 *               minimum: 0
 *               example: 100
 *             updatedUnitRateAED:
 *               type: number
 *               minimum: 0
 *               example: 13.5
 *
 *     ConvertPackingStylesToAED:
 *       type: object
 *       required:
 *         - styles
 *       properties:
 *         styles:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/PackingStyleTransitUpdate'
 *
 *     ConvertPackingStylesToAEDResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Packing styles converted to AED successfully
 *         data:
 *           type: object
 *           properties:
 *             updatedCount:
 *               type: integer
 *               example: 2
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
 * /api/packing-lists/convert-to-aed:
 *   patch:
 *     summary: Update packing style transit values in AED
 *     description: >
 *       Updates the transit values for one or more packing style subdocuments.
 *       Each styleId must be the _id of a style inside PackingList.styles.
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConvertPackingStylesToAED'
 *           example:
 *             styles:
 *               - styleId: "68f1a1234567890123456788"
 *                 transit:
 *                   perPcAED: 12.5
 *                   expenseRecAED: 100
 *                   updatedUnitRateAED: 13.5
 *               - styleId: "68f1a1234567890123456789"
 *                 transit:
 *                   perPcAED: 15
 *                   expenseRecAED: 80
 *                   updatedUnitRateAED: 16
 *     responses:
 *       200:
 *         description: Packing styles converted to AED successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConvertPackingStylesToAEDResponse'
 *       400:
 *         description: Missing styles, invalid IDs, duplicate IDs, or invalid transit values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: One or more packing styles were not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.patch(
    "/convert-to-aed",
    packingListController.convertPackingStylesToAED,
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
