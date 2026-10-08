# tools/

Ad hoc dev/debug scripts, not part of the shipped product.

- **`verify-webview-navigation.py`** — drives the WebView of an installed
  app via Chrome DevTools Protocol, clicking through the 4 screens
  (learn/fretmap/circle/quiz) and reporting console errors. Useful for
  validating offline mode, pinch-zoom and per-instrument branding without
  manual interaction. See the file's docstring for prerequisites
  (`adb forward`, `websocket-client`).
