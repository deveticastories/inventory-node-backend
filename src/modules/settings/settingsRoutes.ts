import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import * as settingsController from "./settingsController";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Transit rates (currency exchange rate and profit %)
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get the transit rates
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings fetched
 *   put:
 *     summary: Save the transit rates
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exchangeRate:
 *                 type: number
 *                 description: 1 AED = exchangeRate INR
 *                 example: 22.7
 *               profitPercent:
 *                 type: number
 *                 example: 25
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

export default router;
