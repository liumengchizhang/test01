(() => {
  if (window.huuskQuantityOffers) { window.huuskQuantityOffers(); return; }
  const init = (root) => {
    if (root.dataset.initialized) return;
    const options = [...root.querySelectorAll('[data-quantity-offer]')];
    const productForm = document.getElementById(root.dataset.productFormId);
    const quantityInput = productForm?.querySelector('input[name="quantity"]');
    if (!quantityInput) return;
    root.dataset.initialized = 'true';

    const quantityControl = quantityInput.closest('.product-form__quantity');
    if (quantityControl) quantityControl.hidden = true;

    const money = (cents) => {
      if (window.Shopify?.formatMoney) return window.Shopify.formatMoney(cents, window.money_format);
      return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format(cents / 100);
    };

    const renderPrices = (unitPrice, comparePrice = 0) => {
      root.dataset.unitPrice = unitPrice;
      root.dataset.comparePrice = comparePrice;
      options.forEach((option) => {
        const quantity = Number(option.dataset.quantity);
        const subtotal = unitPrice * quantity;
        const discount = Math.min(100, Math.max(0, Number(option.dataset.discountPercent) || 0));
        const price = window.theme.quantityOfferPrice(unitPrice, quantity, discount);
        const compare = discount > 0 ? subtotal : comparePrice * quantity;
        option.querySelector('[data-tier-price]').textContent = money(price);
        const compareNode = option.querySelector('[data-tier-compare]');
        compareNode.textContent = money(compare);
        compareNode.hidden = !(compare > price);
      });
    };

    const updateAvailability = (variant = {}) => {
      const rule = variant.quantity_rule || {};
      const min = Number(rule.min ?? root.dataset.min ?? 1);
      let max = rule.max == null ? (root.dataset.max ? Number(root.dataset.max) : Infinity) : Number(rule.max);
      const inventoryManaged = variant.inventory_management ?? root.dataset.inventoryManaged;
      const inventoryPolicy = variant.inventory_policy ?? root.dataset.inventoryPolicy;
      const inventory = Number(variant.inventory_quantity ?? root.dataset.inventory ?? 0);
      if (inventoryManaged === 'shopify' && inventoryPolicy === 'deny') max = Math.min(max, inventory);
      const step = Number(rule.increment ?? root.dataset.step ?? 1) || 1;
      options.forEach((option) => {
        const quantity = Number(option.dataset.quantity);
        const unavailable = quantity < min || quantity > max || (quantity - min) % step !== 0;
        option.querySelector('input[type="radio"]').disabled = unavailable;
        option.classList.toggle('is-unavailable', unavailable);
      });
    };

    const setQuantity = (option) => {
      const quantity = Number(option.dataset.quantity);
      quantityInput.value = String(quantity);
      quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
      quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      options.forEach((card) => {
        const selected = card === option;
        card.classList.toggle('is-selected', selected);
        card.querySelector('input[type="radio"]').checked = selected;
      });
    };

    root.addEventListener('change', (event) => {
      const option = event.target.closest('[data-quantity-offer]');
      if (option) setQuantity(option);
    });

    const selected = options.find((option) => option.querySelector('input[type="radio"]').checked) || options[0];
    updateAvailability();
    const initialSelection = selected && !selected.querySelector('input[type="radio"]').disabled
      ? selected
      : options.find((option) => !option.querySelector('input[type="radio"]').disabled);
    if (initialSelection) setQuantity(initialSelection);

    document.addEventListener('variant:update', (event) => {
      const detail = event.detail || {};
      const variant = detail.resource;
      const productId = detail.data?.productId;
      if (!root.isConnected || !variant || (productId && String(productId) !== String(root.dataset.productId))) return;
      const fresh = detail.data?.html?.querySelector(`[data-quantity-offers][data-product-form-id="${root.dataset.productFormId}"]`);
      if (fresh) ['min', 'max', 'step', 'inventory', 'inventoryManaged', 'inventoryPolicy'].forEach((key) => { root.dataset[key] = fresh.dataset[key] || ''; });
      renderPrices(Number(variant.price || 0), Number(variant.compare_at_price || 0));
      quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      updateAvailability(variant);
      const active = options.find((option) => option.querySelector('input[type="radio"]').checked);
      if (active?.querySelector('input[type="radio"]').disabled) {
        const next = options.find((option) => !option.querySelector('input[type="radio"]').disabled);
        if (next) setQuantity(next);
      }
    });
  };

  const start = () => document.querySelectorAll('[data-quantity-offers]').forEach(init);
  window.huuskQuantityOffers = start;
  ['shopify:section:load', 'product-info:loaded'].forEach((event) => document.addEventListener(event, start));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
