"""Verify an installed Fretboard Hero app via Chrome DevTools Protocol (CDP).

Drives the running app's WebView to click through all 4 screens
(practice/fretmap/circle/quiz) and reports the active screen after each
click plus any console errors/warnings raised during navigation. Useful to
smoke-test offline mode, instrument branding, or pinch-zoom config without
manual interaction.

Prerequisites:
  1. Install the target APK and launch it on a device/emulator.
  2. Forward the WebView devtools port, e.g.:
       adb shell pidof <package.id>          # get the PID
       adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>
  3. pip install websocket-client

Usage:
  python tools/verify-webview-navigation.py [devtools_port]
    devtools_port defaults to 9222.
"""

import json
import sys
import time
import urllib.request

import websocket

PORT = sys.argv[1] if len(sys.argv) > 1 else 9222

tabs = json.loads(urllib.request.urlopen(f"http://localhost:{PORT}/json").read())
ws_url = tabs[0]["webSocketDebuggerUrl"]
ws = websocket.create_connection(ws_url, suppress_origin=True)

msg_id = 0
console_errors = []


def send(method, params=None):
    global msg_id
    msg_id += 1
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    while True:
        resp = json.loads(ws.recv())
        if resp.get("id") == msg_id:
            return resp
        if resp.get("method") == "Runtime.consoleAPICalled":
            lvl = resp["params"].get("type")
            if lvl in ("error", "warning"):
                args = resp["params"].get("args", [])
                text = " ".join(str(a.get("value", a.get("description", ""))) for a in args)
                console_errors.append(f"[{lvl}] {text}")


def eval_js(expr):
    r = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    return r.get("result", {}).get("result", {}).get("value")


send("Runtime.enable")

title = eval_js("document.title")
print(f"Page title: {title}")

screens = ["practice", "fretmap", "circle", "quiz"]
for s in screens:
    eval_js(f"document.querySelector('[data-go=\"{s}\"]').click()")
    time.sleep(1.2)
    active = eval_js("document.querySelector('.screen.active') ? document.querySelector('.screen.active').id : null")
    print(f"Navigated to {s} -> active screen: {active}")
    eval_js("document.querySelector('[data-go=\"home\"]').click()")
    time.sleep(0.8)

viewport = eval_js(
    "document.querySelector('meta[name=viewport]') ? document.querySelector('meta[name=viewport]').content : null"
)
print("Viewport meta:", viewport)

print("Console errors/warnings during navigation:", console_errors if console_errors else "NONE")

ws.close()
