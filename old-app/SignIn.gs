// Sign-in for the State 1458 Events app, with a Google account.
// This file is its own Apps Script project (not part of the calendar's project). It runs as the person who opens it,
// reads only their Google email, and sends them back to the calendar with a signed note the calendar checks.
//
// Setup (once):
// 1. In the calendar's project, run showSignInSetup; the log shows the secret. Paste it below as SIGN_IN_SECRET.
// 2. Paste the calendar's link below as MAIN_APP_URL: in the calendar's project, Deploy → Manage deployments → Web app URL.
//    It looks like https://script.google.com/macros/s/…/exec (not the /dev test link, not the editor's link).
// 3. Project Settings → tick "Show appsscript.json"; replace that file with the one given with this file.
// 4. Deploy → New deployment → Web app: Execute as "User accessing the web app", Who has access "Anyone with Google
//    account". Copy its link and paste it in the calendar: Admin → Admins → Sign-in link.

const MAIN_APP_URL = 'https://script.google.com/macros/s/AKfycbxwIiOX-So00SP0JFUh9ZsGEMff1WzT_5h6crLoQrlACCkBoDVW4KtUelz26TQ6kEEWew/exec';
const SIGN_IN_SECRET = '520d24e9e57c443388cbe2d78072d9f270fe35c0dc8e4d95a6baaf3df7283ac7';

// The calendar's link must be a deployed web app link: https://script.google.com/macros/s/…/exec
// (not the editor's link, not the /dev test link). Google answers a wrong link with "Sorry, unable to open the file".
const WEB_APP_LINK_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

function doGet() {
  if (!WEB_APP_LINK_PATTERN.test(MAIN_APP_URL)) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">The calendar link in SignIn.gs (MAIN_APP_URL) is not a web app link. ' +
      'Paste the link from the calendar project, Deploy → Manage deployments → Web app. It ends in /exec.</p>').setTitle('Sign in');
  }
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) return page_('', '');
  const note = email + '|' + Date.now();
  const signInLink = MAIN_APP_URL + '?signin=' + encodeURIComponent(note + '|' + signature_(note));
  return page_(email, signInLink);
}

// The note's signature: HMAC-SHA256 with the shared secret, as hex (the calendar calculates the same).
function signature_(text) {
  const bytes = Utilities.computeHmacSha256Signature(text, SIGN_IN_SECRET);
  return bytes.map(function (byte) { return ((byte + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

// The app's logo: "STATE" over "1458", both as wide as each other and together as tall as "EVENTS" (measured on Manrope 800).
const LOGO_SVG = '<svg class="logo" viewBox="0 -1.5 502 75.1" role="img" aria-label="State 1458 Events">' +
  '<text x="-1.476" y="26.561" font-size="36.890" fill="#AFC8F5">STATE</text>' +
  '<text x="-3.067" y="72" font-size="51.110" fill="#AFC8F5">1458</text>' +
  '<text x="121.45" y="72" font-size="100" fill="#EEF1F8">EVENTS</text></svg>';

// The sign-in page, in the calendar's look: the logo and "Sign in", the Google account, then
// "Sign in with Google" and "Continue as a guest". Without an email address only the guest choice is offered.
function page_(email, signInLink) {
  const safe = function (text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  const account = email ?
    '<div class="account"><span class="avatar">' + safe(email.charAt(0).toUpperCase()) + '</span>' +
      '<span class="who">Google account<strong>' + safe(email) + '</strong></span></div>' +
    '<a class="google-button" href="' + safe(signInLink) + '" target="_top">Sign in with Google</a>' :
    '<p class="message">Google did not share your email address. Open this page in Safari or Chrome and try again.</p>';
  const html = '<!DOCTYPE html><html><head>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&display=block">' +
    '<style>' +
    '* { box-sizing: border-box; }' +
    'body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; color: #EEF1F8;' +
    '  font-family: Manrope, system-ui, -apple-system, "Segoe UI", sans-serif; background-color: #0C1220;' +
    '  background-image: radial-gradient(circle at 100% 12%, rgba(150, 120, 235, 0.34), transparent 38%),' +
    '  radial-gradient(circle at -5% 48%, rgba(90, 140, 230, 0.32), transparent 40%),' +
    '  radial-gradient(circle at 90% 78%, rgba(70, 190, 180, 0.22), transparent 36%),' +
    '  radial-gradient(circle at 15% 100%, rgba(225, 120, 160, 0.18), transparent 32%); }' +
    '.card { width: 100%; max-width: 360px; padding: 28px 22px 18px; display: flex; flex-direction: column; align-items: center; gap: 14px;' +
    '  text-align: center; border-radius: 18px; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.16);' +
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 34px rgba(0, 0, 0, 0.30);' +
    '  backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); }' +
    '.logo { height: 40px; width: auto; font-family: Manrope, sans-serif; font-weight: 800; }' +
    'h1 { margin: 4px 0 2px; font-size: 20px; font-weight: 800; }' +
    '.account { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 12px; text-align: left;' +
    '  border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.05); }' +
    '.avatar { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: #5B8DEF; font-weight: 800; }' +
    '.who { display: flex; flex-direction: column; min-width: 0; font-size: 13px; color: #B9C2D9; }' +
    '.who strong { color: #EEF1F8; font-size: 14px; overflow-wrap: anywhere; }' +
    '.message { margin: 0; font-size: 14px; line-height: 1.45; color: #B9C2D9; }' +
    'a { display: block; width: 100%; text-decoration: none; font-weight: 700; }' +
    '.google-button { padding: 13px 16px; border-radius: 12px; background: #fff; color: #1F1F1F; font-size: 15px; }' +
    '.guest { padding: 8px; color: #AFC8F5; font-size: 14px; }' +
    '</style></head><body><main class="card">' + LOGO_SVG + '<h1>Sign in</h1>' + account +
    '<a class="guest" href="' + safe(MAIN_APP_URL) + '" target="_top">Continue as a guest</a></main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('Sign in').addMetaTag('viewport', 'width=device-width, initial-scale=1');
}