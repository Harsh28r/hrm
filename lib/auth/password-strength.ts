/**
 * Password strength checklist (aligned with SalesApp `passwordStrength.js`).
 * Returns rules + `valid` when all rules pass.
 */
export type PasswordStrengthResult = {
  level: "very_weak" | "weak" | "medium" | "strong" | "very_strong";
  label: string;
  color: string;
  rules: { rule: string; pass: boolean }[];
  valid: boolean;
};

const STRENGTH_CONFIG: Record<PasswordStrengthResult["level"], { label: string; color: string }> = {
  very_weak: { label: "Very Weak", color: "#dc3545" },
  weak: { label: "Weak", color: "#fd7e14" },
  medium: { label: "Medium", color: "#ffc107" },
  strong: { label: "Strong", color: "#28a745" },
  very_strong: { label: "Very Strong", color: "#007bff" },
};

const COMMON_PASSWORDS = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "login",
  "princess",
  "qwerty123",
  "solo",
  "passw0rd",
  "starwars",
  "iloveyou",
  "welcome1",
  "123456789",
  "1234567890",
  "password1",
  "qwertyuiop",
  "admin123",
  "asdfghjkl",
  "123123",
  "password2",
  "111111",
  "1234",
  "12345",
  "qwerty1",
];

function countCharacterTypes(str: string): number {
  let n = 0;
  if (/[A-Z]/.test(str)) n++;
  if (/[a-z]/.test(str)) n++;
  if (/\d/.test(str)) n++;
  if (/[^A-Za-z0-9\s]/.test(str)) n++;
  return n;
}

function getStrengthLevel(password: string): PasswordStrengthResult["level"] {
  const p = password || "";
  const len = p.length;
  const lower = p.toLowerCase();
  const types = countCharacterTypes(p);
  const onlyNumbers = /^\d+$/.test(p);
  const onlyLetters = /^[a-zA-Z]+$/.test(p);
  const isCommon = COMMON_PASSWORDS.includes(lower);

  if (len < 6 || onlyNumbers || onlyLetters || isCommon) return "very_weak";
  if (len <= 7 || types <= 2) return "weak";
  if (len <= 9) return "medium";
  if (len <= 11) return "strong";
  return "very_strong";
}

export function getPasswordStrength(
  password: string,
  _userContext: { email?: string } = {},
): PasswordStrengthResult {
  const p = (password || "").toString();
  const noSpaces = !/\s/.test(p);

  const minLength = p.length >= 8;
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(p);

  const rules: PasswordStrengthResult["rules"] = [
    { rule: "Min 8 characters", pass: minLength },
    { rule: "1 uppercase letter", pass: hasUpper },
    { rule: "1 lowercase letter", pass: hasLower },
    { rule: "1 number", pass: hasNumber },
    { rule: "1 special character", pass: hasSpecial },
    { rule: "No spaces in password", pass: noSpaces },
  ];

  const valid = rules.every((r) => r.pass);
  const level = getStrengthLevel(p);
  const { label, color } = STRENGTH_CONFIG[level];

  return { level, label, color, rules, valid };
}
