package com.guitar.fretboardhero;

import com.android.billingclient.api.*;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import android.os.Handler;
import android.os.Looper;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Google Play entitlement belongs to this package, regardless of selected instrument. */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String PRODUCT = "lifetime_access";
    private static final String VERIFY_URL = "https://fretboard-hero.com/api/billing/google/verify";
    private VerifiedPurchaseCache cache;
    private BillingClient billing;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private PluginCall purchaseCall;
    private boolean connecting;
    private final Handler main = new Handler(Looper.getMainLooper());
    private int connectionAttempt;
    private final List<Runnable> connected = new ArrayList<>();
    private final List<PluginCall> waiting = new ArrayList<>();

    @Override public void load() {
        cache = AndroidPurchaseCache.create(getContext(), PRODUCT);
        billing = BillingClient.newBuilder(getContext()).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
    }

    private JSObject state(boolean unlocked, String status) {
        JSObject result = new JSObject(); result.put("unlocked", unlocked); result.put("status", status); return result;
    }
    private void resolveCached(PluginCall call, String status) {
        worker.execute(() -> {
            try { call.resolve(state(cache.token() != null, status)); }
            catch (Exception ignored) { call.reject("Could not read purchase status. Please restore your access."); }
        });
    }
    private static String read(InputStream input) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] buffer = new byte[2048]; int count;
        while ((count = input.read(buffer)) != -1) { if (out.size() + count > 16384) throw new IOException("Response too large"); out.write(buffer, 0, count); }
        return out.toString("UTF-8");
    }
    @PluginMethod public void cachedState(PluginCall call) { resolveCached(call, "cached"); }

    private void rejectPlay(PluginCall call, String message, String stage, BillingResult result) {
        // SDK diagnostics only: never include purchase tokens or backend responses.
        JSObject details = new JSObject(); details.put("debugMessage", result.getDebugMessage());
        call.reject(message, "PLAY_" + stage + "_" + result.getResponseCode(), null, details);
    }

    private void ready(PluginCall call, Runnable action) {
        getActivity().runOnUiThread(() -> {
            if (billing.isReady()) { action.run(); return; }
            connected.add(action); waiting.add(call);
            if (connecting) return; connecting = true;
            final int attempt = ++connectionAttempt;
            main.postDelayed(() -> {
                if (!connecting || attempt != connectionAttempt) return;
                connecting = false; connectionAttempt++;
                for (PluginCall pending : waiting) pending.reject("Google Play connection timed out. Please try again.", "PLAY_SETUP_TIMEOUT");
                waiting.clear(); connected.clear();
            }, 12000);
            billing.startConnection(new BillingClientStateListener() {
                @Override public void onBillingSetupFinished(BillingResult result) {
                    if (attempt != connectionAttempt) return;
                    connecting = false;
                    List<Runnable> actions = new ArrayList<>(connected); List<PluginCall> calls = new ArrayList<>(waiting);
                    connected.clear(); waiting.clear();
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) { for (Runnable next : actions) next.run(); }
                    else { for (PluginCall pending : calls) rejectPlay(pending, "Google Play is unavailable. Please try again.", "SETUP", result); }
                }
                @Override public void onBillingServiceDisconnected() { /* Automatic reconnection on next request. */ }
            });
        });
    }
    private interface ProductCallback { void accept(ProductDetails product, ProductDetails.OneTimePurchaseOfferDetails offer); }
    private void product(PluginCall call, ProductCallback callback) {
        QueryProductDetailsParams.Product item = QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT).setProductType(BillingClient.ProductType.INAPP).build();
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(item)).build(), (result, details) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { rejectPlay(call, "Unlock is not available in Google Play yet. Please try again later.", "CATALOG", result); return; }
            if (details.getProductDetailsList().isEmpty()) { call.reject("Unlock is not available in Google Play yet. Please try again later.", "PLAY_PRODUCT_UNAVAILABLE"); return; }
            ProductDetails found = details.getProductDetailsList().get(0);
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = found.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) { call.reject("No purchase offer is available.", "PLAY_OFFER_UNAVAILABLE"); return; }
            // Only the permanent "buy" option can unlock the application.
            for (ProductDetails.OneTimePurchaseOfferDetails offer : offers) {
                if ("buy".equals(offer.getPurchaseOptionId()) && offer.getRentalDetails() == null && offer.getPreorderDetails() == null) {
                    callback.accept(found, offer); return;
                }
            }
            call.reject("The permanent purchase option is not available yet.", "PLAY_OFFER_UNAVAILABLE");
        });
    }
    @PluginMethod public void price(PluginCall call) {
        ready(call, () -> product(call, (details, offer) -> { JSObject value = new JSObject(); value.put("price", offer.getFormattedPrice()); call.resolve(value); }));
    }
    @PluginMethod public void purchase(PluginCall call) {
        ready(call, () -> product(call, (details, offer) -> getActivity().runOnUiThread(() -> {
            if (purchaseCall != null) { call.reject("A purchase is already in progress."); return; }
            purchaseCall = call;
            BillingFlowParams.ProductDetailsParams item = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details).setOfferToken(offer.getOfferToken()).build();
            BillingResult result = billing.launchBillingFlow(getActivity(), BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(item)).build());
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                purchaseCall = null;
                if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) restore(call);
                else if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) resolveCached(call, "cancelled");
                else rejectPlay(call, "Google Play could not open the purchase. Please try again.", "LAUNCH", result);
            }
        })));
    }
    @PluginMethod public void restore(PluginCall call) {
        ready(call, () -> billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { rejectPlay(call, "Could not check purchases. Connect to Google Play and try again.", "RESTORE", result); return; }
            process(purchases, call);
        }));
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call = purchaseCall; purchaseCall = null;
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            if (call != null) process(purchases, call);
            else notifyListeners("purchasesChanged", new JSObject());
        } else if (call != null) {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) resolveCached(call, "cancelled");
            else if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) restore(call);
            else rejectPlay(call, "Payment could not be completed. You can restore your access to check again.", "PURCHASE", result);
        }
    }
    private void process(List<Purchase> purchases, PluginCall call) {
        Purchase owned = null; boolean pending = false;
        for (Purchase purchase : purchases) if (purchase.getProducts().contains(PRODUCT)) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) owned = purchase;
            else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) pending = true;
        }
        final String purchaseToken = owned == null ? null : owned.getPurchaseToken();
        final boolean isPending = pending;
        worker.execute(() -> {
            final String token;
            try {
                // Empty Play queries are not proof of a refund. Revalidate the
                // encrypted previous token before revoking an existing purchase.
                token = purchaseToken != null ? purchaseToken : cache.token();
                if (token == null) { call.resolve(state(false, isPending ? "pending" : "not_owned")); return; }
            } catch (Exception ignored) { call.reject("Could not read purchase status. Please restore your access."); return; }
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(VERIFY_URL).openConnection();
                connection.setInstanceFollowRedirects(false); connection.setConnectTimeout(8000); connection.setReadTimeout(25000);
                connection.setRequestMethod("POST"); connection.setRequestProperty("Content-Type", "application/json"); connection.setDoOutput(true);
                JSONObject body = new JSONObject().put("packageName", getContext().getPackageName()).put("productId", PRODUCT).put("purchaseToken", token);
                try (OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
                if (connection.getResponseCode() != 200) throw new IOException("Verification unavailable");
                JSONObject verified; try (InputStream input = connection.getInputStream()) { verified = new JSONObject(read(input)); }
                if (!(verified.get("unlocked") instanceof Boolean)) throw new IOException("Invalid verification");
                String status = verified.getString("status");
                cache.accept(token, verified.getString("packageName"), verified.getString("productId"), verified.getBoolean("unlocked"), status);
                call.resolve(state(cache.token() != null, status));
            } catch (Exception ignored) { call.reject("Purchase verification is temporarily unavailable. Connect and tap Restore your access to retry."); }
            finally { if (connection != null) connection.disconnect(); }
        });
    }
    @Override protected void handleOnDestroy() {
        if (billing != null) billing.endConnection(); worker.shutdownNow(); super.handleOnDestroy();
    }
}

