/**
 * Scroll-Triggered Animations
 * Adds micro-interactions to elements as they enter the viewport
 */

(function() {
  'use strict';

  // Animation configuration
  const config = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
    once: true
  };

  // Animation types
  const animations = {
    'fade-up': {
      initial: { opacity: '0', transform: 'translateY(30px)' },
      final: { opacity: '1', transform: 'translateY(0)' }
    },
    'fade-in': {
      initial: { opacity: '0' },
      final: { opacity: '1' }
    },
    'scale-up': {
      initial: { opacity: '0', transform: 'scale(0.8)' },
      final: { opacity: '1', transform: 'scale(1)' }
    },
    'slide-left': {
      initial: { opacity: '0', transform: 'translateX(-30px)' },
      final: { opacity: '1', transform: 'translateX(0)' }
    },
    'slide-right': {
      initial: { opacity: '0', transform: 'translateX(30px)' },
      final: { opacity: '1', transform: 'translateX(0)' }
    }
  };

  // Apply initial styles
  function applyInitialStyles(element, animationType) {
    const anim = animations[animationType] || animations['fade-up'];
    Object.assign(element.style, anim.initial);
    element.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.willChange = 'opacity, transform';
  }

  // Apply final styles
  function applyFinalStyles(element, animationType) {
    const anim = animations[animationType] || animations['fade-up'];
    Object.assign(element.style, anim.final);
    element.style.willChange = 'auto';
  }

  // Initialize scroll animations
  function initScrollAnimations() {
    // Find all elements with scroll animation data attributes
    const animatedElements = document.querySelectorAll('[data-scroll-animate]');

    if (animatedElements.length === 0) return;

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationType = element.dataset.scrollAnimate;
          const delay = parseInt(element.dataset.scrollDelay || '0', 10);

          // Apply final styles with optional delay
          setTimeout(() => {
            applyFinalStyles(element, animationType);
            element.classList.add('scroll-animated');
          }, delay);

          // Unobserve if animation should only happen once
          if (config.once) {
            observer.unobserve(element);
          }
        }
      });
    }, {
      threshold: config.threshold,
      rootMargin: config.rootMargin
    });

    // Apply initial styles and observe each element
    animatedElements.forEach(element => {
      const animationType = element.dataset.scrollAnimate;
      applyInitialStyles(element, animationType);
      observer.observe(element);
    });
  }

  // Stagger animations for child elements
  function initStaggerAnimations() {
    const staggerContainers = document.querySelectorAll('[data-stagger-children]');

    staggerContainers.forEach(container => {
      const children = container.children;
      const baseDelay = parseInt(container.dataset.staggerDelay || '100', 10);
      const animationType = container.dataset.staggerAnimate || 'fade-up';

      Array.from(children).forEach((child, index) => {
        child.dataset.scrollAnimate = animationType;
        child.dataset.scrollDelay = (index * baseDelay).toString();
      });
    });
  }

  // Icon scale animation on scroll
  function initIconAnimations() {
    const iconContainers = document.querySelectorAll('[data-animate-icons]');

    iconContainers.forEach(container => {
      const icons = container.querySelectorAll('.material-symbols-rounded, .icon-anchor__icon, .icon-bar-card__icon');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            icons.forEach((icon, index) => {
              icon.style.transform = 'scale(0.8)';
              icon.style.opacity = '0';
              icon.style.transition = `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 100}ms`;

              setTimeout(() => {
                icon.style.transform = 'scale(1)';
                icon.style.opacity = '1';
              }, 50 + (index * 100));
            });

            observer.unobserve(container);
          }
        });
      }, { threshold: 0.2 });

      observer.observe(container);
    });
  }

  // Text reveal animation
  function initTextRevealAnimations() {
    const textElements = document.querySelectorAll('[data-text-reveal]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          element.style.opacity = '0';
          element.style.transform = 'translateY(20px)';
          element.style.transition = 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';

          setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          }, 100);

          observer.unobserve(element);
        }
      });
    }, { threshold: 0.15 });

    textElements.forEach(el => observer.observe(el));
  }

  // Parallax effect for images
  function initParallaxImages() {
    const parallaxImages = document.querySelectorAll('[data-parallax]');

    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        parallaxImages.forEach(img => {
          const rect = img.getBoundingClientRect();
          const speed = parseFloat(img.dataset.parallax) || 0.5;
          const yPos = (rect.top - window.innerHeight) * speed * -0.1;
          img.style.transform = `translateY(${yPos}px)`;
        });
      });
    }, { passive: true });
  }

  // Initialize all animations
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initStaggerAnimations();
        initScrollAnimations();
        initIconAnimations();
        initTextRevealAnimations();
        initParallaxImages();
      });
    } else {
      initStaggerAnimations();
      initScrollAnimations();
      initIconAnimations();
      initTextRevealAnimations();
      initParallaxImages();
    }
  }

  // Run initialization
  init();

  // Re-initialize on Shopify section reload
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', () => {
      initStaggerAnimations();
      initScrollAnimations();
      initIconAnimations();
      initTextRevealAnimations();
    });
  }
})();
