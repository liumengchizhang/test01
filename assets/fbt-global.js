(() => {
  if (window.huuskFbtGlobal) {
    window.huuskFbtGlobal.mount();
    return;
  }

  let registry;
  let bundle;
  let scheduled = false;

  const mount = () => {
    scheduled = false;
    const nextRegistry = document.querySelector('[data-fbt-global-registry]');
    if (nextRegistry !== registry) {
      bundle?.remove();
      registry = nextRegistry;
      bundle = registry?.querySelector('[data-fbt-bundle]') || null;
    }
    const slots = [...document.querySelectorAll('[data-fbt-global-slot]')];
    const target = slots.find((slot) => slot.dataset.productId === registry?.dataset.productId);
    slots.forEach((slot) => { slot.hidden = slot !== target || !bundle; });
    if (!bundle || !registry) return;
    if (target) {
      if (bundle.parentElement !== target) target.replaceChildren(bundle);
    } else if (bundle.parentElement !== registry) {
      registry.append(bundle);
    }
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(mount);
  };

  window.huuskFbtGlobal = { mount: schedule };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  ['shopify:section:load', 'shopify:section:unload', 'shopify:section:reorder', 'shopify:block:select', 'product-info:loaded'].forEach((event) => {
    document.addEventListener(event, schedule);
  });
})();
