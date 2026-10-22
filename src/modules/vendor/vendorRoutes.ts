import { Router } from "express";
import * as vendorController from "./vendorController";
import verifyToken from "../../middleware/verifyToken";
import { validate } from "../../middleware/validate";
import {
  createVendorValidation,
  updateVendorValidation,
} from "../../validation/vendorValidation";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: Vendor management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateVendor:
 *       type: object
 *       required:
 *         - vendorName
 *         - contactNo
 *         - bankName
 *         - accountNo
 *         - ifsc
 *       properties:
 *         vendorName:
 *           type: string
 *           example: ABC Suppliers
 *         contactNo:
 *           type: string
 *           example: "9876543210"
 *         bankName:
 *           type: string
 *           example: State Bank of India
 *         accountNo:
 *           type: string
 *           example: "123456789012"
 *         ifsc:
 *           type: string
 *           example: SBIN0001234
 *
 *     UpdateVendor:
 *       type: object
 *       properties:
 *         vendorName:
 *           type: string
 *           example: ABC Suppliers
 *         contactNo:
 *           type: string
 *           example: "9876543210"
 *         bankName:
 *           type: string
 *           example: State Bank of India
 *         accountNo:
 *           type: string
 *           example: "123456789012"
 *         ifsc:
 *           type: string
 *           example: SBIN0001234
 *
 *     VendorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Vendor fetched successfully
 *         data:
 *           $ref: '#/components/schemas/Vendor'
 *
 *     Vendor:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateVendor'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 671a12345678901234567890
 *             status:
 *               type: boolean
 *               example: true
 *             isDeleted:
 *               type: boolean
 *               example: false
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/vendors:
 *   post:
 *     summary: Create a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVendor'
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *       400:
 *         description: Invalid vendor data
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Contact number already exists
 */
router.post(
  "/",
  validate(createVendorValidation),
  vendorController.createVendor,
);

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Vendors]
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
 *         description: Number of vendors per page
 *     responses:
 *       200:
 *         description: Vendors fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", vendorController.getAllVendors);



/**
 * @swagger
 * /api/vendors/{id}:
 *   get:
 *     summary: Get a vendor by ID
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Vendor fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VendorResponse'
 *       400:
 *         description: Invalid vendor ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 */
router.get("/:id", vendorController.getVendorById);

/**
 * @swagger
 * /api/vendors/{id}:
 *   put:
 *     summary: Update a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVendor'
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *       400:
 *         description: Invalid vendor data or ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       409:
 *         description: Contact number already exists
 */
router.put(
  "/:id",
  validate(updateVendorValidation),
  vendorController.editVendor,
);

/**
 * @swagger
 * /api/vendors/{id}:
 *   delete:
 *     summary: Delete a vendor (soft delete)
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 *       400:
 *         description: Invalid vendor ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 */
router.delete("/:id", vendorController.deleteVendor);

export default router;
