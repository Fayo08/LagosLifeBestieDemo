# Lagos Life Besties

A working prototype of a **Besties** feature for [Lagos Life](https://lagoslife.app), the Nigerian life-sim.

It starts in your messages. Chat with a friend **three days running** and the streak unlocks a **company you start together**. Going places together is open from day one: pick a ride, pick up your friend, and land together at named spots like i-Fitness, Quilox and Balogun Market. Every chat, ride and activity together builds **trust**, which opens more perks.

> Independent concept by Favour Oyende, a Full-stack developer. Not affiliated with the Lagos Life team.

## Try it

1. **Phone tab:** open @tolu. You're already on a 3-day streak, so @tolu is your bestie and a company together is unlocked. @2sugar is on 2 days: message them to watch a streak hit 3.
2. **Start a company together:** you each put money in and own it by what you put in, to the basis point.
3. **Link up** and ride to Quilox. Pick a vehicle, switch cameras, change the station and gist on the way.
4. **Land together.** The Home tab shows the venue with both of you in the room. Every activity together builds trust; Paddy trust splits cabs.
5. **Day and night** follow the in-game clock. Use the time buttons beside the phone to jump between them.

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
    social.ts           Chat streaks by in-game day, trust tiers, the clock
    money.ts            Largest-remainder splits for profits and ownership
    company.ts          Starting a company together, stake sales, voting
    travel.ts           Trip times, fares per seat vs per car
    needs.ts            Activity effects, the 1.5× together bonus
    people.ts           Players and bestie rules
  ride/
    session.ts          One shared ride: progress, go-slow, radio, gist, hawker
    renderer.ts         Pseudo-3D night drive on canvas, three cameras
  ui/
    render.ts           Renders the current tab, day or night
    scene.ts            Isometric venue scene with everyone's name tags
    views/              Home (venue), Map, Phone (messages), Company
```

## Rules the code enforces

- **Streaks count in-game days.** Message a friend on consecutive days to grow it; skip a whole day and it resets.
- **A 3-day streak unlocks a company together** with that friend. The first friend you reach it with becomes your bestie.
- **Going places together needs no streak.** Any friend can come along. Friends with very low trust may say "not tonight".
- **Trust is earned, not bought.** Daily chats, rides and activities together raise it. Paddy (30) splits cabs; Ride or Die (60) gets a spare house key.
- **Ownership follows money in.** A company started together is split by each person's contribution.
- **Ownership is in basis points.** Owners of a company always sum to 10,000.
- **Profit splits never lose a naira.** The largest-remainder method makes shares add up to the exact till.
- **Stake sales are atomic.** The buyer's naira and the seller's basis points move together or not at all.
- **The seller keeps control.** One sale is capped at 49%.
- **Quorum by size.** Spends of ₦1m or more need every owner. Smaller spends pass on the majority stake.
- **Seats are real.** An okada carries one passenger, so besties get two bikes. Cars and keke seat you together.
- **Fares follow the vehicle.** Keke, danfo and okada charge per seat. A cab charges per car and is split from Paddy trust.
- **No orphaned companies.** You can't end a bestie-ship while you still share a company or a ride.

## Taking it to production

- **Server-authoritative.** Clients send intents (`sell_stake`, `vote`, `start_ride`). The server validates them with the same rules as `src/game` and broadcasts the result.
- **One ride, two phones.** A ride is one shared object with a `startedAt` time. Both clients compute progress from the server clock, so the two cars stay in sync. Radio, gist and hawker purchases are small events on the ride channel.
- **Anti-alt farming.** Streaks count days, so a company together takes 3+ days of chatting, and stake transfers have a 24-hour cooldown, so players can't move money between their own accounts.
- **What to measure.** How many chats reach a 3-day streak and how many of those start a company, D7 and D30 retention for players with a bestie, shared rides per active pair.
