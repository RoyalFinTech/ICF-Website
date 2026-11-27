/* ICF Gambia hero carousel — independent of the larger homepage application. */
(function () {
  'use strict';

  var current = 0;
  var timer = null;
  var intervalMs = 5000;

  function getSlides() {
    return Array.prototype.slice.call(document.querySelectorAll('.icf-hero-slide'));
  }

  function getDots() {
    return Array.prototype.slice.call(document.querySelectorAll('.icf-hero-dots button'));
  }

  function homeIsVisible() {
    var home = document.getElementById('page-home');
    return !!home && home.classList.contains('active');
  }

  function go(index) {
    var slides = getSlides();
    var dots = getDots();
    if (!slides.length) return;
    current = ((Number(index) || 0) % slides.length + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === current);
      slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
      if (i === current) {
        var image = slide.querySelector('img[data-src]');
        if (image) {
          var source = image.getAttribute('data-src');
          if (source) { image.src = source; image.removeAttribute('data-src'); }
        }
      }
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function start() {
    if (!homeIsVisible()) {
      stop();
      return false;
    }
    var slides = getSlides();
    if (slides.length < 2) return false;
    if (timer) return true;

    var activeIndex = slides.findIndex(function (slide) {
      return slide.classList.contains('active');
    });
    current = activeIndex >= 0 ? activeIndex : 0;
    go(current);

    timer = window.setInterval(function () {
      if (document.hidden) return;
      if (!homeIsVisible()) {
        stop();
        return;
      }
      go(current + 1);
    }, intervalMs);
    return true;
  }

  function move(step) {
    if (!homeIsVisible()) return;
    go(current + (Number(step) || 0));
    stop();
    start();
  }

  function pauseOnInteraction() {
    var slider = document.getElementById('icf-hero-slider');
    if (!slider || slider.dataset.icfPauseBound === '1') return;
    slider.dataset.icfPauseBound = '1';
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', function (event) {
      if (!slider.contains(event.relatedTarget)) start();
    });
  }

  window.ICFHeroSlider = {
    go: go,
    move: move,
    start: start,
    stop: stop,
    get index() { return current; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    pauseOnInteraction();
    start();
  }, { once: true });

  window.addEventListener('pageshow', function () {
    if (homeIsVisible()) start();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && homeIsVisible()) start();
  });
})();
