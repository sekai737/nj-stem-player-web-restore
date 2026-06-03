/** Clear the active document text selection (e.g. after a successful copy). */
export function clearTextSelection(): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  selection.removeAllRanges();
}

/** Copy plain text to the system clipboard (Clipboard API with fallback). */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}
