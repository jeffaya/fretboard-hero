# GitHub Actions

This repository allows exactly two workflows in `.github/workflows/`.

- **Deploy** runs on pushes to `main`. Run the full regression suite here and require every test job to pass before publishing the Cloudflare Worker. After publication, export and validate the Google Play visuals and attach them to the run.
- **Generate Android App** runs on manual dispatch. Build signed AABs for the selected instruments and include the instrument, version name and version code in the run title.

Pull requests must trigger zero workflows. Keep new automated tests and store visual export steps in **Deploy**. Preserve these two workflows as the complete list.
