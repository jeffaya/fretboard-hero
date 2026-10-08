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
    private static final String PRODUCT = "full_access";
    private static final String VERIFY_URL = "https://fretboard-hero.com/api/billing/google/verify";
    private static final long OFFLINE_GRACE_MS = 7L * 24 * 60 * 60 * 1000;
    private BillingClient billing;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private PluginCall purchaseCall;
    private boolean connecting;
    private final Handler main = new Handler(Looper.getMainLooper());
    private int connectionAttempt;
    private final List<Runnable> connected = new ArrayList<>();
    private final List<PluginCall> waiting = new ArrayList<>();

    @Override public void load() {
        billing = BillingClient.newBuilder(getContext()).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
    }

    private JSObject state(boolean unlocked, String status) {
        JSObject result = new JSObject(); result.put("unlocked", unlocked); result.put("status", status); return result;
    }
    // No-backup storage: an Android device restore must query the current Play account.
    private File cacheFile() { return new File(getContext().getNoBackupFilesDir(), "play-entitlement.json"); }
    private boolean cached() {
        try (FileInputStream in = new FileInputStream(cacheFile())) {
            JSONObject value = new JSONObject(read(in));
            long age = System.currentTimeMillis() - value.getLong("verifiedAt");
            return getContext().getPackageName().equals(value.getString("packageName")) && age >= 0 && age < OFFLINE_GRACE_MS;
        } catch (Exception ignored) { return false; }
    }
    private void save(boolean unlocked) throws Exception {
        if (!unlocked) { if (cacheFile().exists() && !cacheFile().delete()) throw new IOException("Cache removal failed"); return; }
        JSONObject value = new JSONObject().put("packageName", getContext().getPackageName()).put("verifiedAt", System.currentTimeMillis());
        try (FileOutputStream out = new FileOutputStream(cacheFile())) { out.write(value.toString().getBytes(StandardCharsets.UTF_8)); }
    }
    private static String read(InputStream input) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] buffer = new byte[2048]; int count;
        while ((count = input.read(buffer)) != -1) { if (out.size() + count > 16384) throw new IOException("Response too large"); out.write(buffer, 0, count); }
        return out.toString("UTF-8");
    }
    @PluginMethod public void cachedState(PluginCall call) { call.resolve(state(cached(), "cached")); }

    private void ready(PluginCall call, Runnable action) {
        getActivity().runOnUiThread(() -> {
            if (billing.isReady()) { action.run(); return; }
            connected.add(action); waiting.add(call);
            if (connecting) return; connecting = true;
            final int attempt = ++connectionAttempt;
            main.postDelayed(() -> {
                if (!connecting || attempt != connectionAttempt) return;
                connecting = false; connectionAttempt++;
                for (PluginCall pending : waiting) pending.reject("Google Play connection timed out. Please try again.");
                waiting.clear(); connected.clear();
            }, 12000);
            billing.startConnection(new BillingClientStateListener() {
                @Override public void onBillingSetupFinished(BillingResult result) {
                    if (attempt != connectionAttempt) return;
                    connecting = false;
                    List<Runnable> actions = new ArrayList<>(connected); List<PluginCall> calls = new ArrayList<>(waiting);
                    connected.clear(); waiting.clear();
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) { for (Runnable next : actions) next.run(); }
                    else { for (PluginCall pending : calls) pending.reject("Google Play is unavailable. Please try again."); }
                }
                @Override public void onBillingServiceDisconnected() { /* Automatic reconnection on next request. */ }
            });
        });
    }
    private interface ProductCallback { void accept(ProductDetails product, ProductDetails.OneTimePurchaseOfferDetails offer); }
    private void product(PluginCall call, ProductCallback callback) {
        QueryProductDetailsParams.Product item = QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT).setProductType(BillingClient.ProductType.INAPP).build();
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(item)).build(), (result, details) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || details.getProductDetailsList().isEmpty()) { call.reject("Unlock is not available in Google Play yet. Please try again later."); return; }
            ProductDetails found = details.getProductDetailsList().get(0);
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = found.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) { call.reject("No purchase offer is available."); return; }
            // Only the permanent "buy" option can unlock the application.
            for (ProductDetails.OneTimePurchaseOfferDetails offer : offers) {
                if ("buy".equals(offer.getPurchaseOptionId()) && offer.getRentalDetails() == null && offer.getPreorderDetails() == null) {
                    callback.accept(found, offer); return;
                }
            }
            call.reject("The permanent purchase option is not available yet.");
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
                else if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) call.resolve(state(cached(), "cancelled"));
                else call.reject("Google Play could not open the purchase. Please try again.");
            }
        })));
    }
    @PluginMethod public void restore(PluginCall call) {
        ready(call, () -> billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { call.reject("Could not check purchases. Connect to Google Play and try again."); return; }
            process(purchases, call);
        }));
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call = purchaseCall; purchaseCall = null;
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            if (call != null) process(purchases, call);
            else notifyListeners("purchasesChanged", new JSObject());
        } else if (call != null) {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) call.resolve(state(cached(), "cancelled"));
            else if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) restore(call);
            else call.reject("Payment could not be completed. You can restore purchases to check again.");
        }
    }
    private void process(List<Purchase> purchases, PluginCall call) {
        Purchase owned = null; boolean pending = false;
        for (Purchase purchase : purchases) if (purchase.getProducts().contains(PRODUCT)) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) owned = purchase;
            else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) pending = true;
        }
        if (owned == null) {
            try { save(false); call.resolve(state(false, pending ? "pending" : "not_owned")); }
            catch (Exception ignored) { call.reject("Could not update purchase status."); }
            return;
        }
        final String token = owned.getPurchaseToken();
        worker.execute(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(VERIFY_URL).openConnection();
                connection.setInstanceFollowRedirects(false); connection.setConnectTimeout(8000); connection.setReadTimeout(25000);
                connection.setRequestMethod("POST"); connection.setRequestProperty("Content-Type", "application/json"); connection.setDoOutput(true);
                JSONObject body = new JSONObject().put("packageName", getContext().getPackageName()).put("productId", PRODUCT).put("purchaseToken", token);
                try (OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
                if (connection.getResponseCode() != 200) throw new IOException("Verification unavailable");
                JSONObject verified; try (InputStream input = connection.getInputStream()) { verified = new JSONObject(read(input)); }
                boolean unlocked = verified.getBoolean("unlocked");
                save(unlocked); call.resolve(state(unlocked, verified.getString("status")));
            } catch (Exception ignored) { call.reject("Purchase verification is temporarily unavailable. Connect and tap Restore purchases to retry."); }
            finally { if (connection != null) connection.disconnect(); }
        });
    }
    @Override protected void handleOnDestroy() {
        if (billing != null) billing.endConnection(); worker.shutdownNow(); super.handleOnDestroy();
    }
}
