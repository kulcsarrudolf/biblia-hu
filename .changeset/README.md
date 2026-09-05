# Changesets

This folder holds pending release notes managed by [Changesets](https://github.com/changesets/changesets).
Every pull request adds one file here with `yarn changeset`.
When they land on `main`, the release workflow opens a "Version Packages" pull request that bumps the version and updates `CHANGELOG.md`.
