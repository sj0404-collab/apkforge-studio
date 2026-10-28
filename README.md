# APKForge Studio

**APKForge Studio** is a zero-backend, in-browser Android IDE, binary APK compiler, and dual-scheme cryptographic signer (`JAR v1` + `APK Signature Scheme v2`). Everything runs 100% client-side in TypeScript + WebCrypto and produces real, installable `.apk` packages that pass `apksigner`, `zipalign`, `aapt`, `dexdump`, and Android 7–15 `PackageManager` verification on physical devices.

---

## Architecture & Binary Pipeline

Unlike mock web wrappers, **APKForge Studio** emits genuine Android binary formats directly in the browser:

| Module | Output | Specification |
| --- | --- | --- |
| `src/lib/axml.ts` | `AndroidManifest.xml` | Compiled **Android Binary XML (`0x00080003`)** with UTF-16LE string pool, `0x0180` system resource attribute ID map (`0x0101xxxx`), `uses-sdk`, `uses-permission`, `<application>` and launcher `<activity>`. |
| `src/lib/arsc.ts` | `resources.arsc` + `res/drawable/ic_launcher.png` | Uncompressed **binary `ResTable` (`0x0002`)** mapping `@string/app_name` (`0x7f010000`) and `@drawable/ic_launcher` (`0x7f020000`), paired with a generated 64×64 RGBA PNG launcher icon. |
| `src/lib/dex.ts` | `classes.dex` | Executable **Dalvik Bytecode (`dex\n035\0`)** verified by `dexdump -c -d`: compiles `<namespace>.MainActivity` (`WebView` host with JS, `domStorage`, file access, and `mediaPlaybackRequiresUserGesture = false`) and `<namespace>.Bridge` (`@JavascriptInterface` methods `showToast`, `log`, `vibrate`, `deviceInfo` backed by `android.widget.Toast`, `android.util.Log`, and `android.os.Vibrator`). |
| `src/lib/keys.ts` | `META-INF/MANIFEST.MF`, `CERT.SF`, `CERT.RSA` | WebCrypto **RSA-2048** key generation, RFC 5280 **X.509v3** certificates (`BasicConstraints`, `KeyUsage: digitalSignature`, `GeneralizedTime`), PKCS#7 / CMS signature, and `X-Android-APK-Signed: 2`. |
| `src/lib/apksigv2.ts` | `APK Sig Block 42` (`0x7109871a`) + 4-byte `zipalign` | Custom ZIP writer aligning all `STORED` entries (`resources.arsc`, PNGs) to 4-byte boundaries (required for `targetSdk >= 30`), computing 1 MiB chunk SHA-256 Merkle digests, and injecting **APK Signature Scheme v2** before the Central Directory + built-in binary verifier. |
| `src/lib/studio.tsx` & `src/components/*` | Full IDE | **Monaco Editor**, **xterm.js** shell (`gradle`, `mvn`, `apksigner`, `zipalign`, `adb`, `unzip`, `sha256sum`), **JUnit-compatible JS unit test runner**, **Device Emulator** with `window.Android` bridge & `logcat`, **OpenCode** SSE streaming assistant, and **Delivery Bundle** exporter with live **GoFile.io** upload. |

---

## Quick Start

```bash
npm install
npm run dev
```

Production build & static preview:

```bash
npm run lint
npm run build
npm run preview
```

---

## Verifying Generated APKs with Android SDK Tools

Every `.apk` built in **APKForge Studio** (`Debug` or `Release`) can be verified directly with standard Android build-tools:

```bash
apksigner verify --verbose --print-certs com.forge.droid-release.apk
zipalign -c -v 4 com.forge.droid-release.apk
aapt dump badging com.forge.droid-release.apk
dexdump -c -d -f com.forge.droid-release.apk
adb install -r com.forge.droid-release.apk
```

---

## Native JavaScript ↔ Android Bridge (`window.Android`)

Web apps and HTML5 Canvas/WebAudio games placed in `app/src/main/assets/webapp/` run identically inside the Studio Emulator and on real Android devices:

```js
window.Android?.showToast('Stage Clear!');
window.Android?.vibrate(25);          // Uses android.os.Vibrator (requires VIBRATE permission)
window.Android?.log('Score: 12500');  // Emits to Android logcat (tag: APKForge)
const info = window.Android?.deviceInfo?.();
```
