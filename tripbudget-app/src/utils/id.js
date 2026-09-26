/**
 * Simple unique ID generator (no external dependency).
 */
let counter = 0;
export function generateId() {
  counter++;
  return `${Date.now()}-${counter}-${Math.random().toString(36).substring(2, 9)}`;
}
