/**
 * Shared scroll target math for the fullscreen chat lyric feed.
 */

export function getTargetTopInContainer(container: HTMLElement, element: HTMLElement): number {
  let top = 0;
  let el: HTMLElement | null = element;
  while (el && el !== container) {
    top += el.offsetTop;
    el = el.parentElement;
  }
  return top;
}

export function getMaxScrollTop(container: HTMLElement): number {
  return Math.max(0, container.scrollHeight - container.clientHeight);
}

/** Chat-feed anchor — active message bottom near lower viewport (default 80%). */
export function computeChatScrollTarget(
  container: HTMLElement,
  target: HTMLElement,
  anchorRatio = 0.8,
): number {
  const containerHeight = container.clientHeight;
  const targetTop = getTargetTopInContainer(container, target);
  const targetHeight = target.offsetHeight;
  const desired = targetTop + targetHeight - containerHeight * anchorRatio;
  return Math.max(0, Math.min(desired, getMaxScrollTop(container)));
}
