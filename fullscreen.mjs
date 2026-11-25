const view = document.querySelector('.play-view');

if (view) {
  const toolbar = view.querySelector('.play-view-toolbar');
  const button = toolbar.querySelector('button');
  const canvas = view.querySelector('canvas');
  let expanded = false;

  function fitStage() {
    if (canvas.width && canvas.height) {
      view.style.setProperty('--stage-ratio', canvas.width / canvas.height);
    }
  }

  function sync() {
    const active = expanded || document.fullscreenElement === view;
    view.classList.toggle('play-view-active', active);
    view.classList.toggle('play-view-overlay', expanded);
    document.documentElement.classList.toggle('play-view-locked', expanded);
    button.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
  }

  function closeOverlay() {
    expanded = false;
    sync();
    button.focus({ preventScroll: true });
  }

  button.addEventListener('click', async () => {
    if (expanded) {
      closeOverlay();
      return;
    }
    if (document.fullscreenElement === view) {
      await document.exitFullscreen();
      return;
    }
    fitStage();
    if (document.fullscreenEnabled && view.requestFullscreen) {
      button.disabled = true;
      try {
        await view.requestFullscreen();
        sync();
        return;
      } catch {
        // Use the available browser viewport when element fullscreen is blocked.
      } finally {
        button.disabled = false;
        button.focus({ preventScroll: true });
      }
    }
    expanded = true;
    sync();
  });

  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('keydown', event => {
    if (expanded && event.key === 'Escape') {
      event.preventDefault();
      closeOverlay();
    }
  });
  window.addEventListener('pagehide', () => {
    if (expanded) {
      expanded = false;
      sync();
    }
  });
  new MutationObserver(fitStage).observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });
  toolbar.hidden = false;
}
