
import { Router } from "express";
import * as dailyExpenseController from "./dailyExpenseController";
import verifyToken from "../../middleware/verifyToken";
import { validate } from "../../middleware/validate";
import {
    createDailyExpenseValidation,
    updateDailyExpensePackingValidation,
} from "../../validation/dailyExpenseValidation";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Daily Expenses
 *   description: Daily expense management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateDailyExpense:
 *       type: object
 *       required:
 *         - date
 *         - expenseType
 *         - paymentType
 *         - amount
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-10-17"
 *         expenseType:
 *           type: string
 *           example: Transportation
 *         paymentType:
 *           type: string
 *           enum: [Cash, Upi, Account]
 *           example: Cash
 *         amount:
 *           type: number
 *           exclusiveMinimum: 0
 *           example: 500
 *         description:
 *           type: string
 *           example: Local delivery charges
 *
 *     UpdateDailyExpensePacking:
 *       type: object
 *       required:
 *         - packingId
 *       properties:
 *         packingId:
 *           type: string
 *           minLength: 1
 *           example: PKG001
 *
 *     DailyExpense:
 *       allOf:
 *         - $ref: '#/components/schemas/CreateDailyExpense'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "671a12345678901234567890"
 *             packingId:
 *               type: string
 *               example: Open
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
 * /api/daily-expenses:
 *   post:
 *     summary: Create a daily expense
 *     tags: [Daily Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDailyExpense'
 *     responses:
 *       201:
 *         description: Daily expense created successfully
 *       400:
 *         description: Invalid daily expense data
 *       401:
 *         description: Unauthorized
 */
router.post(
    "/",
    validate(createDailyExpenseValidation),
    dailyExpenseController.createDailyExpense,
);

/**
 * @swagger
 * /api/daily-expenses:
 *   get:
 *     summary: Get all daily expenses
 *     tags: [Daily Expenses]
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
 *         description: Daily expenses fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", dailyExpenseController.getAllDailyExpenses);

/**
 * @swagger
 * /api/daily-expenses/{id}:
 *   get:
 *     summary: Get a daily expense by ID
 *     tags: [Daily Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Daily expense MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Daily expense fetched successfully
 *       400:
 *         description: Invalid daily expense ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Daily expense not found
 */
router.get("/:id", dailyExpenseController.getDailyExpenseById);

/**
 * @swagger
 * /api/daily-expenses/{id}/packing:
 *   patch:
 *     summary: Assign a packing ID to a daily expense
 *     description: Only expenses with packingId Open can be assigned a packing ID.
 *     tags: [Daily Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Daily expense MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDailyExpensePacking'
 *     responses:
 *       200:
 *         description: Daily expense packing ID updated successfully
 *       400:
 *         description: Invalid daily expense ID or packing ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Daily expense not found
 *       409:
 *         description: Daily expense already assigned
 */
router.patch(
    "/:id/packing",
    validate(updateDailyExpensePackingValidation),
    dailyExpenseController.updateDailyExpensePacking,
);

/**
 * @swagger
 * /api/daily-expenses/{id}:
 *   delete:
 *     summary: Soft-delete a daily expense
 *     tags: [Daily Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Daily expense MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Daily expense deleted successfully
 *       400:
 *         description: Invalid daily expense ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Daily expense not found
 */
router.delete("/:id", dailyExpenseController.deleteDailyExpense);

export default router;
