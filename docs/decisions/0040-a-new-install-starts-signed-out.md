# 0040: A new install starts signed out

Date: 2026-11-16

Status: Accepted.

## Context

The app keeps the server address and the phone token in the iOS Keychain or the Android Keystore through `expo-secure-store`. It keeps the chosen car and the alert choices there too.

1. iOS keeps Keychain entries when a person deletes an app. After a new install, the app opened the car at once, with no Connect screen and no pairing. A Maestro `launchApp` with `clearState: true` on the simulator showed the same: the app opened the Overview of the demo.
2. The data is a location history. A person who deletes the app expects that the phone is signed out. A phone that changes its owner without a full erase is the bad case.
3. Apple does not document this behavior. Apple DTS says that an iOS 10.3 beta deleted the entries and the release did not, and that an app must act reasonably if the behavior changes.
4. Android removes the Keystore entries on uninstall. The `expo-secure-store` plugin keeps its entries out of Auto Backup by default, so a restore does not bring them back.
5. The app also keeps a key-value store in `expo-sqlite/kv-store`. The store lives in the app container, and iOS and Android delete it with the app. Every release since 2026-10-18 writes the car list to it after a connection.

## Decision

1. An install is new when the kv-store holds no key. `isNewInstall()` in `mobile/src/connection/install.ts` holds the rule.
2. At each start, the connection provider checks the rule before it reads the connection. On a new install, it deletes the three Keychain keys of `keychainKeys`. Then it writes the mark `installed` to the kv-store, at each start. So an install that an update brings from a release without the mark gets the mark at its first start, and a later sign-out that empties the other keys does not make the next start look new. The tabs mount only after this step.
3. The order is delete, then mark. When a delete fails, the mark stays absent, and the next start tries again. A storage error shows the Connect screen for this start.
4. Every Keychain key of the app comes from `keychainKeys`, so a new key is deleted too.
5. The rule has no platform branch. On Android the delete finds nothing.

## Alternatives

1. A plain first-launch flag. An install from before this change has no flag, so each phone signs out at the update. An empty store gives the same answer for a new install and keeps the connection at an update.
2. A check of the install time with `expo-application`. It is a new native package, and the app needs a new build for each platform.
3. A branch for iOS only. The same code is correct on both platforms, and a branch adds a path that only one platform tests.

## Consequences

- The token of the earlier install stays valid on the server until **Account** on the web signs the phone out, or for 90 days after its last use. The app cannot run when a person deletes it, and the first start of the new install does not end the old token. `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keeps the token out of backups, so no copy stays on the phone.
- Maestro `launchApp` with `clearState: true` now always opens the Connect screen.
- An earlier install that is connected but never stored a car list has an empty kv-store. It signs out one time at the update.
- A real iPhone and an Android device were not checked. The evidence is the Expo documentation, the Apple forum answer, the library source, and the iOS simulator.

## Sources

- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), read on 2026-11-16: iOS data persists across an uninstall for the same bundle ID and this "is not guaranteed". Android data "will not be preserved upon app uninstallation." `configureAndroidBackup` defaults to `true`. A `WHEN_UNLOCKED_THIS_DEVICE_ONLY` entry "is not migrated to a new device when restoring from a backup."
- [Apple Developer Forums: iOS autodelete Keychain items after uninstall?](https://developer.apple.com/forums/thread/36442), read on 2026-11-16: the answer of Apple DTS.
- [Android Auto Backup](https://developer.android.com/identity/data/autobackup), read on 2026-11-16: with an `<include>` element, the system backs up only the files that it names.
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/), read on 2026-11-16: the key-value store is backed by SQLite and has synchronous calls, such as `getAllKeysSync()`.
- `expo-sqlite/ios/SQLiteModule.swift` and `expo-sqlite/android/src/main/java/expo/modules/sqlite/SQLiteModule.kt`: the store lives in `Documents/SQLite` on iOS and in `files/SQLite` on Android.
- `expo-secure-store/plugin/build/withSecureStore.js` and its `secure_store_backup_rules.xml` and `secure_store_data_extraction_rules.xml`: the backup rules include the shared preferences without `SecureStore`.
