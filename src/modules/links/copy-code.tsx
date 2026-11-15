/**
 * Copies a promo code. No React on the client: one small inline script (below, once per page) listens for clicks on
 * `[data-copy]` buttons, so the page hydrates nothing. Without JavaScript the code is still readable text.
 */
export default function CopyCode({ code, labels, className }: { code: string; labels: { copy: string; copied: string }; className?: string }) {
  return (
    <button type="button" data-copy={code} data-copied={labels.copied} aria-live="polite" className={className} data-testid="links-copy-code">
      <span className="font-mono tracking-wide">{code}</span>
      <span className="text-xs opacity-70">{labels.copy}</span>
    </button>
  )
}

const SCRIPT = `document.addEventListener("click",function(e){var b=e.target.closest("[data-copy]");if(!b||!navigator.clipboard)return;var s=b.lastElementChild,t=s.textContent;navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){s.textContent=b.getAttribute("data-copied");setTimeout(function(){s.textContent=t},2500)}).catch(function(){})})`

/** Render once on a page that has at least one CopyCode */
export function CopyCodeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
}
