import { S } from '../state.ts';
import { person } from '../game/people.ts';

export function $<T extends HTMLElement = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

/** Round avatar with initials, in the player's colour. */
export function avatar(id: string, size = 40): string {
  const p = person(S, id);
  return `<span class="av" style="--c:${p.color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.34)}px">${p.initials}</span>`;
}

export function toast(message: string, kind: '' | 'good' | 'bad' = ''): void {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
