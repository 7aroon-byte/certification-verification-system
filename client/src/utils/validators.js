export const EMAIL_MAX = 100;
export const NAME_MAX = 80;
export const ENROLL_MAX = 30;

export function validateEmail(email) {
  if (!email) return 'Email is required';
  if (String(email).length < 3) return 'Email too short';
  if (String(email).length > EMAIL_MAX) return 'Email too long';
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
}

export function validateName(name) {
  if (!name) return 'Name is required';
  const trimmed = String(name).trim();
  if (trimmed.length < 3) return 'Name too short';
  if (trimmed.length > NAME_MAX) return 'Name too long';
  const nameRegex = /^[A-Za-z][A-Za-z\s'\-]{1,79}$/;
  if (!nameRegex.test(trimmed)) return 'Invalid name (letters, spaces, "\'" and - allowed)';
  return null;
}

export function validateEnrollmentNumber(enrollment) {
  if (!enrollment) return 'Enrollment number required';
  const s = String(enrollment).trim();
  if (s.length < 3) return 'Enrollment number too short';
  if (s.length > ENROLL_MAX) return 'Enrollment number too long';
  const enRegex = /^[A-Za-z0-9\-]+$/;
  if (!enRegex.test(s)) return 'Invalid enrollment number (alphanumeric and - allowed)';
  return null;
}
