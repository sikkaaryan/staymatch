# Add StayMatch to your GitHub repository from iPhone

1. Download the ZIP and open it in the iPhone Files app.
2. Tap the ZIP once to extract it. You should see `package.json`, `tsconfig.json`, `README.md`, and the `src` folder.
3. Open your repository in Safari: https://github.com/sikkaaryan/staymatch
4. Use **Add file → Upload files** if GitHub offers it in the mobile view. Select the extracted project files and folders, not the ZIP itself.
5. Commit the upload to the `main` branch.

If GitHub's mobile page does not allow selecting folders or multiple files, don't upload only the ZIP expecting GitHub to unpack it. Tell ChatGPT what upload options you see and use the next suggested route.

This is a TypeScript project scaffold, not yet a deployed website. The discovery adapter finds candidate Airbnb URLs via a configured search API; it does not verify live prices, amenities, or availability. It intentionally does not scrape Airbnb. The search API may require a separate account/API key and free-tier eligibility.
