// Measure the visible ENQUIRY link and set CSS variable --wedge-start (px from left)
(function () {
  function updateWedge() {
    try {
      const nodes = Array.from(document.querySelectorAll('a[href="/contact"]'));
      if (!nodes.length) return;
      const visible = nodes.filter((n) => n.offsetParent !== null);
      const candidate = visible.length ? visible.reduce((a, b) => (a.getBoundingClientRect().right > b.getBoundingClientRect().right ? a : b)) : nodes[0];
      const rect = candidate.getBoundingClientRect();
      const right = Math.round(rect.right);
      // set as px on root so CSS can use it
      document.documentElement.style.setProperty('--wedge-start', right + 'px');
    } catch (err) {
      // silently fail
      console.warn('wedge update failed', err);
    }
  }

  let resizeTimer = null;
  window.addEventListener('load', updateWedge);
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateWedge, 80);
  });
  // try early
  setTimeout(updateWedge, 100);
})();
