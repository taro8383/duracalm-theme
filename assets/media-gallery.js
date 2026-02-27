if (!customElements.get('media-gallery')) {
  customElements.define('media-gallery', class MediaGallery extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        liveRegion: this.querySelector('[id^="GalleryStatus"]'),
        viewer: this.querySelector('[id^="GalleryViewer"]'),
        thumbnails: this.querySelector('[id^="GalleryThumbnails"]')
      }
      this.mql = window.matchMedia('(min-width: 750px)');
      this.productInfo = document.getElementById(`ProductInfo-${this.dataset.section}`);
      this.prependMedia = this.dataset.disablePrepend != 'true';
      if (this.productInfo && Shopify.postLinksRetry) this.productInfo.initShareLinks();
      this.filteringOption = this.dataset.filteringOption;
      if (!this.elements.thumbnails) return;

      this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
      this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
        mediaToSwitch.querySelector('button').addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
      });
      if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();

      // Initialize autoplay
      this.initAutoplay();
    }

    initAutoplay() {
      // Check if autoplay is enabled via data attribute
      this.autoplayEnabled = this.dataset.autoplay === 'true';
      this.autoplayDelay = parseInt(this.dataset.autoplayDelay) || 4000;
      this.pauseOnHover = this.dataset.autoplayPauseHover !== 'false';
      this.autoplayTimer = null;
      this.isPaused = false;
      this.touchStartX = 0;
      this.touchEndX = 0;

      if (this.autoplayEnabled) {
        this.startAutoplay();

        // Pause on hover (desktop)
        if (this.pauseOnHover) {
          this.addEventListener('mouseenter', () => this.pauseAutoplay());
          this.addEventListener('mouseleave', () => this.resumeAutoplay());
        }

        // Touch events (mobile) - pause when user touches the gallery
        this.addEventListener('touchstart', (e) => {
          this.touchStartX = e.changedTouches[0].screenX;
          this.pauseAutoplay();
        }, { passive: true });

        this.addEventListener('touchend', (e) => {
          this.touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe();
          // Resume after a delay
          setTimeout(() => this.resumeAutoplay(), 1000);
        }, { passive: true });

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.pauseAutoplay();
          } else {
            this.resumeAutoplay();
          }
        });

        // Pause when modal is open
        document.addEventListener('productModalOpened', () => this.pauseAutoplay());
        document.addEventListener('productModalClosed', () => this.resumeAutoplay());

        // Pause on focus for accessibility
        this.addEventListener('focusin', () => this.pauseAutoplay());
        this.addEventListener('focusout', () => this.resumeAutoplay());
      }
    }

    handleSwipe() {
      const swipeThreshold = 50;
      const diff = this.touchStartX - this.touchEndX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swiped left - next slide
          this.nextSlide();
        } else {
          // Swiped right - previous slide
          this.previousSlide();
        }
      }
    }

    startAutoplay() {
      if (!this.autoplayEnabled || this.isPaused) return;

      this.stopAutoplay();
      this.autoplayTimer = setInterval(() => {
        this.nextSlide();
      }, this.autoplayDelay);
    }

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    }

    pauseAutoplay() {
      this.stopAutoplay();
      this.isPaused = true;
    }

    resumeAutoplay() {
      this.isPaused = false;
      this.startAutoplay();
    }

    nextSlide() {
      const slides = this.elements.viewer.querySelectorAll('.product__media-item[data-media-id]');
      if (slides.length <= 1) return;

      const activeSlide = this.elements.viewer.querySelector('.product__media-item.is-active');
      if (!activeSlide) return;

      const currentIndex = Array.from(slides).indexOf(activeSlide);
      const nextIndex = (currentIndex + 1) % slides.length;
      const nextSlide = slides[nextIndex];

      if (nextSlide) {
        const mediaId = nextSlide.dataset.mediaId;
        this.setActiveMedia(mediaId, false);

        // Update the slider if it exists
        if (this.elements.viewer.slider) {
          this.elements.viewer.slider.scrollTo({
            left: nextSlide.offsetLeft,
            behavior: 'smooth'
          });
        }
      }
    }

    previousSlide() {
      const slides = this.elements.viewer.querySelectorAll('.product__media-item[data-media-id]');
      if (slides.length <= 1) return;

      const activeSlide = this.elements.viewer.querySelector('.product__media-item.is-active');
      if (!activeSlide) return;

      const currentIndex = Array.from(slides).indexOf(activeSlide);
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      const prevSlide = slides[prevIndex];

      if (prevSlide) {
        const mediaId = prevSlide.dataset.mediaId;
        this.setActiveMedia(mediaId, false);

        if (this.elements.viewer.slider) {
          this.elements.viewer.slider.scrollTo({
            left: prevSlide.offsetLeft,
            behavior: 'smooth'
          });
        }
      }
    }

    disconnectedCallback() {
      this.stopAutoplay();
    }

    onSlideChanged(event) {
      const thumbnail = this.elements.thumbnails.querySelector(`[data-target="${ event.detail.currentElement.dataset.mediaId }"]`);
      this.setActiveThumbnail(thumbnail);
    }

    setActiveMedia(mediaId, prepend, filtering = false, currentVariant = null) {
      if (filtering && currentVariant) {
        const allSlides = this.querySelectorAll('.product__media-item, .thumbnail-list__item, .slider-counter__link');
        allSlides.forEach(slide => {
          if (slide.dataset.alt === currentVariant[this.filteringOption] || slide.dataset.alt === 'always_display') {
            slide.classList.remove('hidden');
          } else {
            slide.classList.add('hidden');
          }
        })
      }

      const activeMedia = this.elements.viewer.querySelector(`[data-media-id="${ mediaId }"]`);
      this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
        element.classList.remove('is-active');
      });
      activeMedia.classList.add('is-active');

      if (prepend && this.prependMedia) {
        activeMedia.parentElement.prepend(activeMedia);
        if (this.elements.thumbnails) {
          const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${ mediaId }"]`);
          activeThumbnail.parentElement.prepend(activeThumbnail);
        }
        if (this.elements.viewer.slider) this.elements.viewer.resetPages();
      }

      this.preventStickyHeader();
      window.setTimeout(() => {
        if (this.elements.thumbnails) {
          activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
        }
        if (!this.elements.thumbnails || this.dataset.desktopLayout === 'stacked') {
          activeMedia.scrollIntoView({behavior: 'smooth'});
        }
      });
      this.playActiveMedia(activeMedia);

      if (filtering && currentVariant) {
        if (this.elements.viewer && this.elements.viewer.initPages) this.elements.viewer.initPages();
        if (this.elements.viewer && this.elements.viewer.update) this.elements.viewer.update();
      }

      if (!this.elements.thumbnails) return;
      const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${ mediaId }"]`);
      this.setActiveThumbnail(activeThumbnail);
      this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
    }

    setActiveThumbnail(thumbnail) {
      if (!this.elements.thumbnails || !thumbnail) return;

      this.elements.thumbnails.querySelectorAll('button').forEach((element) => element.removeAttribute('aria-current'));
      thumbnail.querySelector('button').setAttribute('aria-current', true);
      if (this.elements.thumbnails.isSlideVisible(thumbnail, false, 10, true)) return;

      if (this.elements.thumbnails.vertical) {
        console.log('setActiveThumbnail')
        this.elements.thumbnails.slider.scrollTo({ top: thumbnail.offsetTop });
      } else {
        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }
    }

    announceLiveRegion(activeItem, position) {
      const image = activeItem.querySelector('.product__modal-opener--image img');
      if (!image) return;
      image.onload = () => {
        this.elements.liveRegion.setAttribute('aria-hidden', false);
        this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace(
          '[index]',
          position
        );
        setTimeout(() => {
          this.elements.liveRegion.setAttribute('aria-hidden', true);
        }, 2000);
      };
      image.src = image.src;
    }

    playActiveMedia(activeItem) {
      window.pauseAllMedia();
      const deferredMedia = activeItem.querySelector('.deferred-media');
      if (deferredMedia) deferredMedia.loadContent(false);
    }

    preventStickyHeader() {
      this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
      if (!this.stickyHeader) return;
      this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
    }

    removeListSemantic() {
      if (!this.elements.viewer.slider) return;
      this.elements.viewer.slider.setAttribute('role', 'presentation');
      this.elements.viewer.sliderItems.forEach(slide => slide.setAttribute('role', 'presentation'));
    }
  });
}
