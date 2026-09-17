/**
 * Utility functions for common tool operations
 */

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Parse a list of items from text (handles newlines, commas, etc.)
 */
export function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Format a list of items as a string
 */
export function formatList(items: string[]): string {
  return items.join('\n');
}

/**
 * Generate a shareable URL (client-side for now)
 */
export function generateShareUrl(toolPath: string, resultId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/result/${resultId}?tool=${encodeURIComponent(toolPath)}`;
}

/**
 * Create a result ID (simple base64 encoding of data)
 */
export function createResultId(data: any): string {
  const json = JSON.stringify(data);
  return btoa(json).substring(0, 12);
}

/**
 * Parse result ID back to data
 */
export function parseResultId(id: string): any {
  try {
    return JSON.parse(atob(id));
  } catch {
    return null;
  }
}

/**
 * Check if text is empty
 */
export function isEmpty(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Validate list input (not empty, has items)
 */
export function validateList(text: string): { valid: boolean; items: string[]; error?: string } {
  if (isEmpty(text)) {
    return { valid: false, items: [], error: 'Please enter at least one item' };
  }
  
  const items = parseList(text);
  if (items.length === 0) {
    return { valid: false, items: [], error: 'Please enter at least one item' };
  }
  
  return { valid: true, items };
}

/**
 * Validate number input
 */
export function validateNumber(value: string, min?: number, max?: number): { valid: boolean; value?: number; error?: string } {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `Number must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `Number must be at most ${max}` };
  }
  
  return { valid: true, value: num };
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get scroll position
 */
export function getScrollPosition(): number {
  return window.scrollY;
}

/**
 * Scroll to element
 */
export function scrollToElement(element: HTMLElement, offset = 80): void {
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Request animation frame wrapper
 */
export function requestFrame(callback: FrameRequestCallback): number {
  return requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 */
export function cancelFrame(id: number): void {
  cancelAnimationFrame(id);
}
