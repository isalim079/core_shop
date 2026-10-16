This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Project-local UI/UX skills and design workflow

For mobile UI/UX, screen design, reusable components, navigation, gestures, animation or performance work, read [.agents/README.md](.agents/README.md) and load the relevant project-local skills from `.agents/skills/`. Use the same files from any CLI/model; do not install them globally.

- Visual direction, typography, calm palettes and contrast: `ui-ux-pro-max`.
- Reusable components/tokens and DRY: `expo-design-system`.
- Mobile layout and platform behavior: `expo-native-ui` and `expo-ui`.
- Routes, tabs, stacks and dismissal: `expo-router`.
- Smooth, interruptible animation/gestures and reduced motion: `expo-animation`.
- List/render/image performance: `react-native-skills` (skill name `vercel-react-native-skills`).

The user's static-first order and project conventions override generic skill examples: follow `readme/mobileUiUxPlan.md` and `readme/mobileProgress.md`; centralize fixtures under `src/staticData/`, keep route files thin, reuse components/features/hooks, and retain NativeWind 4 and the existing theme. Do not migrate styling/navigation, add libraries, force Expo Go, send external feedback/telemetry, or replace branding just because a skill example suggests it. Verify installed SDK APIs against matching Expo docs.

Aim for calm surfaces, restrained emerald accents, clear hierarchy and accessible text; soothing does not mean faint text. Check actual foreground/background contrast (normal text >=4.5:1; large text and meaningful controls/icons >=3:1), keyboard/safe areas and large text. Respect reduced motion, avoid unnecessary autoplay, and verify smoothness in release-like builds on Android/iOS before claiming it. Skills guide implementation; they do not replace device evidence or certify production readiness.
