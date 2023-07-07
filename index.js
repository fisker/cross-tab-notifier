const {localStorage, CustomEvent} = window;
const STORAGE_EVENT = 'storage';

const pick = (object, keys) => Object.fromEntries(keys.map(key => object[key]))

class CrossTabNotifier {
  constructor(key) {
    const listeners = new Set();

    const storageEventListener = (event) => {
      const eventData = event instanceof CustomEvent ? event.detail : event;

      const {
        storageArea,
        key
      } = eventData

      if (storageArea !== localStorage || key !== this.key) {
        return;
      }

      const data = pick(eventData, ['oldValue', 'newValue', 'url', 'key'])
      let message
      try {
        message = JSON.parse(data.newValue)
      } catch {}

      for (const listener of this.listeners) {
        listener(message, data);
      }
    };

    this.key = key;
    this.listeners = listeners;
    this.storageEventListener = storageEventListener
    window.addEventListener(STORAGE_EVENT, storageEventListener, false);
  }

  notify(message) {
    const {key} = this;
    const oldValue = localStorage.getItem(key);
    const newValue = JSON.stringify(message);

    // Notify current tab self
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT, {
        detail: {
          newValue,
          oldValue,
          storageArea: localStorage,
          key,
          url: window.location.href
        },
      })
    );

    localStorage.setItem(key, newValue);
  }

  listen(listener) {
    this.listeners.add(listener);
  }

  stop(listener) {
    this.listeners.delete(listener);
  }

  destroy() {
    window.removeEventListener(STORAGE_EVENT, this.storageEventListener, false);
  }
}

export default CrossTabNotifier;
