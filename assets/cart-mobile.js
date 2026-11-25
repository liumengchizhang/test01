if (!customElements.get('cart-mobile-carousel')) {
  customElements.define('cart-mobile-carousel', class CartMobileCarousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.cart-mobile-carousel__track');
      this.controls = this.querySelector('.cart-mobile-carousel__controls');
      this.previous = this.querySelector('[data-slide="previous"]');
      this.next = this.querySelector('[data-slide="next"]');

      this.controls.addEventListener('click', this.slide);
      this.track.addEventListener('scroll', this.syncControls, { passive: true });
      this.resizeObserver = new ResizeObserver(this.syncControls);
      this.resizeObserver.observe(this.track);
      this.syncControls();
    }

    disconnectedCallback() {
      this.controls.removeEventListener('click', this.slide);
      this.track.removeEventListener('scroll', this.syncControls);
      this.resizeObserver.disconnect();
    }

    syncControls = () => {
      const maxDistance = this.track.scrollWidth - this.track.clientWidth;
      const distance = Math.abs(this.track.scrollLeft);
      this.controls.hidden = maxDistance < 2;
      this.previous.disabled = distance < 2;
      this.next.disabled = distance >= maxDistance - 1;
    };

    slide = (event) => {
      const button = event.target.closest('button[data-slide]');
      const card = this.track.firstElementChild;
      if (!button || !card) return;

      const trackStyle = getComputedStyle(this.track);
      const width = card.getBoundingClientRect().width + parseFloat(trackStyle.columnGap);
      const direction = trackStyle.direction === 'rtl' ? -1 : 1;
      const step = button === this.next ? 1 : -1;
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.track.scrollBy({ left: width * direction * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
  });
}
