# FlixView dev logs

One file per version, written for whoever works on FlixView next: what
changed, why, how it was done, how it was checked, and what is still open.
The short, user-facing version of each release is in
[release_notes.md](../release_notes.md) and on the GitHub release.

| Version | Released | Highlights |
| :--- | :--- | :--- |
| [v0.1.20](v0.1.20.md) | 23 November 2026 | Scroll performance, nested smooth scrolling, pinned filter bars, new Trending page, macOS updater without Squirrel |

Versions before v0.1.20 predate these logs. Their changes are in the git
history (`git log v0.1.18..v0.1.19`, for example) and in the GitHub releases.

## Writing a new entry

Add `vX.Y.Z.md` and a row to the table above when a version is released.
Keep the same sections: Summary, Changes (what, why, how, files), Website,
Verification, Known issues and follow-ups. Record measurements where a
change was made for performance, so the next person can compare.
