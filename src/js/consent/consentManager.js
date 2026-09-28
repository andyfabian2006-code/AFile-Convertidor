const CONSENT_KEY = 'afile_cookie_consent';

class ConsentManager {
  constructor() {
    this.status = this.getConsent(); // 'accepted', 'rejected', or null
    this.listeners = [];
  }

  getConsent() {
    return localStorage.getItem(CONSENT_KEY);
  }

  setConsent(status) {
    this.status = status;
    localStorage.setItem(CONSENT_KEY, status);
    this.notifyListeners(status);
  }

  acceptAll() {
    this.setConsent('accepted');
  }

  rejectAll() {
    this.setConsent('rejected');
  }

  isAccepted() {
    return this.status === 'accepted';
  }

  hasResponded() {
    return this.status !== null;
  }

  onChange(callback) {
    this.listeners.push(callback);
    // Disparar inmediatamente si ya hay respuesta
    if (this.hasResponded()) {
      callback(this.status);
    }
  }

  notifyListeners(status) {
    this.listeners.forEach(cb => cb(status));
  }
}

export const consentManager = new ConsentManager();
