/**
 * Basic security utilities for the EstimaPro frontend.
 */

/**
 * Escapes HTML characters from a string to prevent basic XSS when 
 * content is used outside of React's auto-escaping.
 * Also sanitizes suspicious Excel triggers (like =,+,-,@) for CSV/Excel security (B-013).
 */
export const sanitizeInput = (text: string): string => {
  if (!text) return '';
  
  // 1. Basic HTML escaping (redundant for React JSX but good for other contexts like exports)
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. CSV Injection Prevention (B-013: Excel Formulas)
  // If the cell starts with =, +, -, @, we add a single quote before it
  if (escaped.match(/^[=\+\-@]/)) {
    return `'${escaped}`;
  }

  return escaped;
};
