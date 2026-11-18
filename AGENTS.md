# GitHub Actions

This repository allows exactly two workflows in `.github/workflows/`.

- **Deploy** runs on pushes to `main`. Run the full regression suite here and require every test job to pass before publishing the Cloudflare Worker.
- **Generate Android App** runs on manual dispatch. Build signed AABs for the selected instruments and include the instrument, version name and version code in the run title.

Pull requests must trigger zero workflows. Keep new automated tests in **Deploy** and store visual exports in the local scripts. Preserve these two workflows as the complete list.
