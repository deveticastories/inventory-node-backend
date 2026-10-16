
import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import {
  createOrUpdateQualityCheckController,
  getAllQualityChecksController,
  getQualityCheckByIdController,
} from "./purchaseQualityCheckController";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Purchase Quality Checks
 *   description: Purchase entry quality inspection APIs
 */

/**
 * @swagger
 * /api/purchase-quality-checks:
 *   post:
 *     summary: Create a purchase quality check
 *     description: Calculates approved quantities, damaged quantities, available quantities, and payable amounts using the purchase entry data.
 *     tags: [Purchase Quality Checks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseEntry
 *               - products
 *             properties:
 *               purchaseEntry:
 *                 type: string
 *                 example: "68f123456789abcdef123456"
 *               products:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - damageQty
 *                   properties:
 *                     damageQty:
 *                       type: integer
 *                       minimum: 0
 *                       example: 2
 *     responses:
 *       200:
 *         description: Purchase quality check saved successfully
 *       400:
 *         description: Invalid input or quality check already completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase entry not found
 */
router.post(
  "/",
  verifyToken,
  createOrUpdateQualityCheckController,
);

/**
 * @swagger
 * /api/purchase-quality-checks:
 *   get:
 *     summary: Get all purchase quality checks
 *     tags: [Purchase Quality Checks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase quality checks fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, getAllQualityChecksController);

/**
 * @swagger
 * /api/purchase-quality-checks/{id}:
 *   get:
 *     summary: Get a purchase quality check by ID
 *     tags: [Purchase Quality Checks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase quality check ObjectId
 *     responses:
 *       200:
 *         description: Purchase quality check fetched successfully
 *       400:
 *         description: Invalid quality check ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Purchase quality check not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getQualityCheckByIdController);

export default router;
