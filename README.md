# Lagos Life Besties

A working prototype of a **Besties** feature for [Lagos Life](https://lagoslife.app), the Nigerian life-sim.

Lagos Life already has friends, chats, companies and rides across the city. Besties ties them together: two players who **own businesses together**, **split the till**, and **ride through Lagos in the same car**.

> Independent concept by Fayosi, a frontend and UX developer. Not affiliated with the Lagos Life team.

## Try it

1. **Bestie tab:** ask @ochibu to be your bestie. It needs 80 friendship, so the other friends are locked.
2. **Company tab:** sell them a stake in Nollyflix, then cash out. The till splits by ownership, to the naira.
3. **Propose a new branch** and watch the vote. Spends of ₦1m or more need both owners.
4. **Map tab:** ride to Yaba together. Pick a vehicle (Trek, Keke, Danfo, Okada, Cab, Driver or your bestie's car), switch cameras, change the station, gist, and buy gala from a hawker in the Third Mainland go-slow.

## Run it

Needs Node 22.6 or newer.

```bash
npm install
npm run dev        # local dev server
npm test           # game-rule tests (Node's built-in test runner)
npm run build      # type-check and build to dist/
```

Every push to `main` runs the tests, builds, and deploys to GitHub Pages (see `.github/workflows/deploy.yml`). To turn that on, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

## How it's built

Vite and TypeScript, with no UI framework. The game rules are plain functions that take the state as an argument, so they're tested without a browser.

```
src/
  types.ts            Shared types: players, companies, proposals, rides
  state.ts            The single game state for the tab
  actions.ts          Player intents: apply a rule, then re-render
  main.ts             Event wiring
  data/               Places, transport prices, seed world, dialogue
  game/               Pure game rules + tests
    money.ts            Largest-remainder profit split in basis points
    company.ts          Stake sales, cash out, proposals and voting
    travel.ts           Trip times, fares per seat vs per car
    needs.ts            Activity effects, the 1.5× together bonus
    bond.ts             Bond XP and levels
    people.ts           Bestie rules
  ride/
    session.ts          One shared ride: progress, go-slow, radio, gist, hawker
    renderer.ts         Pseudo-3D night drive on canvas, three cameras
  ui/
    render.ts           Renders the current tab
    views/              Bestie, Company, Map, Under the hood
```

## Rules the code enforces

- **Ownership is in basis points.** Owners of a company always sum to 10,000.
- **Profit splits never lose a naira.** The largest-remainder method makes shares add up to the exact till.
- **Stake sales are atomic.** The buyer's naira and the seller's basis points move together or not at all.
- **The seller keeps control.** One sale is capped at 49%.
- **Quorum by size.** Spends of ₦1m or more need every owner. Smaller spends pass on the majority stake.
- **Seats are real.** An okada carries one passenger, so besties get two bikes. Cars and keke seat you together.
- **Fares follow the vehicle.** Keke, danfo and okada charge per seat. A cab charges per car and is split from Bond Lv 2.
- **No orphaned companies.** You can't end a bestie-ship while you still share a company or a ride.

## Taking it to production

The "Under hood" tab in the app covers this in more detail. In short:

- **Server-authoritative.** Clients send intents (`sell_stake`, `vote`, `start_ride`). The server validates them with the same rules as `src/game` and broadcasts the result.
- **One ride, two phones.** A ride is one shared object with a `startedAt` time. Both clients compute progress from the server clock, so the two cars stay in sync. Radio, gist and hawker purchases are small events on the ride channel.
- **Anti-alt farming.** Bestie status needs 80 friendship built over 3+ in-game days, and stake transfers have a 24-hour cooldown, so players can't move money between their own accounts.
- **What to measure.** D7 and D30 retention for players with a bestie, shared rides per active pair, share of companies with 2+ owners.
