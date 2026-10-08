import Foundation
import Capacitor
import StoreKit

/// StoreKit verifies Apple's signed transactions for the installed app.
/// The selected instrument never participates in entitlement lookup.
@objc(StoreBillingPlugin)
public class StoreBillingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreBillingPlugin"
    public let jsName = "StoreBilling"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "cachedState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "refresh", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "price", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise)
    ]
    private let productID = "full_access"
    private var updatesTask: Task<Void, Never>?
    private var purchasing = false

    public override func load() {
        updatesTask = Task { @MainActor [weak self] in
            for await result in StoreKit.Transaction.updates {
                guard let self = self else { return }
                guard case .verified(let transaction) = result,
                      transaction.productID == self.productID,
                      transaction.productType == .nonConsumable else { continue }
                // Entitlement is derived from currentEntitlements, never from an event alone.
                await transaction.finish()
                self.notifyListeners("purchasesChanged", data: [:], retainUntilConsumed: true)
            }
        }
    }

    deinit { updatesTask?.cancel() }

    private func entitlement() async -> Bool {
        for await result in StoreKit.Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            if transaction.productID == productID && transaction.productType == .nonConsumable &&
                transaction.revocationDate == nil && !transaction.isUpgraded {
                return true
            }
        }
        return false
    }

    private func resolveState(_ call: CAPPluginCall, status: String? = nil) async {
        let owned = await entitlement()
        call.resolve(["unlocked": owned, "status": status ?? (owned ? "purchased" : "not_owned")])
    }

    @objc func cachedState(_ call: CAPPluginCall) {
        Task { await resolveState(call) }
    }

    // Silent launch/resume check. AppStore.sync is reserved for a user restore action.
    @objc func refresh(_ call: CAPPluginCall) {
        Task { await resolveState(call) }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                try await AppStore.sync()
                await resolveState(call)
            } catch {
                call.reject("Could not restore purchases. Check your App Store account and connection, then try again.")
            }
        }
    }

    private func product() async throws -> Product {
        guard let product = try await Product.products(for: [productID]).first,
              product.id == productID, product.type == .nonConsumable else {
            throw BillingError.unavailable
        }
        return product
    }

    @objc func price(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(["price": try await product().displayPrice]) }
            catch { call.reject("Unlock is not available in the App Store yet. Please try again later.") }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard !purchasing else { call.reject("A purchase is already in progress."); return }
            purchasing = true
            defer { purchasing = false }
            do {
                guard AppStore.canMakePayments else {
                    call.reject("Purchases are disabled on this device."); return
                }
                let item = try await product()
                switch try await item.purchase() {
                case .success(let result):
                    guard case .verified(let transaction) = result,
                          transaction.productID == productID,
                          transaction.productType == .nonConsumable else {
                        call.reject("Apple could not verify this purchase. Please restore purchases to retry."); return
                    }
                    await transaction.finish()
                    await resolveState(call)
                case .pending:
                    await resolveState(call, status: "pending")
                case .userCancelled:
                    await resolveState(call, status: "cancelled")
                @unknown default:
                    call.reject("Purchase status is unavailable. Please restore purchases to check again.")
                }
            } catch {
                call.reject("Payment could not be completed. Please try again or restore purchases.")
            }
        }
    }

    private enum BillingError: Error { case unavailable }
}
