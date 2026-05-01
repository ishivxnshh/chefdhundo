export function generateToken() {
  return Math.random().toString(36).substring(2, 12);
}