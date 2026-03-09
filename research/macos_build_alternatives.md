# macOS Build Alternatives on Windows

Building a macOS application from a Windows machine has specific limitations, primarily due to Apple's proprietary packaging (`.dmg`) and security (signing/notarization) requirements.

## Comparison of Solutions

| Solution | Difficulty | Cost | Quality | Pros | Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GitHub Actions** | Easy | Free* | High | Industry standard, automated, creates releases. | Requires GitHub account, private repos have limits. |
| **External Build Services** | Medium | Paid | High | Handles everything including signing easily. | Can be expensive. |
| **Virtualization (macOS VM)** | Hard | Free | Variable | Total control on your local machine. | Very resource-heavy, complex to set up legally. |

## Recommended Path: GitHub Actions

GitHub Actions is the most reliable way to build cross-platform apps without owning the hardware.

### How it works:
1. You push your code to a GitHub repository.
2. A `.github/workflows/build.yml` file tells GitHub to spin up a macOS runner.
3. The runner executes `npm run dist:win` (or `dist:mac`).
4. The final `.dmg` is uploaded as a "Build Artifact" or attached to a GitHub Release.

### Important: Code Signing
Regardless of the build method, macOS apps require **Code Signing** and **Notarization** to run smoothly.
- **Without Signing**: Users see "App is from an unidentified developer." They must override this in System Settings.
- **With Signing**: Requires an Apple Developer Program membership ($99/year) and a certificate.

## Next Steps
If you decide to go with GitHub Actions:
1. Initialize a Git repository in your project.
2. Push your code to GitHub.
3. Add the `build.yml` configuration (I can provide this).
