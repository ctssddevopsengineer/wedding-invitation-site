'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import styles from './CinematicIntro.module.css';

export default function IntroDropdown({ label, ariaLabel = label, value, options, onChange, busy = false, ...attributes }) {
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ above: false, height: 240 });

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const box = trigger.current.getBoundingClientRect();
      const above = box.top - 12;
      const below = window.innerHeight - box.bottom - 12;
      const useAbove = below < 240 && above > below;
      setPlacement({ above: useAbove, height: Math.max(44, Math.min(240, useAbove ? above : below)) });
    }
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    position();
    menu.current?.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true });
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function keys(event) {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab' && open) {
      // Restore the trigger before the intro's focus trap advances to the next field.
      close();
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (!open) { setOpen(true); return; }
      const items = [...menu.current.querySelectorAll('[role="option"]')];
      const current = items.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 :
        (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
  }

  return (
    <div className={styles.preferenceField} ref={root} onKeyDown={keys}>
      <span id={`${id}-label`}>{label}</span>
      <div className={styles.dropdownAnchor}>
        <button {...attributes} ref={trigger} className={styles.preferenceTrigger} type="button"
          data-intro-control aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open}
          aria-controls={open ? id : undefined} aria-busy={busy} disabled={busy}
          onClick={() => setOpen(!open)}>
          <span>{options.find((option) => option.value === value)?.label}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        {open && (
          <div ref={menu} id={id} role="listbox" aria-labelledby={`${id}-label`}
            className={styles.preferenceMenu} data-above={placement.above}
            style={{ maxHeight: placement.height }}>
            {options.map((option) => (
              <button key={option.value} type="button" role="option" tabIndex={-1}
                aria-selected={option.value === value} className={styles.preferenceOption}
                onClick={() => { close(); onChange?.(option.value); }}>
                <span aria-hidden="true">{option.value === value ? '✓' : ''}</span>{option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
