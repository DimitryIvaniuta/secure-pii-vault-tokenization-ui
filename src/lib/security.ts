export function maskValue(value?: string): string {
  if (!value) {
    return '—';
  }

  if (value.length <= 4) {
    return '••••';
  }

  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

export function maskEmail(value?: string): string {
  if (!value) {
    return '—';
  }

  const [local, domain] = value.split('@');
  if (!domain) {
    return maskValue(value);
  }

  const safeLocal = local.length <= 2 ? '••' : `${local.slice(0, 2)}••••`;
  return `${safeLocal}@${domain}`;
}

/**
 * Copies text only when the browser exposes a secure clipboard API.
 * The fallback keeps the utility usable in older environments without
 * persisting anything beyond the current interaction.
 */
export async function safeCopy(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textArea);
  }
}
