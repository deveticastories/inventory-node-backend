
import mongoose from "mongoose";
import CreditNote, {
  CreditNoteDocument,
} from "../../models/creditNoteModel";

export const create = async (
  data: Partial<CreditNoteDocument>,
  session?: mongoose.ClientSession,
): Promise<CreditNoteDocument> => {
  const creditNote = new CreditNote(data);
  return creditNote.save({ session });
};

export const findById = async (
  id: string,
  session?: mongoose.ClientSession,
): Promise<CreditNoteDocument | null> => {
  return CreditNote.findOne({
    _id: id,
    isDeleted: false,
  })
    .session(session ?? null)
    .exec();
};


export const getAllCreditNotes = async (
  session?: mongoose.ClientSession,
): Promise<CreditNoteDocument[]> => {
  return CreditNote.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .session(session ?? null)
    .exec();
};

export const updateById = async (
  id: string,
  data: Partial<CreditNoteDocument>,
  session?: mongoose.ClientSession,
): Promise<CreditNoteDocument | null> => {
  return CreditNote.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $set: {
        ...data,
        userUpdatedDate: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
      session,
    },
  ).exec();
};

export const deleteCreditNote = async (
  id: string,
  deletedBy?: mongoose.Types.ObjectId,
  session?: mongoose.ClientSession,
): Promise<CreditNoteDocument | null> => {
  const updateData: Record<string, unknown> = {
    isDeleted: true,
    deletedAt: new Date(),
  };

  if (deletedBy) {
    updateData.deletedBy = deletedBy;
  }

  return CreditNote.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: updateData },
    {
      returnDocument: "after",
      session,
    },
  ).exec();
};
