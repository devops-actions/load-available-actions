# Agents

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for project-specific Copilot instructions.

## Release process

Releases are triggered by pushing a `v*` tag (see `.github/workflows/publishing.yml`). The workflow tests the action (using `secrets.PAT`), then publishes a GitHub release with the build assets.

Important lessons learned (2026-08, v3.1.x):

- **Immutable releases are enabled** on this repo/org. A tag name used by a published release is permanently burned, even if the release and tag are deleted afterwards. Never publish a tag until you are sure the release will succeed; if a release fails, bump the patch version (e.g. v3.1.0 → v3.1.1) instead of reusing the tag.
- **Tag protection rules** may exist for `v*` tags (legacy feature, visible at the repo's `/rules` page). When pushing tags fails with "push declined due to repository rule violations / Cannot create ref due to creations being restricted", create the release via `gh release create <tag> --target main` instead — that creates the tag through the API, which is not blocked by those rules.
- The publish job's "Protect v* tags" step needs **administration permission** on `secrets.PAT`. It is marked `continue-on-error` so a PAT without that permission does not block the release.
- The publishing workflow's test job and `test-big-organization.yml` use `secrets.PAT`; if they fail instantly with `Bad credentials`, the PAT has expired — rotate it under Settings → Secrets → Actions → `PAT`. (`testing.yml` uses `${{ github.token }}` instead.)

