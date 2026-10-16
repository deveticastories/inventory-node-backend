import mongoose from "mongoose";
import * as customerRepo from "./customerRepository";
import { CreateCustomerInput, UpdateCustomerInput } from "../../validation/customerValidation";


export const createCustomer = async (
  customerData: CreateCustomerInput,
  createdBy: mongoose.Types.ObjectId,
) => {
  const existingEmail = await customerRepo.findByEmail(customerData.email);

  if (existingEmail) {
    throw new Error("CUSTOMER_EMAIL_EXISTS");
  }

  const existingWhatsApp = await customerRepo.findByWhatsAppNo(
    customerData.whatsAppNo,
  );

  if (existingWhatsApp) {
    throw new Error("CUSTOMER_WHATSAPP_EXISTS");
  }

  return customerRepo.create({
    ...customerData,
    createdBy,
  });
};

export const getAllCustomers = async (page: number, limit: number) => {
  return customerRepo.getAllCustomers(page, limit);
};

export const getCustomerById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("CUSTOMER_ID_INVALID");
  }

  return customerRepo.findById(id);
};

export const editCustomer = async (
  id: string,
  updateData: UpdateCustomerInput,
  updatedBy: mongoose.Types.ObjectId,
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("CUSTOMER_ID_INVALID");
  }

  const customer = await customerRepo.findById(id);

  if (!customer) {
    return null;
  }

  if (updateData.email) {
    const existingEmail = await customerRepo.findByEmail(updateData.email, id);

    if (existingEmail) {
      throw new Error("CUSTOMER_EMAIL_EXISTS");
    }
  }

  if (updateData.whatsAppNo) {
    const existingWhatsApp = await customerRepo.findByWhatsAppNo(
      updateData.whatsAppNo,
      id,
    );

    if (existingWhatsApp) {
      throw new Error("CUSTOMER_WHATSAPP_EXISTS");
    }
  }

  return customerRepo.updateById(id, {
    ...updateData,
    updatedBy,
    userUpdatedDate: new Date(),
  });
};

export const deleteCustomer = async (
  id: string,
  deletedBy: mongoose.Types.ObjectId,
) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error("CUSTOMER_ID_INVALID");
  }

  return customerRepo.deleteCustomer(id, deletedBy);
};