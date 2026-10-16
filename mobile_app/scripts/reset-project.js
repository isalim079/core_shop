#!/usr/bin/env node

/**
 * Moves the current src route folders aside and creates a blank src/app.
 * Remove the reset-project script from package.json after you no longer need it.
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const srcDir = path.join(root, "src");
const oldDirs = ["app", "components", "hooks", "constants"];
const exampleDir = path.join(root, "app-example");

const indexContent = `import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}
`;

const layoutContent = `import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`;

const moveDirectories = async () => {
  try {
    await fs.promises.mkdir(exampleDir, { recursive: true });
    console.log("Created /app-example.");

    for (const dir of oldDirs) {
      const oldDirPath = path.join(srcDir, dir);
      const nextDirPath = path.join(exampleDir, dir);
      if (fs.existsSync(oldDirPath)) {
        await fs.promises.rename(oldDirPath, nextDirPath);
        console.log(`Moved /src/${dir} to /app-example/${dir}.`);
      } else {
        console.log(`/src/${dir} does not exist, skipping.`);
      }
    }

    const newAppDirPath = path.join(srcDir, "app");
    await fs.promises.mkdir(newAppDirPath, { recursive: true });
    await fs.promises.writeFile(path.join(newAppDirPath, "index.tsx"), indexContent);
    await fs.promises.writeFile(path.join(newAppDirPath, "_layout.tsx"), layoutContent);

    console.log("\nProject reset complete. Next steps:");
    console.log("1. Run `yarn start`.\n2. Edit src/app/index.tsx.\n3. Delete /app-example when you no longer need it.");
  } catch (error) {
    console.error(`Error during script execution: ${error}`);
  }
};

moveDirectories();
