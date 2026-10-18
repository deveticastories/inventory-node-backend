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
 *         - date
 *         - styleNo
 *         - productName
 *         - vendorName
 *         - qty
 *       properties:
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2026-10-18T00:00:00.000Z"
 *         styleNo:
 *           type: string
 *           example: STY001
 *         productName:
 *           type: string
 *           example: Cotton Shirt
 *         vendorName:
 *           type: string
 *           description: Vendor MongoDB ObjectId
 *           example: "68f1a1234567890123456789"
 *         qty:
 *           type: number
 *           minimum: 1
 *           example: 100
 *         availableQuantity:
 *           type: number
 *           minimum: 0
 *           example: 75
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
 *               example: PACK001
 *             packingListStatus:
 *               type: string
 *               enum:
 *                 - Pending
 *                 - In Transit queue
 *                 - Completed
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
 */

/**
 * @swagger
 * /api/packing-lists:
 *   post:
 *     summary: Create a packing list
 *     description: Packing ID is generated automatically by the server.
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
 *       400:
 *         description: Invalid packing list data
 *       401:
 *         description: Unauthorized
 */
router.post("/", packingListController.createPackingList);

/**
 * @swagger
 * /api/packing-lists:
 *   get:
 *     summary: Get all packing lists
 *     tags: [Packing Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of packing lists per page
 *     responses:
 *       200:
 *         description: Packing lists fetched successfully, including vendor details in styles
 *       401:
 *         description: Unauthorized
 */
router.get("/", packingListController.getAllPackingLists);

/**
 * @swagger
 * /api/packing-lists/{id}:
 *   get:
 *     summary: Get a packing list by ID
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
 *       400:
 *         description: Invalid packing list ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Packing list not found
 */
router.get("/:id", packingListController.getPackingListById);

/**
 * @swagger
 * /api/packing-lists/{id}:
 *   put:
 *     summary: Update a packing list
 *     description: Packing ID cannot be changed through this endpoint.
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
 *       400:
 *         description: Invalid packing list ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Packing list not found
 */
router.put("/:id", packingListController.editPackingList);

/**
 * @swagger
 * /api/packing-lists/{id}:
 *   delete:
 *     summary: Soft-delete a packing list
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
 *       400:
 *         description: Invalid packing list ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Packing list not found
 */
router.delete("/:id", packingListController.deletePackingList);

export default router;