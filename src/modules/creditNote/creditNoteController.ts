
import { Response } from "express";
import mongoose from "mongoose";
import { RequestWithAuthData } from "../../@types/express.js";
import * as creditNoteService from "./creditNoteService.js";
import { message } from "../../constants/responseMessage.js";

export const createCreditNote = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: message.UNAUTHORIZED,
      });
      return;
    }

    const { amount, description } = req.body;

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    ) {
      res.status(400).json({
        success: false,
        message: message.INVALID_CREDIT_NOTE_AMOUNT,
      });
      return;
    }

    const creditNote = await creditNoteService.createCreditNote(
      {
        amount: Number(amount),
        ...(description !== undefined && { description }),
      },
      req.userId,
    );

    res.status(201).json({
      success: true,
      message: message.CREDIT_NOTE_CREATED,
      creditNote,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || message.CREDIT_NOTE_CREATED_FAILED,
    });
  }
};

// Get All Credit Notes
export const getAllCreditNotes = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: message.UNAUTHORIZED,
      });
      return;
    }

    const creditNotes = await creditNoteService.getAllCreditNotes();

    res.status(200).json({
      success: true,
      message: message.CREDIT_NOTES_FETCHED,
      creditNotes,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: message.CREDIT_NOTES_FETCH_FAILED,
    });
  }
};

export const getCreditNoteById = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: message.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;

    if (Array.isArray(id) || !mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: message.INVALID_CREDIT_NOTE_ID,
      });
      return;
    }

    const creditNote = await creditNoteService.getCreditNoteById(id);

    if (!creditNote) {
      res.status(404).json({
        success: false,
        message: message.CREDIT_NOTE_NOT_FOUND,
      });
      return;
    }

    res.status(200).json({
      success: true,
      creditNote,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: message.CREDIT_NOTE_FETCH_FAILED,
    });
  }
};

export const editCreditNote = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: message.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;
    const { amount, description } = req.body;

    if (Array.isArray(id) || !mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: message.INVALID_CREDIT_NOTE_ID,
      });
      return;
    }

    if (amount !== undefined) {
      if (
        amount === "" ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) < 0
      ) {
        res.status(400).json({
          success: false,
          message: message.INVALID_CREDIT_NOTE_AMOUNT,
        });
        return;
      }
    }

    if (amount === undefined && description === undefined) {
      res.status(400).json({
        success: false,
        message: message.CREDIT_NOTE_UPDATE_DATA_REQUIRED,
      });
      return;
    }

    const updatedCreditNote = await creditNoteService.editCreditNote(
      id,
      {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(description !== undefined && { description }),
      },
      req.userId,
    );

    res.status(200).json({
      success: true,
      message: message.CREDIT_NOTE_UPDATED,
      creditNote: updatedCreditNote,
    });
  } catch (error: any) {
    const notFound = error?.message === message.CREDIT_NOTE_NOT_FOUND;

    res.status(notFound ? 404 : 500).json({
      success: false,
      message: notFound
        ? message.CREDIT_NOTE_NOT_FOUND
        : message.CREDIT_NOTE_UPDATED_FAILED,
    });
  }
};

export const deleteCreditNote = async (
  req: RequestWithAuthData,
  res: Response,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: message.UNAUTHORIZED,
      });
      return;
    }

    const { id } = req.params;

    if (Array.isArray(id) || !mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: message.INVALID_CREDIT_NOTE_ID,
      });
      return;
    }

    const creditNote = await creditNoteService.deleteCreditNote(
      id,
      req.userId,
    );

    res.status(200).json({
      success: true,
      message: message.CREDIT_NOTE_DELETED,
      creditNote,
    });
  } catch (error: any) {
    const notFound = error?.message === message.CREDIT_NOTE_NOT_FOUND;

    res.status(notFound ? 404 : 500).json({
      success: false,
      message: notFound
        ? message.CREDIT_NOTE_NOT_FOUND
        : message.CREDIT_NOTE_DELETED_FAILED,
    });
  }
};
