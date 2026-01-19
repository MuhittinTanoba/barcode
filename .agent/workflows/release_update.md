---
description: Create and Publish a New Update
---

# How to Release a New Update

Since your application is configured with `electron-updater` and GitHub Releases, you can push updates remotely by simply creating a new Release on GitHub.

## 1. Prepare the Release
Open `package.json` and increment the version number.
For example, change `"version": "1.0.1"` to `"version": "1.0.2"`.

## 2. Build the Application
Run the build command to generate the installation files.
// turbo
```bash
npm run electron-build
```

## 3. Publish to GitHub
1. Go to your GitHub repository: [https://github.com/MuhittinTanoba/boss-pos](https://github.com/MuhittinTanoba/boss-pos)
2. Click on "Releases" -> "Draft a new release".
3. **Tag version**: Enter the version number exactly as it is in package.json (e.g., `v1.0.2`).
4. **Release title**: Enter a title (e.g., "v1.0.2 - Hotfix").
5. **Description**: Describe what changed.
6. **Attach Binaries**: Drag and drop the files created in the `dist` folder:
   - `Boss POS Setup 1.0.2.exe` (The installer)
   - `latest.yml` (Critical for the auto-updater to find the update)
   - `boss-pos-1.0.2.exe.blockmap` (Optimizes download size)
7. Click **"Publish release"**.

## 4. Client Update
- The application on the client devices will automatically check for this new release when it starts up (or periodically if configured).
- It will download the update in the background.
- When the user quits/restarts the application, the new version will be installed automatically.
