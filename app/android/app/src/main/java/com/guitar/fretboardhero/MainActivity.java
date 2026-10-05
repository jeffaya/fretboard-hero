package com.guitar.fretboardhero;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // No dynamic safe-area handling here: a constant CSS margin
        // (web/styles.css, --sa-top/right/bottom/left) is used instead, after
        // multiple device-tested attempts at reading real insets (Capacitor's
        // bundled SystemBars plugin, @capacitor-community/safe-area, and a
        // custom WindowInsetsCompat listener) all produced inconsistent or
        // broken results on this app's target devices.
        WebView webView = this.bridge.getWebView();
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(Color.rgb(3, 5, 9));
    }
}
