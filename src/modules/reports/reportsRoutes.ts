import { Router } from "express";
import verifyToken from "../../middleware/verifyToken";
import {
    getAllPurchaseEntryReportsController,
    getAllSalesReportsController,
    getAllDebitReportsController,
    getAllTransitReportsController,
} from "./reportsController";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Purchase entry, sales, debit, and transit reports
 */

/**
 * @swagger
 * /api/reports/purchase-entry:
 *   get:
 *     summary: Get all purchase entry reports
 *     description: Retrieves paginated purchase entries with vendor details, quality check details, and associated payment entries.
 *     tags: [Reports]
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
 *         description: Number of purchase entries per page
 *     responses:
 *       200:
 *         description: Purchase entry reports retrieved successfully
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/purchase-entry", getAllPurchaseEntryReportsController);

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Get all sales reports
 *     description: Returns paginated billing records with customer details, receipt entries, and aggregated receipt totals. Optionally filters by bill ID.
 *     tags: [Reports]
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
 *       - in: query
 *         name: billId
 *         schema:
 *           type: string
 *         description: Optional Billing document ObjectId
 *     responses:
 *       200:
 *         description: Sales reports retrieved successfully
 *       400:
 *         description: Invalid bill ID or pagination parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/sales", getAllSalesReportsController);

/**
 * @swagger
 * /api/reports/debit:
 *   get:
 *     summary: Get all debit reports
 *     description: Retrieves paginated debit records from payment entries and daily expenses, sorted by report date.
 *     tags: [Reports]
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
 *         description: Debit reports retrieved successfully
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/debit", getAllDebitReportsController);

/**
 * @swagger
 * /api/reports/transit:
 *   get:
 *     summary: Get all transit reports
 *     description: Retrieves paginated packing lists with transit details, daily expenses, and matching UAE stock return products based on style number.
 *     tags: [Reports]
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
 *     responses:
 *       200:
 *         description: Transit reports retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/transit", getAllTransitReportsController);

export default router;
