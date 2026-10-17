# Capacitor supplies consumer rules keeping Plugin subclasses, their constructors,
# PluginMethod entry points and permission/activity callbacks. This includes our
# PlayBillingPlugin and plugins loaded by name from capacitor.plugins.json.

# Retain source locations and runtime annotations used by the native bridge.
-keepattributes SourceFile,LineNumberTable,RuntimeVisibleAnnotations,AnnotationDefault

# JavaScript calls these methods by name, outside R8's Java call graph.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
