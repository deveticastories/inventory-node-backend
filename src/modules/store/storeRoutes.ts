import { Router } from "express";
import * as storeController from "./storeController";
import verifyToken from "../../middleware/verifyToken";
import { validate } from "../../middleware/validate";
import { createStoreValidation, updateStoreValidation } from "../../validation/storeValidation";


const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Stores
 *   description: Store management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateStore:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - contactNumber
 *         - inCharge
 *       properties:
 *         name:
 *           type: string
 *           example: Kochi Store
 *         location:
 *           type: string
 *           enum: [IND, UAE]
 *           example: IND
 *         contactNumber:
 *           type: string
 *           example: "9876543210"
 *         inCharge:
 *           type: string
 *           description: MongoDB ObjectId of the assigned user
 *           example: 671a12345678901234567890
 *
 *     UpdateStore:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Kochi Store
 *         location:
 *           type: string
 *           enum: [IND, UAE]
 *         contactNumber:
 *           type: string
 *           example: "9876543210"
 *         inCharge:
 *           type: string
 *           description: MongoDB ObjectId of the assigned user
 *
 *     Store:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateStore'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
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
 * /api/stores:
 *   post:
 *     summary: Create a store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStore'
 *     responses:
 *       201:
 *         description: Store created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Contact number already exists
 */
router.post(
  "/",
  validate(createStoreValidation),
  storeController.createStore,
);

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Stores]
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
 *         description: Stores fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", storeController.getAllStores);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get a store by ID
 *     tags: [Stores]
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
 *         description: Store fetched successfully
 *       400:
 *         description: Invalid store ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */
router.get("/:id", storeController.getStoreById);

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update a store
 *     tags: [Stores]
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
 *             $ref: '#/components/schemas/UpdateStore'
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 *       409:
 *         description: Contact number already exists
 */
router.put(
  "/:id",
  validate(updateStoreValidation),
  storeController.editStore,
);

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete a store (soft delete)
 *     tags: [Stores]
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
 *         description: Store deleted successfully
 *       400:
 *         description: Invalid store ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Store not found
 */
router.delete("/:id", storeController.deleteStore);

export default router;
