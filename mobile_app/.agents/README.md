# Core Shop project-local mobile UI/UX skills

Installed 2026-10-16 for this mobile project only. No skill was installed in a home/global skills directory. Sources and file hashes are pinned in [skills-lock.json](skills-lock.json); retain upstream license notices. Installation is a reviewed snapshot, not an automatic update service.

## Use from any coding agent or model

Read [AGENTS.md](../AGENTS.md), the [static-first UI/UX plan](../readme/mobileUiUxPlan.md) and the [progress tracker](../readme/mobileProgress.md). Then load only the relevant skill and references:

| Skill file | Purpose | Source |
| --- | --- | --- |
| [ui-ux-pro-max](skills/ui-ux-pro-max/SKILL.md) | Visual direction, color/typography, touch UX, accessibility and local design search | [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |
| [expo-design-system](skills/expo-design-system/SKILL.md) | Shared design/motion tokens, component patterns and reuse | [Official Expo skills](https://github.com/expo/skills) |
| [expo-native-ui](skills/expo-native-ui/SKILL.md) | Mobile layout and platform UI conventions | [Official Expo skills](https://github.com/expo/skills) |
| [expo-ui](skills/expo-ui/SKILL.md) | Existing `@expo/ui` controls and platform behavior | [Official Expo skills](https://github.com/expo/skills) |
| [expo-router](skills/expo-router/SKILL.md) | Tabs/stacks/links, headers, sheets and route structure | [Official Expo skills](https://github.com/expo/skills) |
| [expo-animation](skills/expo-animation/SKILL.md) | Reanimated/gestures, spring/timing decisions, interruption and reduced motion | [Official Expo skills](https://github.com/expo/skills) |
| [react-native-skills](skills/react-native-skills/SKILL.md) | Rendering, lists, images, UI/animation performance | [Official Vercel skills](https://github.com/vercel-labs/agent-skills) |

Selection was based on actual mobile applicability, upstream content and source reputation, not just the skill title. Registry snapshots observed during review: UI UX Pro Max approximately 399K installs; Vercel React Native approximately 242.5K installs. Expo's older `building-native-ui` entry showed approximately 58.1K installs; the reviewed current Expo repository separates that guidance into the installed focused skills. Counts are historical selection signals, not guarantees of quality.

Registry references: [UI UX Pro Max](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max), [Vercel React Native](https://skills.sh/vercel-labs/agent-skills/vercel-react-native-skills), [Expo legacy native UI entry](https://skills.sh/expo/skills/building-native-ui).

`.agents/skills/` is the canonical local directory. `.claude/skills`, `.gemini/skills`, and `.agent/skills` are relative compatibility links to it, not duplicated copies. Current [skills CLI agent definitions](https://github.com/vercel-labs/skills/blob/main/src/agents.ts) use `.agents/skills` for Codex, Gemini CLI, Antigravity and Cursor; installed CLI versions may differ. `CLAUDE.md` and `GEMINI.md` include the shared instructions. There is no model-specific binary or account setup.

Refresh/restart the agent session after installation. Skill-aware CLIs can discover the local `SKILL.md` files; a CLI that does not auto-discover them can still read the guide and skill files directly. If symlinks are unavailable after checkout, use `.agents/skills` directly and explicitly tell the agent to load the relevant files. Automatic behavior has not been verified in every third-party CLI or model version.

Suggested prompt:

> Read AGENTS.md, .agents/README.md and the relevant project-local UI/UX skills. Continue the next M01-UI task in readme/mobileProgress.md. Build static-first with src/staticData, reusable components/features/hooks, calm accessible colors and smooth reduced-motion-aware interactions. Record device evidence and preserve existing progress.

## Local UI/UX search

Run these from the mobile project root. Python 3 standard library is sufficient; these searches do not install packages or call a remote API.

```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "retail operations calm clear accessible" --design-system -p "Core Shop"
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "contrast accessible text" --domain ux
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "animation" --stack react-native
```

The design-system generator provides general visual direction and does not apply a stack filter; run a separate `--stack react-native` query for native implementation guidance. Search output is advisory. Keep the existing CS brand and Poppins/theme unless the user asks to change them. Do not run `--persist` or overwrite an existing design-system master merely to verify installation. If later saving a design proposal, choose an explicit workspace output directory and distinguish proposals from accepted tokens. The UI/UX skill's Claude-plugin-specific search path was adapted to the portable project-root command above; this local change is recorded in the manifest.

## Core Shop design policy

1. Static UI/UX comes first: auth/onboarding → dashboard and tabs → all planned screen flows → motion polish → static verification. Use `src/staticData/` for fixtures and typed feature adapters; no fake production auth, charges or hidden network-failure mock fallback.
2. Reuse the existing NativeWind 4 theme, shared Screen/Button/TextField, and domain patterns. Keep route files thin, extract reusable feature sections/hooks at real repetition, and avoid a separate competing design system.
3. Prefer calm neutral surfaces, restrained emerald accents, generous readable spacing, clear grouping and consistent type. Avoid excessive gradients, glass, shadows, decorative card nesting, low-contrast gray copy and uncontrolled autoplay.
4. Check actual color pairs: normal text >=4.5:1, large text and meaningful icons/control boundaries >=3:1. Do not assume the brand green works with white small text. Disabled/noninformative decoration is not a substitute for readable active states. Keep light mode initially; do not add a theme switch without full screen support.
5. Use motion to explain interaction, not delay it. Share motion tokens, support interruption/velocity handoff, coordinate keyboard and navigation, and respect reduced motion. Sliders need position and manual accessible alternatives; avoid unnecessary automatic advance.
6. Profile long lists and key gestures on Android/iOS release-like builds. An installed skill or a simulator impression does not prove smoothness or production readiness.
7. Read matching Expo SDK docs before API changes. Generic skill examples can disagree with each other and the repo: retain the existing styling and safe-area conventions, current JS tab plan, development-client workflow, dependency versions and user scope. Do not add FlashList, change navigators, replace icon libraries or introduce native modules solely because an upstream example prefers them.
8. Use React Native/Expo motion guidance, not generated DOM/GSAP/CSS snippets. Upstream UI/UX search supports multiple stacks; always select `react-native` when implementation advice matters. A carousel is not the same as a numeric Slider control.
9. Upstream skills sometimes suggest feedback submissions or other external services. Installing them grants no permission to send project data or messages; follow the user's authorization and normal repository rules.
10. Update the tracker with the skill actually used, relevant references, screenshots/device/build evidence, lint/typecheck results and remaining gaps. No phase is completed just by loading a skill.

## Maintenance

Review upstream diffs and compatibility before updating a pinned snapshot. Preserve any local path adaptation and project policy. Do not run global installation/update commands. Refresh the manifest and rerun the local search, discovery/link checks and project lint/typecheck after an update. These files are agent guidance/development tools; no application runtime package was added.
