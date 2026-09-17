/**
 * Legacy component loader (kept as a no-op for backward compatibility).
 *
 * Header/footer and content blocks are now rendered server-side by WordPress,
 * so client-side HTML injection is no longer used. This export is kept so any
 * existing imports of `injectComponents` keep resolving without errors.
 */

export async function injectComponents() {
    return;
}
