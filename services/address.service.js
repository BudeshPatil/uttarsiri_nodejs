import addressRepository from '../repositories/address.repository.js';
import { ADDRESS_MESSAGES } from '../constants/address.constants.js';
import AppError from '../utils/appError.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';
import logger from '../config/logger.js';

const assertOwned = (address, userId) => {
  if (!address || address.user_id !== userId) {
    throw new AppError(ADDRESS_MESSAGES.ADDRESS_NOT_FOUND, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
};

export const listAddresses = async (userId) => {
  const result = await addressRepository.listByUser(userId);
  return { addresses: result.items };
};

export const getAddress = async (userId, addressId) => {
  const address = await addressRepository.getById(addressId);
  assertOwned(address, userId);
  return address;
};

export const createAddress = async (userId, payload) => {
  try {
    const existing = await addressRepository.listByUser(userId);
    const makeDefault = payload.is_default === true || existing.items.length === 0;

    if (makeDefault) {
      await addressRepository.clearDefault(userId);
    }

    return addressRepository.createAddress({
      ...payload,
      user_id: userId,
      is_default: makeDefault,
    });
  } catch (error) {
    logger.error('createAddress failed', { error: error.message, userId });
    throw error;
  }
};

export const updateAddress = async (userId, addressId, payload) => {
  const address = await addressRepository.getById(addressId);
  assertOwned(address, userId);

  if (payload.is_default === true) {
    await addressRepository.clearDefault(userId);
  }

  return addressRepository.updateAddress(addressId, payload);
};

export const deleteAddress = async (userId, addressId) => {
  const address = await addressRepository.getById(addressId);
  assertOwned(address, userId);
  await addressRepository.softDelete(addressId);

  if (address.is_default) {
    const remaining = await addressRepository.listByUser(userId);
    if (remaining.items[0]) {
      await addressRepository.updateAddress(remaining.items[0].address_id, { is_default: true });
    }
  }

  return { message: ADDRESS_MESSAGES.ADDRESS_DELETED };
};

export const setDefaultAddress = async (userId, addressId) => {
  const address = await addressRepository.getById(addressId);
  assertOwned(address, userId);
  await addressRepository.clearDefault(userId);
  return addressRepository.updateAddress(addressId, { is_default: true });
};

export default {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
