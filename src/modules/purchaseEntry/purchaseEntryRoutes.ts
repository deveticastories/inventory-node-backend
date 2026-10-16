
import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import { validate } from "../../middleware/validate";

import {
  createPurchaseEntryController,
  getAllPurchaseEntriesController,
  getPurchaseEntryByIdController,
  updatePurchaseEntryController,
  updatePurchaseEntryQCController,
  deletePurchaseEntryController,
} from "./purchaseEntryController";
import { createPurchaseEntryValidation, updatePurchaseEntryValidation, updatePurchaseEntryQCValidation } from "../../validation/purchaseEntryValidation";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PurchaseEntryProductInput:
 *       type: object
 *       required:
 *         - productName
 *         - purchaseQty
 *         - purchaseRate
 *       properties:
 *         productName:
 *           type: string
 *           example: Cotton Fabric
 *         purchaseQty:
 *           type: integer
 *           minimum: 1
 *           example: 10
 *         purchaseRate:
 *           type: number
 *           minimum: 0
 *           example: 25.5
 *     PurchaseEntryProduct:
 *       allOf:
 *         - $ref: '#/components/schemas/PurchaseEntryProductInput'
 *         - type: object
 *           properties:
 *             amount:
 *               type: number
 *               example: 255
 *     PurchaseEntryInput:
 *       type: object
 *       required:
 *         - purchaseDate
 *         - vendor
 *         - products
 *         - totalIncludingGST
 *       properties:
 *         purchaseDate:
 *           type: string
 *           format: date-time
 *           example: "2026-10-15T00:00:00.000Z"
 *         vendor:
 *           type: string
 *           description: MongoDB ObjectId of the vendor
 *           example: "671234567890123456789012"
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/PurchaseEntryProductInput'
 *         totalIncludingGST:
 *           type: number
 *           minimum: 0
 *           example: 267.75
 *     PurchaseEntry:
 *       allOf:
 *         - $ref: '#/components/schemas/PurchaseEntryInput'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *             invoiceNo:
 *               type: string
 *               example: PUR-0001
 *             totalProductQty:
 *               type: number
 *               example: 10
 *             totalAmount:
 *               type: number
 *               example: 255
 *             qcStatus:
 *               type: string
 *               enum: [Pending, Done]
 *               example: Pending
 *             vendor:
 *               oneOf:
 *                 - type: string
 *                 - type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     vendorName:
 *                       type: string
 *                     contactNo:
 *                       type: string
 *     PurchaseEntryQCUpdate:
 *       type: object
 *       required:
 *         - qcStatus
 *       properties:
 *         qcStatus:
 *           type: string
 *           enum: [Pending, Done]
 *           example: Done
 *     PurchaseEntryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/PurchaseEntry'
 *     PurchaseEntryListResponse:
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
 *             $ref: '#/components/schemas/PurchaseEntry'
 *         pagination:
 *           type: object
 *           description: Pagination metadata returned by the pagination utility
 *
 * tags:
 *   - name: Purchase Entries
 *     description: Purchase entry management
 */

/**
 * @swagger
 * /api/purchase-entries:
 *   post:
 *     summary: Create a purchase entry
 *     tags: [Purchase Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseEntryInput'
 *     responses:
 *       201:
 *         description: Purchase entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseEntryResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Failed to create purchase entry
 *   get:
 *     summary: Get all purchase entries
 *     tags: [Purchase Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *     responses:
 *       200:
 *         description: Purchase entries fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseEntryListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch purchase entries
 */
router
  .route("/")
  .post(
    verifyToken,
    validate(createPurchaseEntryValidation),
    createPurchaseEntryController,
  )
  .get(verifyToken, getAllPurchaseEntriesController);

/**
 * @swagger
 * /api/purchase-entries/{id}:
 *   get:
 *     summary: Get a purchase entry by ID
 *     tags: [Purchase Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase entry MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Purchase entry fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseEntryResponse'
 *       400:
 *         description: Invalid purchase entry ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase entry not found
 *       500:
 *         description: Failed to fetch purchase entry
 *   put:
 *     summary: Update a purchase entry
 *     tags: [Purchase Entries]
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
 *             $ref: '#/components/schemas/PurchaseEntryInput'
 *     responses:
 *       200:
 *         description: Purchase entry updated successfully
 *       400:
 *         description: Invalid ID or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase entry or vendor not found
 *       500:
 *         description: Failed to update purchase entry
 *   delete:
 *     summary: Soft-delete a purchase entry
 *     tags: [Purchase Entries]
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
 *         description: Purchase entry deleted successfully
 *       400:
 *         description: Invalid purchase entry ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase entry not found
 *       500:
 *         description: Failed to delete purchase entry
 */
router
  .route("/:id")
  .get(verifyToken, getPurchaseEntryByIdController)
  .put(
    verifyToken,
    validate(updatePurchaseEntryValidation),
    updatePurchaseEntryController,
  )
  .delete(verifyToken, deletePurchaseEntryController);

/**
 * @swagger
 * /api/purchase-entries/{id}/qc:
 *   patch:
 *     summary: Update purchase entry QC status
 *     tags: [Purchase Entries]
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
 *             $ref: '#/components/schemas/PurchaseEntryQCUpdate'
 *     responses:
 *       200:
 *         description: QC status updated successfully
 *       400:
 *         description: Invalid ID or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase entry not found
 *       500:
 *         description: Failed to update QC status
 */
router.patch(
  "/:id/qc",
  verifyToken,
  validate(updatePurchaseEntryQCValidation),
  updatePurchaseEntryQCController,
);

export default router;
