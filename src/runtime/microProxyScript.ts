/**
 * Injected Micro-Proxy Script
 * Lightweight (~35-line) event delegation bus injected into the sandboxed iframe's <head>.
 * Intercepts all clicks and form submissions and relays them to the host window via postMessage.
 * Also receives DOM manipulation commands from the host.
 */

export const MICRO_PROXY_SOURCE = `
(function () {
  'use strict';

  function serializeEvent(e, eventType) {
    var el = e.target.closest('button, a, input, select, form, [data-action]');
    if (!el) return null;

    // Collect nearest context container for LLM comprehension
    var parentSection = el.closest('section, article, div[id], [data-card]') || el.parentElement;
    var contextSnippet = parentSection ? parentSection.outerHTML.slice(0, 450) : '';

    var form = el.closest('form');
    var formData = null;
    if (form) {
      formData = {};
      try {
        new FormData(form).forEach(function (value, key) {
          formData[key] = value;
        });
      } catch (err) {}
    }

    return {
      eventType: eventType,
      tagName: el.tagName,
      id: el.id || null,
      className: el.className || null,
      text: (el.innerText || el.value || '').trim().slice(0, 120),
      action: el.getAttribute('data-action') || null,
      target: el.getAttribute('data-target') || null,
      href: el.getAttribute('href') || null,
      formData: formData && Object.keys(formData).length > 0 ? formData : null,
      contextSnippet: contextSnippet
    };
  }

  // Intercept Clicks
  document.addEventListener('click', function (e) {
    var payload = serializeEvent(e, 'click');
    if (!payload) return;

    // Prevent default jump for internal hash navigation or dummy links
    if (payload.tagName === 'A' && payload.href && (payload.href.startsWith('#') || payload.href.startsWith('javascript:'))) {
      e.preventDefault();
    }

    window.parent.postMessage({ type: 'UI_EVENT', payload: payload }, '*');
  }, true);

  // Intercept Form Submissions
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = serializeEvent(e, 'submit');
    if (payload) {
      window.parent.postMessage({ type: 'UI_EVENT', payload: payload }, '*');
    }
  }, true);

  // Handle messages dispatched from Host Shell
  window.addEventListener('message', function (e) {
    var data = e.data;
    if (!data || !data.type) return;

    if (data.type === 'REPLACE_ROOT_HTML') {
      var root = document.getElementById('app-root');
      if (root) {
        root.innerHTML = data.html;
      } else {
        document.body.innerHTML = '<div id="app-root">' + data.html + '</div>';
      }
    } else if (data.type === 'PATCH_ELEMENT') {
      var selector = data.selector;
      var newHtml = data.newHtml;
      var target = document.querySelector(selector);
      if (target) {
        // Smooth cross-fade visual swap
        target.style.transition = 'opacity 150ms ease';
        target.style.opacity = '0.3';
        setTimeout(function () {
          var temp = document.createElement('div');
          temp.innerHTML = newHtml;
          var newElem = temp.firstElementChild;
          if (newElem && target.parentNode) {
            target.parentNode.replaceChild(newElem, target);
            newElem.style.opacity = '0';
            newElem.style.transition = 'opacity 200ms ease';
            requestAnimationFrame(function () {
              newElem.style.opacity = '1';
            });
          } else {
            target.outerHTML = newHtml;
          }
        }, 80);
      } else {
        // Fallback: If target was an overlay/modal not yet present, append to body
        var temp = document.createElement('div');
        temp.innerHTML = newHtml;
        var el = temp.firstElementChild;
        if (el) {
          el.classList.remove('hidden');
          document.body.appendChild(el);
        }
      }
    } else if (data.type === 'TOGGLE_CLASS') {
      var targets = document.querySelectorAll(data.selector);
      targets.forEach(function (t) {
        t.classList.toggle(data.className);
      });
    } else if (data.type === 'APPEND_STREAM_CHUNK') {
      var root = document.getElementById('app-root');
      if (root) {
        root.insertAdjacentHTML('beforeend', data.chunk);
      }
    }
  });

  // Notify parent window that sandboxed runtime is ready
  window.parent.postMessage({ type: 'IFRAME_READY', timestamp: Date.now() }, '*');
})();
`;
