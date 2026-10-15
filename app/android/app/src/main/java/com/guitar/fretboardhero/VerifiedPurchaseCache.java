package com.guitar.fretboardhero;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Stores only server-verified permanent purchases. No clock-based expiration. */
final class VerifiedPurchaseCache {
    interface Storage {
        byte[] read() throws Exception;
        void write(byte[] value) throws Exception;
        void clear() throws Exception;
    }
    interface Keys { SecretKey get() throws Exception; }
    private final Storage storage;
    private final Keys keys;
    private final String product;
    private final byte[] scope;

    VerifiedPurchaseCache(String packageName, String product, Storage storage, Keys keys) {
        this.storage = storage; this.keys = keys; this.product = product;
        scope = (packageName + ":" + product + ":v1").getBytes(StandardCharsets.UTF_8);
    }

    String token() throws Exception {
        byte[] data = storage.read();
        if (data == null) return null;
        if (data.length < 30 || data.length > 4096 || data[0] != 1) return null;
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, keys.get(), new GCMParameterSpec(128, Arrays.copyOfRange(data, 1, 13)));
        cipher.updateAAD(scope);
        try {
            String token = new String(cipher.doFinal(data, 13, data.length - 13), StandardCharsets.UTF_8);
            return validToken(token) ? token : null;
        } catch (javax.crypto.AEADBadTagException invalid) { return null; }
    }

    // Called only after HTTPS verification. Pending, outages and malformed replies
    // must never clear an earlier verified purchase or create a new entitlement.
    void accept(String token, String responseProduct, boolean unlocked, String status) throws Exception {
        if (!product.equals(responseProduct) || !validToken(token)) throw new IllegalArgumentException("Invalid purchase proof");
        if (!unlocked && "pending".equals(status)) return;
        if (!unlocked && "not_owned".equals(status)) { storage.clear(); return; }
        if (!unlocked || !"purchased".equals(status)) throw new IllegalArgumentException("Invalid verification status");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, keys.get());
        cipher.updateAAD(scope);
        byte[] encrypted = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
        byte[] data = new byte[13 + encrypted.length];
        data[0] = 1;
        System.arraycopy(cipher.getIV(), 0, data, 1, 12);
        System.arraycopy(encrypted, 0, data, 13, encrypted.length);
        storage.write(data);
    }

    private static boolean validToken(String token) { return token != null && token.matches("[A-Za-z0-9._~-]{10,2048}"); }
}
