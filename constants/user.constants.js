export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
};

export const USER_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_FETCHED: 'User fetched successfully',
  USERS_FETCHED: 'Users fetched successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_NOT_FOUND: 'User not found',
  USER_APPROVED: 'User approved successfully',
  USER_REJECTED: 'User rejected successfully',
  USER_BLOCKED: 'User blocked successfully',
  USER_UNBLOCKED: 'User unblocked successfully',
  EMAIL_EXISTS: 'Email already exists',
  PHONE_EXISTS: 'Phone number already exists',
  ALREADY_APPROVED: 'User is already approved',
  ALREADY_REJECTED: 'User is already rejected',
  ALREADY_BLOCKED: 'User is already blocked',
  NOT_BLOCKED: 'User is not blocked',
  NOT_PENDING: 'User is not in pending status',
};

export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: 'Registration successful. Awaiting admin approval.',
  CUSTOMER_REGISTER_SUCCESS: 'Customer account created successfully',
  PROFILE_FETCHED: 'Profile fetched successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_PENDING: 'Account pending admin approval',
  ACCOUNT_REJECTED: 'Account has been rejected',
  ACCOUNT_BLOCKED: 'Account has been blocked',
  FORGOT_PASSWORD_SENT: 'Password reset link sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
};

export const GSI = {
  EMAIL: 'email-index',
  PHONE: 'phone-index',
  ROLE: 'role-index',
  STATUS: 'status-index',
};
