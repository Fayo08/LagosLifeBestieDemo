import { rideBanner } from './shared.ts';

/** The "Under hood" tab: how this would run for real, for the engineering conversation. */
export function codeView(): string {
  return `${rideBanner()}
  <div class="card"><div class="eyebrow">Under the hood</div><h2>How Besties works</h2>
    <p class="muted tiny" style="margin:0">Server-authoritative. Clients send intents; the server validates, applies and broadcasts. This prototype runs the same rules locally, from <code>src/game</code>.</p></div>
  <div class="card"><h3>The flow</h3><ol class="rules">
    <li><b>Messages first.</b> Chatting is the core loop. Each in-game day you message a friend grows your streak with them.</li>
    <li><b>Go anywhere together, from day one.</b> Any friend can come on any trip. Riding and doing things together builds trust.</li>
    <li><b>A 3-day streak unlocks a company together.</b> The first friend you reach it with becomes your bestie.</li>
    <li><b>Trust opens perks.</b> Paddy (30) splits cabs. Ride or Die (60) gets a spare house key.</li>
  </ol></div>
  <div class="card"><h3>Data model</h3><pre><span class="k">type</span> Friendship = {
  a: UserId; b: UserId
  streak: <span class="k">number</span>          <span class="c">// consecutive game days chatted</span>
  lastChatDay: GameDay
  trust: <span class="k">number</span>           <span class="c">// 0–100, earned not bought</span>
  bestie: <span class="k">boolean</span>
}
<span class="k">type</span> Ownership = { userId: UserId; bps: <span class="k">number</span> }
<span class="c">// basis points; owners always sum to 10_000</span>

<span class="k">type</span> Proposal = {
  companyId: Id
  kind: <span class="s">'open_branch'</span> | <span class="s">'hire'</span> | <span class="s">'sell_stake'</span>
  cost: Naira
  quorum: <span class="s">'majority'</span> | <span class="s">'unanimous'</span>
  votes: Record&lt;UserId, <span class="s">'yes'</span>|<span class="s">'no'</span>|<span class="k">null</span>&gt;
}
<span class="k">type</span> Ride = {
  id: Id; vehicle: <span class="s">'keke'</span>|<span class="s">'danfo'</span>|<span class="s">'okada'</span>|<span class="s">'cab'</span>|<span class="s">'driver'</span>|<span class="s">'friend_car'</span>
  seats: { userId: UserId; seat: <span class="s">'driver'</span>|<span class="s">'front'</span>|<span class="s">'back_l'</span>|<span class="s">'back_r'</span> }[]
  route: { from: PlaceId; to: PlaceId; via: RoadId }
  startedAt: ServerTime; durationMs: <span class="k">number</span>
  events: RideEvent[]  <span class="c">// radio, gist, hawker, go-slow</span>
}</pre></div>
  <div class="card"><h3>One ride, two phones</h3><pre><span class="c">// Both clients derive progress from the same</span>
<span class="c">// server clock, so the cars stay in sync</span>
<span class="k">const</span> progress = clamp01(
  (serverNow() - ride.startedAt) / ride.durationMs
)
<span class="c">// Radio and gist are small events on the ride</span>
<span class="c">// channel; each client renders them locally.</span>
socket.on(<span class="s">'ride:event'</span>, e =&gt; applyRideEvent(ride, e))</pre></div>
  <div class="card"><h3>Splitting the till</h3><pre><span class="c">// src/game/money.ts · largest remainder,</span>
<span class="c">// so every naira lands somewhere</span>
<span class="k">export function</span> split(amount, owners) {
  <span class="k">const</span> rows = owners.map(o =&gt; {
    <span class="k">const</span> exact = amount * o.bps / 10_000
    <span class="k">return</span> { id: o.id, exact, share: Math.floor(exact) }
  })
  <span class="k">let</span> rem = amount - sum(rows.map(r =&gt; r.share))
  rows.sort(byFraction).forEach(r =&gt; {
    <span class="k">if</span> (rem-- &gt; 0) r.share++
  })
  <span class="k">return</span> rows
}</pre></div>
  <div class="card"><h3>Streaks</h3><pre><span class="c">// src/game/social.ts</span>
<span class="k">function</span> sendChat(S, friendId, text) {
  <span class="k">if</span> (f.lastChatDay !== S.day) {     <span class="c">// first today</span>
    f.streak = f.lastChatDay === S.day - 1
      ? f.streak + 1 : 1
    f.lastChatDay = S.day
    addTrust(S, f.id, TRUST.dailyChat)
  }
}
<span class="c">// Lapses if you skip a whole day</span>
<span class="k">const</span> liveStreak = (f, day) =&gt;
  f.lastChatDay &gt;= day - 1 ? f.streak : 0</pre></div>
  <div class="card"><h3>Rules</h3><ol class="rules">
    <li><b>Ownership follows money in.</b> A company started together is split by each person's contribution, in basis points that always sum to 10,000.</li>
    <li><b>Trust can't be bought.</b> It only comes from daily chats (+6), rides together (+8), activities together (+5) and decisions you make together.</li>
    <li><b>Stake sales are atomic.</b> Buyer's naira and seller's basis points move in one transaction or not at all.</li>
    <li><b>Seller keeps control.</b> A single sale is capped at 49%, so the founder keeps the majority.</li>
    <li><b>Quorum by size.</b> Spends of ₦1m+ need every owner; smaller ones pass on the majority stake.</li>
    <li><b>Seats are real.</b> Okada carries one passenger, so besties get two bikes. Cars and keke seat you together.</li>
    <li><b>Fares follow the vehicle.</b> Keke, danfo and okada charge per seat. Cabs charge per car and split at Paddy trust.</li>
    <li><b>No orphaned companies.</b> You can't end a bestie-ship while you still share a company or a ride.</li>
    <li><b>Anti-alt farming.</b> Streaks count in-game days, so a company together takes 3+ real days of chatting. Stake transfers also have a 24h cooldown, so players can't wash money between their own accounts.</li>
  </ol></div>
  <div class="card"><h3>What I'd measure</h3><ol class="rules">
    <li>D7 and D30 retention for players with a bestie vs. without.</li>
    <li>How many chats reach a 3-day streak, and how many of those start a company.</li>
    <li>Shared rides per daily active pair, and share of companies with 2+ owners.</li>
    <li>Chat messages sent before and after a bestie forms.</li>
  </ol></div>`;
}
