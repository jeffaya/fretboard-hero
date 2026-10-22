package com.guitar.fretboardhero;

import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/** Keeps the WebView itself inside the usable window, including its fixed dialogs. */
final class WebViewInsets {
    private WebViewInsets() {}

    static void install(View container) {
        ViewCompat.setOnApplyWindowInsetsListener(container, WebViewInsets::apply);
        ViewCompat.requestApplyInsets(container);
    }

    static WindowInsetsCompat apply(View view, WindowInsetsCompat windowInsets) {
        // getInsets takes the maximum for each edge, not the sum. A keyboard
        // already covers the bottom navigation bar; counting both shrinks twice.
        Insets safe = windowInsets.getInsets(
            WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout()
                | WindowInsetsCompat.Type.ime()
        );
        view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
        // The Android bundle uses viewport-fit=contain. Do not deliver these
        // same insets to Chromium/Capacitor for a second CSS or IME adjustment.
        return WindowInsetsCompat.CONSUMED;
    }
}
