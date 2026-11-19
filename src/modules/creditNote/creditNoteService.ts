
import mongoose from "mongoose";
import {
  CreditNoteDocument,
} from "../../models/creditNoteModel.js";
import * as creditNoteRepository from "./creditNoteRepository.js";
import PettyCash from "../../models/pettyCashModel.js";
import {
  updatePettyCashBalance, recalculatePettyCashFromMonth
} from "../pettyCash/pettyCashService.js";

export const createCreditNote = async (
  data: Partial<CreditNoteDocument>,
  createdBy: mongoose.Types.ObjectId,
): Promise<CreditNoteDocument> => {
  const creditNote = await creditNoteRepository.create({
    ...data,
    createdBy,
    updatedBy: createdBy,
  });

  const expenseDate = creditNote.createdAt ?? new Date();

  await recalculatePettyCashFromMonth(
    expenseDate.getMonth() + 1,
    expenseDate.getFullYear(),
  );
  return creditNote;
};

export const getAllCreditNotes = async () => {
  const creditNotes = await creditNoteRepository.getAllCreditNotes();

  const pettyCash = await PettyCash.findOne({
    isDeleted: false,
  }).select("pettyCashBalance balanceAfterExpenses");

  return {
    totalCreditNotes: creditNotes.length,
    creditNoteList: creditNotes,
    pettyCashBalance: pettyCash?.pettyCashBalance ?? 0,
    balanceAfterExpenses: pettyCash?.balanceAfterExpenses ?? 0,
  };
};

export const getCreditNoteById = async (
  id: string,
): Promise<CreditNoteDocument | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Credit Note ID");
  }

  return creditNoteRepository.findById(id);
}


export const editCreditNote = async (
    id: string,
    data: Partial<CreditNoteDocument>,
    updatedBy: mongoose.Types.ObjectId,
): Promise<CreditNoteDocument> => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid Credit Note ID");
    }

    const existingCreditNote = await creditNoteRepository.findById(id);

    if (!existingCreditNote) {
        throw new Error("Credit Note not found");
    }

    const creditNote = await creditNoteRepository.updateById(
        id,
        {
            ...data,
            updatedBy,
            userUpdatedDate: new Date(),
        },
    );

    if (!creditNote) {
        throw new Error("Credit Note not found");
    }

    const expenseDate = existingCreditNote.createdAt ?? new Date();

    await recalculatePettyCashFromMonth(
        expenseDate.getMonth() + 1,
        expenseDate.getFullYear(),
    );

    return creditNote;
};

export const deleteCreditNote = async (
    id: string,
    deletedBy?: mongoose.Types.ObjectId,
): Promise<CreditNoteDocument> => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid Credit Note ID");
    }

    const existingCreditNote = await creditNoteRepository.findById(id);

    if (!existingCreditNote) {
        throw new Error("Credit Note not found");
    }

    const creditNote = await creditNoteRepository.deleteCreditNote(
        id,
        deletedBy,
    );

    if (!creditNote) {
        throw new Error("Credit Note not found");
    }

    const expenseDate = existingCreditNote.createdAt ?? new Date();

    await recalculatePettyCashFromMonth(
        expenseDate.getMonth() + 1,
        expenseDate.getFullYear(),
    );

    return creditNote;
};
