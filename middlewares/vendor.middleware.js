import vendorRepository from '../repositories/vendor.repository.js';
import { VENDOR_MESSAGES, VENDOR_STATUS } from '../constants/vendor.constants.js';
import { errorResponse } from '../utils/response.util.js';
import { ERROR_CODES, HTTP_STATUS } from '../constants/error.constants.js';

/** Resolve vendor profile for the authenticated user onto req.vendor */
export const resolveVendor = async (req, res, next) => {
  try {
    if (!req.user?.user_id) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Authentication required', ERROR_CODES.UNAUTHORIZED);
    }

    const vendor = await vendorRepository.getByUserId(req.user.user_id);
    if (!vendor) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, VENDOR_MESSAGES.VENDOR_NOT_FOUND, ERROR_CODES.FORBIDDEN);
    }

    req.vendor = vendor;
    return next();
  } catch (error) {
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to resolve vendor profile',
      ERROR_CODES.INTERNAL_SERVER_ERROR,
    );
  }
};

/** Only approved vendors may mutate business data */
export const requireApprovedVendor = (req, res, next) => {
  if (!req.vendor) {
    return errorResponse(res, HTTP_STATUS.FORBIDDEN, VENDOR_MESSAGES.VENDOR_NOT_FOUND, ERROR_CODES.FORBIDDEN);
  }
  if (req.vendor.status !== VENDOR_STATUS.APPROVED) {
    return errorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      VENDOR_MESSAGES.VENDOR_NOT_APPROVED,
      ERROR_CODES.FORBIDDEN,
    );
  }
  return next();
};

export default { resolveVendor, requireApprovedVendor };
