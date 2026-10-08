import Capacitor

class FretboardViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StoreBillingPlugin())
    }
}
