package com.guitar.fretboardhero;

import android.graphics.Rect;
import android.os.Build;
import android.view.DisplayCutout;
import android.view.View;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import androidx.core.graphics.Insets;
import androidx.core.view.DisplayCutoutCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.util.ReflectionHelpers;
import org.robolectric.util.ReflectionHelpers.ClassParameter;
import java.util.Collections;
import static org.junit.Assert.*;

/** Real Android View measurement/dispatch, including the pre-30 compat path. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = {28, 29, 35, 36})
public class WebViewInsetsTest {
    private FrameLayout container;
    private View content;

    @Before public void setUp() {
        container = new FrameLayout(RuntimeEnvironment.getApplication());
        content = new View(container.getContext());
        container.addView(content, new FrameLayout.LayoutParams(-1, -1));
        WebViewInsets.install(container);
    }

    private void apply(Insets bars, Insets cutout, Insets keyboard) {
        Rect safe = new Rect(cutout.left, cutout.top, cutout.right, cutout.bottom);
        WindowInsetsCompat.Builder builder;
        if (Build.VERSION.SDK_INT == 28) {
            // Android 9 has no public WindowInsets.Builder. Construct its actual
            // framework value in the test sandbox so the cutout is not discarded.
            WindowInsets platform = ReflectionHelpers.callConstructor(WindowInsets.class,
                ClassParameter.from(Rect.class, new Rect()),
                ClassParameter.from(Rect.class, null),
                ClassParameter.from(Rect.class, new Rect()),
                ClassParameter.from(boolean.class, false),
                ClassParameter.from(boolean.class, false),
                ClassParameter.from(DisplayCutout.class, new DisplayCutout(safe, Collections.emptyList())));
            builder = new WindowInsetsCompat.Builder(WindowInsetsCompat.toWindowInsetsCompat(platform));
        } else {
            builder = new WindowInsetsCompat.Builder()
                .setDisplayCutout(new DisplayCutoutCompat(safe, Collections.emptyList()));
        }
        WindowInsetsCompat insets = builder
            .setInsets(WindowInsetsCompat.Type.systemBars(), bars)
            .setInsets(WindowInsetsCompat.Type.displayCutout(), cutout)
            .setInsets(WindowInsetsCompat.Type.ime(), keyboard)
            .build();
        // Below API 30, synthetic per-type insets live only on the compat object;
        // a round trip through framework WindowInsets discards those overrides.
        // Exercise the exact installed callback, with a dispatch check below.
        WindowInsetsCompat remaining = WebViewInsets.apply(container, insets);
        assertTrue("The WebView must not apply native insets again", remaining.isConsumed());
        container.measure(View.MeasureSpec.makeMeasureSpec(1000, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(2000, View.MeasureSpec.EXACTLY));
        container.layout(0, 0, 1000, 2000);
    }

    @Test public void installedListenerReceivesFrameworkInsetsAndConsumesThem() {
        WindowInsetsCompat insets = new WindowInsetsCompat.Builder()
            .setInsets(WindowInsetsCompat.Type.systemBars(), Insets.of(0, 24, 0, 48))
            .build();
        WindowInsetsCompat remaining = ViewCompat.dispatchApplyWindowInsets(container, insets);
        assertTrue(remaining.isConsumed());
        assertEquals(24, container.getPaddingTop());
        assertEquals(48, container.getPaddingBottom());
    }

    private void bounds(int left, int top, int right, int bottom) {
        assertEquals(left, content.getLeft());
        assertEquals(top, content.getTop());
        assertEquals(1000 - right, content.getRight());
        assertEquals(2000 - bottom, content.getBottom());
        assertTrue(content.getWidth() > 0);
        assertTrue(content.getHeight() > 0);
    }

    @Test public void portraitCutoutAndGestureBarKeepTheWholeViewportUsable() {
        apply(Insets.of(0, 24, 0, 24), Insets.of(0, 48, 0, 0), Insets.NONE);
        bounds(0, 48, 0, 24);
    }

    @Test public void rotationMovesCutoutAndThreeButtonNavigationToTheSides() {
        apply(Insets.of(0, 24, 0, 48), Insets.of(0, 48, 0, 0), Insets.NONE);
        apply(Insets.of(0, 24, 48, 0), Insets.of(64, 0, 0, 0), Insets.NONE);
        bounds(64, 24, 48, 0);
    }

    @Test public void keyboardReplacesBottomBarAndClosingItRestoresTheViewport() {
        Insets bars = Insets.of(0, 24, 0, 48);
        apply(bars, Insets.NONE, Insets.of(0, 0, 0, 700));
        bounds(0, 24, 0, 700);
        apply(bars, Insets.NONE, Insets.NONE);
        bounds(0, 24, 0, 48);
    }

    @Test public void floatingKeyboardDoesNotRemoveTheNavigationInset() {
        apply(Insets.of(0, 24, 0, 48), Insets.NONE, Insets.NONE);
        bounds(0, 24, 0, 48);
    }

    @Test public void repeatedInsetsDoNotAccumulatePadding() {
        for (int i = 0; i < 3; i++) {
            apply(Insets.of(0, 32, 0, 48), Insets.NONE, Insets.NONE);
            bounds(0, 32, 0, 48);
        }
    }

    @Test public void removedInsetsRestoreAllAvailableSpace() {
        apply(Insets.of(0, 32, 0, 48), Insets.of(64, 0, 0, 0), Insets.NONE);
        apply(Insets.NONE, Insets.NONE, Insets.NONE);
        bounds(0, 0, 0, 0);
    }
}
