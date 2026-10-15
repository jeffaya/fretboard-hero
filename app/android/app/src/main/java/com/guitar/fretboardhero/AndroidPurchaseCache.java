package com.guitar.fretboardhero;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.KeyStore;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

/** Device-bound, authenticated storage excluded from Android backup/transfer. */
final class AndroidPurchaseCache {
    static VerifiedPurchaseCache create(Context context, String product) {
        AtomicFile file = new AtomicFile(new File(context.getNoBackupFilesDir(), "play-purchase-v1.bin"));
        VerifiedPurchaseCache.Storage storage = new VerifiedPurchaseCache.Storage() {
            public byte[] read() throws Exception {
                try (FileInputStream input = file.openRead()) {
                    ByteArrayOutputStream data = new ByteArrayOutputStream();
                    byte[] buffer = new byte[1024]; int count;
                    while ((count = input.read(buffer)) != -1) {
                        if (data.size() + count > 4096) throw new IOException("Invalid purchase cache");
                        data.write(buffer, 0, count);
                    }
                    return data.toByteArray();
                } catch (java.io.FileNotFoundException missing) { return null; }
            }
            public void write(byte[] value) throws Exception {
                FileOutputStream output = null;
                try { output = file.startWrite(); output.write(value); file.finishWrite(output); }
                catch (Exception error) { if (output != null) file.failWrite(output); throw error; }
            }
            public void clear() throws Exception {
                file.delete();
                if (file.getBaseFile().exists()) throw new IOException("Purchase cache removal failed");
            }
        };
        return new VerifiedPurchaseCache(context.getPackageName(), product, storage, () -> {
            KeyStore keys = KeyStore.getInstance("AndroidKeyStore"); keys.load(null);
            String alias = "fretboard-play-purchase-v1";
            if (keys.containsAlias(alias)) return (SecretKey) keys.getKey(alias, null);
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setKeySize(256).build());
            return generator.generateKey();
        });
    }
}
