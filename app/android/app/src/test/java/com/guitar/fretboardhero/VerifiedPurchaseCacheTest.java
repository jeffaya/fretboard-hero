package com.guitar.fretboardhero;

import org.junit.Test;
import static org.junit.Assert.*;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.io.IOException;

public class VerifiedPurchaseCacheTest {
    private static final String TOKEN = "valid.google-purchase-token";
    private static class Memory implements VerifiedPurchaseCache.Storage {
        byte[] data; boolean failWrite;
        public byte[] read() { return data; }
        public void write(byte[] value) throws Exception { if (failWrite) throw new IOException("Disk full"); data = value; }
        public void clear() { data = null; }
    }
    private SecretKey key() throws Exception { KeyGenerator generator = KeyGenerator.getInstance("AES"); generator.init(256); return generator.generateKey(); }
    private VerifiedPurchaseCache cache(Memory memory, SecretKey key) { return new VerifiedPurchaseCache("com.guitar.fretboardhero", "full_access", memory, () -> key); }

    @Test public void freshInstallAndPendingPaymentStayLocked() throws Exception {
        Memory memory = new Memory(); VerifiedPurchaseCache cache = cache(memory, key());
        assertNull(cache.token()); cache.accept(TOKEN, "full_access", false, "pending"); assertNull(cache.token());
    }
    @Test public void verifiedPurchaseSurvivesRestartWithoutNetworkOrExpiration() throws Exception {
        Memory memory = new Memory(); SecretKey key = key();
        cache(memory, key).accept(TOKEN, "full_access", true, "purchased");
        assertFalse(new String(memory.data, StandardCharsets.UTF_8).contains(TOKEN));
        // Reopening relies only on the authenticated proof, never a deadline or network.
        assertEquals(TOKEN, cache(memory, key).token());
    }
    @Test public void pendingAndInvalidRepliesPreserveExistingPurchase() throws Exception {
        Memory memory = new Memory(); VerifiedPurchaseCache cache = cache(memory, key());
        cache.accept(TOKEN, "full_access", true, "purchased");
        cache.accept(TOKEN, "full_access", false, "pending"); assertEquals(TOKEN, cache.token());
        for (String status : new String[]{"unavailable", "cancelled", "purchased"}) {
            try { cache.accept(TOKEN, "full_access", false, status); fail("Invalid response accepted"); }
            catch (IllegalArgumentException expected) { assertEquals(TOKEN, cache.token()); }
        }
        try { cache.accept(TOKEN, "other_product", false, "not_owned"); fail("Wrong product accepted"); }
        catch (IllegalArgumentException expected) { assertEquals(TOKEN, cache.token()); }
    }
    @Test public void confirmedRefundRevokesAndRepurchaseRestores() throws Exception {
        Memory memory = new Memory(); VerifiedPurchaseCache cache = cache(memory, key());
        cache.accept(TOKEN, "full_access", true, "purchased");
        cache.accept(TOKEN, "full_access", false, "not_owned"); assertNull(cache.token());
        cache.accept("new.google-purchase-token", "full_access", true, "purchased"); assertEquals("new.google-purchase-token", cache.token());
    }
    @Test public void tamperingOrCopyingProofAcrossPackagesProductsAndDevicesNeverUnlocks() throws Exception {
        Memory memory = new Memory(); SecretKey key = key(); VerifiedPurchaseCache cache = cache(memory, key);
        cache.accept(TOKEN, "full_access", true, "purchased");
        assertNull(new VerifiedPurchaseCache("other.app", "full_access", memory, () -> key).token());
        assertNull(new VerifiedPurchaseCache("com.guitar.fretboardhero", "other_product", memory, () -> key).token());
        assertNull(cache(memory, key()).token());
        memory.data[memory.data.length - 1] ^= 1; assertNull(cache.token());
        memory.data = "{\"unlocked\":true}".getBytes(StandardCharsets.UTF_8); assertNull(cache.token());
    }
    @Test public void failedWriteDoesNotDestroyEarlierVerifiedPurchase() throws Exception {
        Memory memory = new Memory(); SecretKey key = key(); VerifiedPurchaseCache cache = cache(memory, key);
        cache.accept(TOKEN, "full_access", true, "purchased"); memory.failWrite = true;
        try { cache.accept("new.google-purchase-token", "full_access", true, "purchased"); fail("Write should fail"); }
        catch (IOException expected) { assertEquals(TOKEN, cache(memory, key).token()); }
    }
}
