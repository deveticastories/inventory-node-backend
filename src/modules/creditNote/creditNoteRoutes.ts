
import { Router } from "express";
import {
    createCreditNote,
    getAllCreditNotes,
    getCreditNoteById,
    editCreditNote,
    deleteCreditNote,
} from "./creditNoteController.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateCreditNoteRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           minimum: 0
 *           example: 5000
 *         description:
 *           type: string
 *           example: Office petty cash expense
 *
 *     UpdateCreditNoteRequest:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *           minimum: 0
 *           example: 4500
 *         description:
 *           type: string
 *           example: Updated petty cash expense
 *
 *     CreditNoteResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 674abc123456789012345678
 *         amount:
 *           type: number
 *           example: 5000
 *         description:
 *           type: string
 *           example: Office petty cash expense
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreditNoteApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Credit note fetched successfully
 *         data:
 *           $ref: '#/components/schemas/CreditNoteResponse'
 *
 * tags:
 *   - name: Credit Notes
 *     description: Credit Note management APIs
 */

/**
 * @swagger
 * /api/credit-notes:
 *   post:
 *     summary: Create a new credit note
 *     tags: [Credit Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCreditNoteRequest'
 *     responses:
 *       201:
 *         description: Credit note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditNoteApiResponse'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", verifyToken, createCreditNote);

/**
 * @swagger
 * /api/credit-notes:
 *   get:
 *     summary: Get all credit notes
 *     tags: [Credit Notes]
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
 *         description: Number of records per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search credit notes by description
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter credit notes from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter credit notes until this date
 *     responses:
 *       200:
 *         description: Credit notes fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CreditNoteResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalRecords:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, getAllCreditNotes);

/**
 * @swagger
 * /api/credit-notes/{id}:
 *   get:
 *     summary: Get credit note by ID
 *     tags: [Credit Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Credit Note MongoDB ObjectId
 *         example: 674abc123456789012345678
 *     responses:
 *       200:
 *         description: Credit note retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditNoteApiResponse'
 *       400:
 *         description: Invalid credit note ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Credit note not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", verifyToken, getCreditNoteById);

/**
 * @swagger
 * /api/credit-notes/{id}:
 *   patch:
 *     summary: Update credit note
 *     tags: [Credit Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Credit Note MongoDB ObjectId
 *         example: 674abc123456789012345678
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCreditNoteRequest'
 *     responses:
 *       200:
 *         description: Credit note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreditNoteApiResponse'
 *       400:
 *         description: Invalid ID or request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Credit note not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", verifyToken, editCreditNote);

/**
 * @swagger
 * /api/credit-notes/{id}:
 *   delete:
 *     summary: Delete credit note
 *     description: Soft-delete a credit note.
 *     tags: [Credit Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Credit Note MongoDB ObjectId
 *         example: 674abc123456789012345678
 *     responses:
 *       200:
 *         description: Credit note deleted successfully
 *       400:
 *         description: Invalid credit note ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Credit note not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, deleteCreditNote);

export default router;
