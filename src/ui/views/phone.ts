import type { ChatMsg, Friend } from '../../types.ts';
import { S } from '../../state.ts';
import { COMPANY_KINDS, QUICK_REPLIES, STREAK_TO_UNLOCK, TRUST_TIERS, UNLOCKS } from '../../data/script.ts';
import { ME } from '../../data/seed.ts';
import { canEndBestieship, friendOf } from '../../game/people.ts';
import { canStartCompanyWith, liveStreak, streakAtRisk, tierName, trustTier } from '../../game/social.ts';
import { fmt, short } from '../../game/format.ts';
import { proportional, FULL } from '../../game/money.ts';
import { isRiding } from '../../ride/session.ts';
import { avatar } from '../dom.ts';
import { rideBanner } from './shared.ts';

/** Friends who are typing a reply right now (set by actions while a reply is pending). */
export const typing = new Set<string>();

const SEND_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>`;

export function phoneView(): string {
  const f = friendOf(S, S.chatWith);
  return `${rideBanner()}<div class="phonecard">${f ? threadView(f) : listView()}</div>`;
}

export function streakBadge(f: Friend): string {
  const n = liveStreak(f, S.day);
  if (n === 0) return `<span class="streak off" title="No streak">🔥0</span>`;
  const risk = streakAtRisk(f, S.day);
  return `<span class="streak ${risk ? 'risk' : ''}" title="${risk ? 'Message today to keep it' : `${n}-day streak`}">🔥${n}${risk ? ' ⏳' : ''}</span>`;
}

function when(m: ChatMsg | undefined): string {
  if (!m) return '';
  const d = S.day - m.day;
  return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d`;
}

function listView(): string {
  const unreadTotal = S.friends.reduce((s, f) => s + f.unread, 0);
  const rows = [...S.friends]
    .sort((a, b) => (b.thread.at(-1)?.day ?? 0) - (a.thread.at(-1)?.day ?? 0) || b.unread - a.unread)
    .map((f) => {
      const last = [...f.thread].reverse().find((m) => m.from !== 'system');
      const prev = last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'Say hi';
      return `<button class="chatrow" data-act="openChat" data-id="${f.id}">${avatar(f.id, 56)}
        <span class="grow"><b>@${f.id}</b><span class="prev ${f.unread ? 'fresh' : ''}">${escapeHtml(prev)}</span></span>
        <span class="side"><span class="when ${f.unread ? 'new' : ''}">${when(last)}</span><span class="row" style="gap:4px">${streakBadge(f)}${f.unread ? `<span class="badge-n">${f.unread}</span>` : ''}</span></span>
      </button>`;
    }).join('');
  const atRisk = S.friends.filter((f) => streakAtRisk(f, S.day));
  return `<div class="phonehead"><h2>Messages</h2><span class="bell" aria-hidden="true">🔔<b>9+</b></span></div>
    <div class="seg"><span class="on">Chats${unreadTotal ? `<span class="count">${unreadTotal}</span>` : ''}</span><span>Groups</span></div>
    <div class="req"><span style="font-size:26px">📨</span><div><b>Message requests</b><span>9 people you haven't chatted with</span></div><span class="see">See</span></div>
    <div class="sect"><span>CHATS</span><span>Day ${S.day}</span></div>
    ${atRisk.length ? `<div class="rule">🔥 Message ${atRisk.map((f) => '@' + f.id).join(', ')} today to keep your streak${atRisk.length > 1 ? 's' : ''}.</div>` : ''}
    <div>${rows}</div>
    <button class="sleep" data-act="sleep">😴 Sleep till 8 AM tomorrow · streaks you don't feed will lapse</button>`;
}

function threadView(f: Friend): string {
  const streak = liveStreak(f, S.day);
  const tier = trustTier(f.trust);
  const next = TRUST_TIERS[tier + 1];
  const isBestie = S.bestie?.id === f.id;
  const canCompany = canStartCompanyWith(S, f.id);
  const unlocked = (key: string): [boolean, string] => {
    if (key === 'go') return [true, 'Open'];
    if (key === 'company') return [canCompany, canCompany ? 'Open' : `🔥 ${Math.min(streak, STREAK_TO_UNLOCK)}/${STREAK_TO_UNLOCK}`];
    if (key === 'cab') return [tier >= 1, tier >= 1 ? 'Open' : 'Paddy'];
    return [tier >= 2, tier >= 2 ? 'Open' : 'Ride or Die'];
  };

  let msgs = '';
  let lastDay = -1;
  for (const m of f.thread) {
    if (m.day !== lastDay) {
      msgs += `<span class="daysep">${m.day === S.day ? 'TODAY' : m.day === S.day - 1 ? 'YESTERDAY' : `DAY ${m.day}`}</span>`;
      lastDay = m.day;
    }
    msgs += `<div class="msg ${m.from === 'me' ? 'me' : m.from === 'system' ? 'sys' : ''}">${escapeHtml(m.text)}</div>`;
  }
  if (typing.has(f.id)) msgs += `<span class="typing">@${f.id} is typing…</span>`;

  return `<div class="phonehead"><button class="back" data-act="closeChat" aria-label="Back to chats">‹</button>
      <div class="who grow">${avatar(f.id, 44)}<div style="min-width:0"><b>@${f.id}</b><span>${isBestie ? '💚 Bestie · ' : ''}${f.mood} · in ${placeShort(f)}</span></div></div>${streakBadge(f)}</div>
    <div class="together">
      <div class="trustrow">
        <div class="between"><span class="tier">Trust · ${tierName(f.trust)}</span><b class="num">${f.trust}/100</b></div>
        <div class="bar"><i style="width:${f.trust}%;background:var(--green)"></i></div>
        <span class="tiny muted">${next ? `${next.min - f.trust} more to ${next.name}. Chat daily, go places and do things together.` : 'Max trust. You two are solid.'}</span>
      </div>
      <div class="unlocks">${UNLOCKS.map((u) => {
        const [ok, note] = unlocked(u.key);
        return `<div class="unlock ${ok ? '' : 'locked'}" title="${u.text}"><span class="ic">${ok ? '✓' : '🔒'}</span><span>${u.title}</span><small>${note}</small></div>`;
      }).join('')}</div>
      <div class="grid2">
        <button class="btn sm btn-dark" data-act="linkUp" data-id="${f.id}" ${isRiding() ? 'disabled' : ''}>🚗 Link up</button>
        <button class="btn sm btn-green" data-act="startupOpen" data-id="${f.id}" ${canCompany ? '' : 'disabled'}>🏢 Start a company</button>
      </div>
      ${canCompany ? '' : `<span class="tiny muted">${streakHint(f)}</span>`}
    </div>
    <div class="msgs">${msgs}</div>
    ${startupFor === f.id || (S.startup.pending && S.chatWith === f.id) ? startupForm(f) : ''}
    <div class="qr">${QUICK_REPLIES.map((q) => `<button data-act="quick" data-text="${q}">${q}</button>`).join('')}</div>
    <form class="composer" data-act="none" id="composer"><input id="chatInput" type="text" autocomplete="off" placeholder="Message @${f.id}" aria-label="Message"><button class="send" type="submit" aria-label="Send">${SEND_ICON}</button></form>
    ${isBestie ? endBestie() : ''}`;
}

