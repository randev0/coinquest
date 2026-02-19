# CoinQuest MMORPG UI Style Guide

Inspired by classic MMORPG UIs (Ragnarok Online aesthetic). All original design — no copyrighted assets.

---

## Design Philosophy

> "The UI is the HUD. Data is the quest. Spend is the boss."

- Dark desaturated "town at night" background
- Warm parchment panels with bevel illusions
- Pixel font for headings + labels; readable body font for data
- Everything has a game-world analogy:
  - Balance = Gold
  - Spending = HP drain
  - Income = MP
  - Budget = HP bar
  - Insights = Quest Log
  - Transactions = Inventory
  - Rules = Passive skills

---

## Color Tokens

```typescript
// tailwind.config.ts → theme.extend.colors.mmorpg
{
  bg: "#080c14",           // Main background (dark town)
  bgSecondary: "#0e1525",  // Secondary bg
  panel: "#111827",        // Window panels
  panelLight: "#1a2235",   // Highlighted panels
  border: "#2a3650",       // Borders
  bevelLight: "#3d4f6b",   // Bevel highlight (top/left)
  bevelDark: "#050810",    // Bevel shadow (bottom/right)
  parchment: "#c8b990",    // Primary text (warm white)
  parchmentDark: "#a89870",
  steel: "#7a8ba8",        // Secondary text (muted)
  steelLight: "#9aaac4",
  gold: "#d4a017",         // Accent / primary action
  goldLight: "#f0c040",
  goldDark: "#a07010",
  accentBlue: "#3a7bd5",   // Links / XP bar
  success: "#3a8a5a",      // Credits / positive
  successLight: "#4aaa6a",
  warning: "#c8a020",      // Budget warnings
  danger: "#a83030",       // Spend / HP bar
  dangerLight: "#c84040",
  purple: "#6a3aad",       // Rare / epic items
  teal: "#1a8a8a",         // Subscriptions
}
```

---

## CSS Classes

### Window
```css
.game-window           /* Main panel container */
.game-window-title     /* Title bar gradient */
```

### Buttons
```css
.btn-game              /* Standard raised button */
.btn-gold              /* Gold primary CTA */
```

### Progress Bars
```css
.hp-bar + .hp-bar-fill    /* Red HP bar (spending) */
.mp-bar + .mp-bar-fill    /* Blue MP bar (savings/income) */
```

### Typography
```css
.font-pixel            /* Press Start 2P — titles, labels, HUD */
.font-body             /* Inter — readable body text */
.text-gold             /* Gold text with glow */
```

### Table
```css
.inventory-row         /* Transaction row with hover */
.inventory-row.selected /* Selected row highlight */
.rarity-common         /* Grey */
.rarity-uncommon       /* Green */
.rarity-rare           /* Blue */
.rarity-epic           /* Purple */
.rarity-legendary      /* Gold */
```

### Quest Log
```css
.quest-entry           /* Quest row base */
.quest-new             /* Blue left border */
.quest-inprogress      /* Yellow left border */
.quest-done            /* Green left border, dimmed */
```

### Navigation
```css
.game-tab              /* Nav tab base */
.game-tab.active       /* Gold underline */
```

---

## Components

### `<GameWindow>`
The core window component. Wraps all major content areas.

```tsx
<GameWindow
  title="Inventory"        // Required: shown in title bar
  icon="📜"               // Optional: emoji icon
  badge={42}              // Optional: count badge
  collapsible             // Optional: minimize button
  defaultCollapsed        // Optional: start collapsed
  action={<Button />}     // Optional: right-side action
>
  {/* content */}
</GameWindow>
```

### `<GoldCounter>`
Animated counter for monetary values.

```tsx
<GoldCounter amount={1234.56} label="Total Spend" size="lg" />
```

### `<ResourceBar>`
HP/MP style progress bar.

```tsx
<ResourceBar value={750} max={1000} type="hp" label="Budget Used" />
```

### `<QuestLog>`
List of actionable suggestions styled as game quests.

```tsx
<QuestLog
  quests={[{
    id: "q1",
    title: "Reduce Subscriptions",
    description: "Subscriptions cost RM 85/month...",
    reward: "Save RM 30/month",
    status: "new", // "new" | "inprogress" | "done"
  }]}
  onStatusChange={(id, status) => {}}
/>
```

### `<InventoryTable>`
Transaction list with sort + rarity coloring.

```tsx
<InventoryTable
  items={[{
    id, date, description, merchant,
    amount, direction, category,
    isSubscription, isDuplicate
  }]}
  onRowClick={(item) => openDetail(item)}
/>
```

### `<Hotbar>`
Fixed bottom action bar.

```tsx
<Hotbar items={[
  { label: "Import", icon: "📥", href: "/import", variant: "gold" },
  { label: "Dashboard", icon: "⚔", href: "/dashboard" },
]} />
```

### `<HudBar>`
Top status bar with navigation and HUD stats.

---

## Layout Grid

```
+--Status Bar (HudBar)-------------------------------------------+
|  Logo   [Nav Tabs]                    Month | Gold | XP        |
+------------+----------------------------+-------------------+
|            |                            |                   |
| Character  |   Main Window (tabbed)    |   Quest Log       |
| Panel      |                            |                   |
| (3 cols)   |   (6 cols)                |   (3 cols)        |
|            |                            |                   |
+------------+----------------------------+-------------------+
+--Hotbar (fixed bottom)------------------------------------+
|  [Import] [Transactions] [Budgets] [Insights] [Settings] |
+-----------------------------------------------------------+
```

---

## DO / DON'T

### DO
- Use `font-pixel` sparingly — titles, labels, stat numbers
- Use `text-mmorpg-parchment` for primary readable text
- Use `text-mmorpg-steel` for secondary / muted text
- Use `text-gold` for important numbers and CTAs
- Keep spacing consistent: `gap-2`, `gap-4`, `p-3`, `p-4`
- Wrap all content in `<GameWindow>`

### DON'T
- Don't use `font-pixel` for paragraphs or long text
- Don't use bright saturated colors — stay within the palette
- Don't use rounded corners larger than `rounded-sm` (2px)
- Don't add drop shadows not in the design system
- Don't use white backgrounds
- Don't add animations heavier than scale/fade

---

## Rarity Mapping (Transaction Amounts)

| Amount (MYR) | Rarity | Color |
|-------------|--------|-------|
| < 10 | Common | Grey `#9aaac4` |
| 10–50 | Uncommon | Green `#4aaa6a` |
| 50–200 | Rare | Blue `#3a7bd5` |
| 200–500 | Epic | Purple `#8a5acd` |
| 500+ | Legendary | Gold `#d4a017` |
| CREDIT | Special | Green |
