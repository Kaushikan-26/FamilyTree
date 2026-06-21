import { useState } from "react";

/**
 * A form section hidden behind a hamburger toggle. Used to tuck "Additional
 * info" (death date, bio) away in the member forms so they only appear when the
 * user taps to open them.
 */
export default function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible">
      <button
        type="button"
        className="collapsible__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="collapsible__icon">☰</span>
        <span>{title}</span>
        <span className="collapsible__chev">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="collapsible__body">{children}</div>}
    </div>
  );
}
