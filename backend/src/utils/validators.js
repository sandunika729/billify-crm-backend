'use strict';

/**
 * Validates an email address against a standard format.
 * Returns true if the email is empty/null (optional fields shouldn't fail format validation).
 */
function isValidEmail(email) {
  if (!email || !email.trim()) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a mobile/phone number.
 * Returns true if the phone is empty/null.
 * Requires at least 10 digits, allows optional +, spaces, and hyphens.
 */
function isValidPhone(phone) {
  if (!phone || !phone.trim()) return true;
  const phoneRegex = /^[+]?[\d\s-]{10,20}$/;
  return phoneRegex.test(phone.trim());
}

module.exports = {
  isValidEmail,
  isValidPhone
};
