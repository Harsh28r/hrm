/** Shared with SalesApp `Constants/validation.js` */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authValidationMessages = {
  emailRequired: "Email is required",
  emailInvalid: "Please enter a valid email (e.g. name@domain.com)",
  passwordsDoNotMatch: "Passwords do not match.",
  fixPasswordRequirements: "Please fix password requirements above.",
} as const;