function streakHint(f: Friend): string {
  const streak = liveStreak(f, S.day);
  const left = STREAK_TO_UNLOCK - streak;
  if (streak === 0) return `Chat ${STREAK_TO_UNLOCK} days in a row to unlock a company together.`;
  if (f.lastChatDay === S.day) return `Come back tomorrow: ${left} more day${left > 1 ? 's' : ''} to unlock a company together.`;
  return `Message today: ${left} more day${left > 1 ? 's' : ''} to unlock a company together.`;
}

/** Which thread has the company form open. */
export let startupFor: string | null = null;
export function setStartupFor(id: string | null): void {
  startupFor = id;
}

function startupForm(f: Friend): string {
  const d = S.startup;
  const bps = proportional(FULL, [{ id: ME, weight: d.mine }, { id: f.id, weight: d.theirs }]);
  const maxMine = Math.min(50_000_000, Math.floor(S.me.cash / 500_000) * 500_000);
  const maxTheirs = Math.min(30_000_000, Math.floor(f.cash / 500_000) * 500_000);
  if (d.pending) {
    return `<div class="startup"><div class="row"><span class="spin"></span><span class="tiny">Waiting for @${f.id} to agree to ${escapeHtml(d.name)}…</span></div></div>`;
  }
  return `<div class="startup">
    <div class="between"><b>Start a company with @${f.id}</b><button class="back" style="font-size:20px;color:var(--muted)" data-act="startupClose" aria-label="Close">×</button></div>
    <label class="tiny muted" for="coName">Name</label>
    <input type="text" id="coName" value="${escapeHtml(d.name)}" maxlength="32">
    <div class="kinds">${COMPANY_KINDS.map((k) => `<button class="${k.kind === d.kind ? 'on' : ''}" data-act="startupKind" data-kind="${k.kind}">${k.emoji} ${k.kind}</button>`).join('')}</div>
    <div class="slider"><div class="between"><label for="coMine">You put in</label><b id="coMineLbl">${fmt(d.mine)}</b></div>
      <input type="range" id="coMine" min="500000" max="${maxMine}" step="500000" value="${d.mine}"></div>
    <div class="slider"><div class="between"><label for="coTheirs">@${f.id} puts in</label><b id="coTheirsLbl">${fmt(d.theirs)}</b></div>
      <input type="range" id="coTheirs" min="500000" max="${maxTheirs}" step="500000" value="${d.theirs}"></div>
    <div class="own" id="coOwnBar"><i style="flex-basis:${bps[ME] / 100}%;background:${S.me.color}"></i><i style="flex-basis:${bps[f.id] / 100}%;background:${f.color}"></i></div>
    <div class="between tiny"><span>You own <b id="coMinePct">${(bps[ME] / 100).toFixed(1)}%</b></span><span>@${f.id} owns <b id="coTheirsPct">${(bps[f.id] / 100).toFixed(1)}%</b></span></div>
    <button class="btn btn-green" data-act="startupSend">Propose · ${short(d.mine + d.theirs)} to start</button>
  </div>`;
}

function endBestie(): string {
  const can = canEndBestieship(S, isRiding());
  return `<div class="between" style="border-top:1px solid var(--line);padding-top:12px">
    <span class="tiny muted">${can ? 'End bestie-ship. Your streak and trust stay.' : 'You share a company, so the bestie-ship stays.'}</span>
    ${S.confirmEnd
      ? `<div class="row"><button class="btn sm btn-ghost" data-act="endNo">Keep</button><button class="btn sm btn-line" data-act="endYes">End it</button></div>`
      : `<button class="btn sm btn-line" data-act="endAsk" ${can ? '' : 'disabled'}>End</button>`}
  </div>`;
}

function placeShort(f: Friend): string {
  return { home: 'Lekki', ifitness: 'i-Fitness', balogun: 'Balogun', quilox: 'Quilox', yabahub: 'Yaba', suya: 'Surulere', landmark: 'Landmark Beach', banana: 'Banana Island' }[f.pos];
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
}
