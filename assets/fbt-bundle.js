(() => {
  if (window.huuskFbtBundles) { window.huuskFbtBundles(); return; }
  const init = (root) => {
    const form = root.querySelector('[data-fbt-form]');
    if (!form || form.dataset.initialized) return;
    form.dataset.initialized = 'true';

    const rows = [...form.querySelectorAll('[data-fbt-item]')];
    const totalNode = form.querySelector('[data-fbt-total]');
    const originalNode = form.querySelector('[data-fbt-original]');
    const estimateNode = form.querySelector('[data-fbt-estimate]');
    const button = form.querySelector('[data-fbt-submit]');
    const error = form.querySelector('[data-fbt-error]');
    const offerNote = form.querySelector('[data-fbt-offer-note]');

    const formatMoney = (cents) => {
      if (window.Shopify?.formatMoney) return window.Shopify.formatMoney(cents, window.money_format);
      return new Intl.NumberFormat(document.documentElement.lang || 'en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format(cents / 100);
    };

    const selectedVariant = (row) => row.querySelector('.fbt-item__variant');

    const update = () => {
      let total = 0;
      let count = 0;
      const selectedItems = [];
      rows.forEach((row) => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const variant = selectedVariant(row);
        if (!variant) return;
        const option = variant.selectedOptions?.[0] || variant;
        const priceNode = row.querySelector('[data-fbt-price]');
        if (priceNode) priceNode.textContent = formatMoney(Number(option.dataset.price || variant.dataset.price || 0));
        const image = row.querySelector('.fbt-item__image img');
        if (image && option.dataset.imageSrc && image.getAttribute('src') !== option.dataset.imageSrc) {
          image.removeAttribute('srcset');
          image.removeAttribute('sizes');
          image.setAttribute('src', option.dataset.imageSrc);
          image.setAttribute('alt', option.dataset.imageAlt || row.dataset.productTitle || '');
        }
        if (option.dataset.variantUrl) {
          row.querySelectorAll('a.fbt-item__image, a.fbt-item__title').forEach((link) => {
            link.setAttribute('href', option.dataset.variantUrl);
          });
        }
        if (!checkbox?.checked) return;
        const price = Number(option.dataset.price || variant.dataset.price || 0);
        total += price;
        selectedItems.push({ price, eligible: row.dataset.discountEligible === 'true' });
        count += 1;
      });
      const eligibleCount = selectedItems.filter((item) => item.eligible).length;
      const discountPercent = eligibleCount >= 3 ? 15 : eligibleCount === 2 ? 10 : 0;
      const discountedTotal = selectedItems.reduce((sum, item) =>
        sum + window.theme.quantityOfferPrice(item.price, 1, item.eligible ? discountPercent : 0), 0);
      totalNode.textContent = formatMoney(discountedTotal);
      if (originalNode) {
        originalNode.textContent = formatMoney(total);
        originalNode.hidden = discountPercent === 0;
      }
      if (estimateNode) estimateNode.hidden = discountPercent === 0;
      if (offerNote) {
        offerNote.textContent = eligibleCount >= 3 ? offerNote.dataset.threeOffer : eligibleCount === 2 ? offerNote.dataset.twoOffer : '';
        offerNote.hidden = eligibleCount < 2;
      }
      button.disabled = count === 0;
    };

    form.addEventListener('change', update);
    update();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.hidden = true;
      const items = rows.flatMap((row) => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const variant = selectedVariant(row);
        return checkbox?.checked && variant ? [{ id: Number(variant.value), quantity: 1 }] : [];
      });
      if (!items.length) return;

      button.disabled = true;
      const originalLabel = button.textContent;
      button.textContent = 'Adding…';
      try {
        const rootPath = window.Shopify?.routes?.root || '/';
        const response = await fetch(`${rootPath}cart/add.js`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items })
        });
        if (!response.ok) throw new Error('Unable to add the selected products. Please try again.');
        window.location.assign(`${rootPath}cart`);
      } catch (err) {
        error.textContent = err.message || 'Unable to add the selected products. Please try again.';
        error.hidden = false;
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });
  };

  const start = () => document.querySelectorAll('[data-fbt-bundle]').forEach(init);
  window.huuskFbtBundles = start;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  document.addEventListener('shopify:section:load', start);
})();
