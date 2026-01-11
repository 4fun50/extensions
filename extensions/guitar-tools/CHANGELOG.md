# Changelog

## [Initial Version] - {PR_MERGE_DATE}

### Added

- Audio device selection: Users can now choose their preferred audio input device (external audio interfaces, sound cards, etc.) directly from the tuner via Action Panel (Cmd+K)
- Visual indicator showing the currently selected audio device

### Changed

- Audio device selection is now integrated into the Chromatic Tuner command as an action (accessible via Cmd+K)
- Audio device selection is stored locally instead of in preferences for better user experience
- Device listing logic is now reusable across future commands

### Fixed

- Improved device name detection to support all audio device naming conventions
