import { useCallback, useEffect, useRef, useState, type PointerEventHandler, type RefObject } from "react";
import { clearTextSelection, copyToClipboard } from "../utils/clipboard";

const FEEDBACK_MS = 1200;
const HIGHLIGHT_NAME = "copy-feedback";

type CopyFeedback = { clear: () => void };

function selectionWithin(container: HTMLElement, selection: Selection | null): boolean {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  return container.contains(range.commonAncestorContainer);
}

/** Selection must touch at least one data-copy-block inside the region. */
function selectionTouchesCopyBlock(container: HTMLElement, selection: Selection): boolean {
  const range = selection.getRangeAt(0);
  const blocks = container.querySelectorAll<HTMLElement>("[data-copy-block]");
  for (const block of blocks) {
    try {
      if (selection.containsNode(block, true)) return true;
    } catch {
      const blockRange = document.createRange();
      blockRange.selectNodeContents(block);
      if (
        range.compareBoundaryPoints(Range.END_TO_START, blockRange) < 0 &&
        range.compareBoundaryPoints(Range.START_TO_END, blockRange) > 0
      ) {
        return true;
      }
    }
  }
  return false;
}

function showRangeFeedback(range: Range): CopyFeedback {
  if (typeof CSS !== "undefined" && "highlights" in CSS && CSS.highlights) {
    CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(range));
    return { clear: () => CSS.highlights.delete(HIGHLIGHT_NAME) };
  }

  const layer = document.createElement("div");
  layer.className = "selectable-copy-range-feedback";
  layer.setAttribute("aria-hidden", "true");
  for (const rect of range.getClientRects()) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    const mark = document.createElement("span");
    mark.className = "selectable-copy-range-feedback__rect";
    mark.style.left = `${rect.left}px`;
    mark.style.top = `${rect.top}px`;
    mark.style.width = `${rect.width}px`;
    mark.style.height = `${rect.height}px`;
    layer.appendChild(mark);
  }
  document.body.appendChild(layer);
  return { clear: () => layer.remove() };
}

export interface UseClickToCopyResult<T extends HTMLElement> {
  ref: RefObject<T>;
  copied: boolean;
  onPointerDown: PointerEventHandler<T>;
  onPointerUp: PointerEventHandler<T>;
  onPointerCancel: PointerEventHandler<T>;
}

export interface UseClickToCopyOptions {
  /** When false, leaves pointer events on children so click handlers (e.g. lyric seek) still fire. */
  enablePointerCapture?: boolean;
}

/** Copy highlighted text on pointer release only (click-drag-select, then let go). */
export function useClickToCopy<T extends HTMLElement = HTMLElement>(
  options: UseClickToCopyOptions = {},
): UseClickToCopyResult<T> {
  const enablePointerCapture = options.enablePointerCapture ?? true;
  const ref = useRef(null) as RefObject<T>;
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const clearHighlightRef = useRef<(() => void) | null>(null);
  const [copied, setCopied] = useState(false);

  const clearFeedback = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    clearHighlightRef.current?.();
    clearHighlightRef.current = null;
  }, []);

  useEffect(() => () => clearFeedback(), [clearFeedback]);

  const onPointerDown = useCallback<PointerEventHandler<T>>(
    (e) => {
      if (e.button !== 0) return;
      clearFeedback();
      setCopied(false);
      if (enablePointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [clearFeedback, enablePointerCapture],
  );

  const onPointerCancel = useCallback<PointerEventHandler<T>>((e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const tryCopySelection = useCallback(async () => {
    const container = ref.current;
    if (!container) return false;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selectionWithin(container, selection)) {
      return false;
    }
    if (!selectionTouchesCopyBlock(container, selection)) return false;

    const text = selection.toString().trim();
    if (!text) return false;

    const range = selection.getRangeAt(0).cloneRange();
    const ok = await copyToClipboard(text);
    if (!ok) return false;

    clearFeedback();
    const feedback = showRangeFeedback(range);
    clearHighlightRef.current = feedback.clear;
    clearTextSelection();
    setCopied(true);
    feedbackTimerRef.current = setTimeout(() => {
      feedback.clear();
      clearHighlightRef.current = null;
      setCopied(false);
    }, FEEDBACK_MS);
    return true;
  }, [clearFeedback]);

  const onPointerUp = useCallback<PointerEventHandler<T>>(
    async (e) => {
      if (e.button !== 0) return;

      if (enablePointerCapture) {
        const container = ref.current;
        if (!container || !container.contains(e.target as Node)) return;
        await tryCopySelection();
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }
    },
    [enablePointerCapture, tryCopySelection],
  );

  useEffect(() => {
    if (enablePointerCapture) return;

    const onDocumentPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      void tryCopySelection();
    };

    document.addEventListener("pointerup", onDocumentPointerUp);
    return () => document.removeEventListener("pointerup", onDocumentPointerUp);
  }, [enablePointerCapture, tryCopySelection]);

  return {
    ref,
    copied,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
  };
}
