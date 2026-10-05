package com.guitar.fretboardhero;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Required by @capacitor-community/safe-area: it reads the real system-bar/cutout
        // insets and feeds them back into CSS env(safe-area-inset-*) (or applies WebView
        // padding directly on the older Chromium versions where env() is unreliable).
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setBackgroundColor(Color.rgb(3, 5, 9));
    }
}
