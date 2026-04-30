// client/src/lib/auth-logger.ts
// Sistema di logging diagnostico per la pagina Auth
// Scrive su Firestore, Realtime Database e Google Sheets
// Da rimuovere dopo la fase beta

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, push, set } from "firebase/database";
import { db, rtdb } from "@/lib/firebase";
import { authFetch } from "@/lib/api";

// ── Raccoglie tutte le info del dispositivo ──────────────────────────────────
function getDeviceInfo() {
  const ua = navigator.userAgent;

  // Parsing User Agent
  const isIOS     = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isMac     = /macintosh|mac os x/i.test(ua) && !isIOS;
  const isWindows = /windows/i.test(ua);

  // Browser
  const isChrome  = /chrome/i.test(ua) && !/edge|edg/i.test(ua);
  const isSafari  = /safari/i.test(ua) && !/chrome/i.test(ua);
  const isFirefox = /firefox/i.test(ua);
  const isEdge    = /edge|edg/i.test(ua);
  const isSamsung = /samsungbrowser/i.test(ua);

  // Estrae versione browser
  let browserName = "Unknown";
  let browserVersion = "Unknown";
  if (isSamsung) { browserName = "Samsung Browser"; browserVersion = (ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || "?"); }
  else if (isEdge)    { browserName = "Edge";    browserVersion = (ua.match(/Edg\/([\d.]+)/)?.[1] || "?"); }
  else if (isChrome)  { browserName = "Chrome";  browserVersion = (ua.match(/Chrome\/([\d.]+)/)?.[1] || "?"); }
  else if (isFirefox) { browserName = "Firefox"; browserVersion = (ua.match(/Firefox\/([\d.]+)/)?.[1] || "?"); }
  else if (isSafari)  { browserName = "Safari";  browserVersion = (ua.match(/Version\/([\d.]+)/)?.[1] || "?"); }

  // Estrae versione OS
  let osName = "Unknown";
  let osVersion = "Unknown";
  if (isIOS) {
    osName = "iOS";
    osVersion = (ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "?");
  } else if (isAndroid) {
    osName = "Android";
    osVersion = (ua.match(/Android ([\d.]+)/)?.[1] || "?");
  } else if (isMac) {
    osName = "macOS";
    osVersion = (ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, ".") || "?");
  } else if (isWindows) {
    osName = "Windows";
    osVersion = (ua.match(/Windows NT ([\d.]+)/)?.[1] || "?");
  }

  // Dispositivo
  let deviceModel = "Desktop/Unknown";
  if (isIOS) {
    if (/iphone/i.test(ua)) deviceModel = "iPhone";
    else if (/ipad/i.test(ua)) deviceModel = "iPad";
    else deviceModel = "iPod";
  } else if (isAndroid) {
    const match = ua.match(/\(.*?;\s*([^;)]+)\)/);
    deviceModel = match?.[1]?.trim() || "Android device";
  }

  // Viewport e schermo
  const screenWidth   = window.screen.width;
  const screenHeight  = window.screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const orientation   = window.screen.orientation?.type || (window.innerWidth > window.innerHeight ? "landscape" : "portrait");

  // visualViewport API (misura il viewport reale con tastiera)
  const visualViewport = window.visualViewport ? {
    width:  Math.round(window.visualViewport.width),
    height: Math.round(window.visualViewport.height),
    offsetTop: Math.round(window.visualViewport.offsetTop),
    scale: window.visualViewport.scale,
  } : null;

  // Differenza tra viewport e schermo (indica se tastiera è aperta)
  const keyboardEstimatedHeight = Math.max(0, screenHeight - viewportHeight);
  const keyboardProbablyOpen   = keyboardEstimatedHeight > 100;

  // Rete
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const networkInfo = connection ? {
    type:            connection.effectiveType || connection.type || "unknown",
    downlink:        connection.downlink || null,
    rtt:             connection.rtt || null,
    saveData:        connection.saveData || false,
  } : null;

  // PWA
  const isPWA = window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as any).standalone === true;

  // Touch
  const isTouchDevice = navigator.maxTouchPoints > 0;

  // Lingua
  const language = navigator.language || "unknown";

  // Cookie/localStorage disponibili
  let storageAvailable = false;
  try { localStorage.setItem("__test", "1"); localStorage.removeItem("__test"); storageAvailable = true; } catch {}

  return {
    // Dispositivo
    deviceModel,
    osName,
    osVersion,
    isTouchDevice,
    isPWA,
    devicePixelRatio,

    // Browser
    browserName,
    browserVersion,
    userAgent: ua,
    language,
    storageAvailable,

    // Schermo e viewport
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    orientation,
    visualViewport,
    keyboardEstimatedHeight,
    keyboardProbablyOpen,

    // Rete
    networkInfo,

    // Timing
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// ── Struttura del log ────────────────────────────────────────────────────────
export interface AuthLog {
  event: "page_open" | "field_focus" | "field_blur" | "viewport_change"
       | "login_attempt" | "login_success" | "login_error"
       | "register_attempt" | "register_success" | "register_error"
       | "js_error";
  tab?: "login" | "register";
  fieldName?: string;
  errorCode?: string;
  errorMessage?: string;
  viewportBefore?: { width: number; height: number };
  viewportAfter?:  { width: number; height: number };
  viewportDelta?:  number; // px persi per la tastiera
  device: ReturnType<typeof getDeviceInfo>;
  sessionId: string;
}

// Session ID univoco per correlate i log di una sessione
const SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Scrivi su Firestore ──────────────────────────────────────────────────────
async function writeToFirestore(log: AuthLog) {
  try {
    await addDoc(collection(db, "auth_diagnostics"), {
      ...log,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Silenzioso — il logging non deve mai rompere l'app
    console.log("Scrittura su Firestore non riuscita!")
  }
}

// ── Scrivi su Realtime Database ──────────────────────────────────────────────
async function writeToRTDB(log: AuthLog) {
  try {
console.log("log RTDB: ", log);
console.log("RTDB: ", rtdb);

    if (!rtdb) return;
    const logRef = ref(rtdb, `auth_diagnostics/${SESSION_ID}`);
    await push(logRef, {
      ...log,
      createdAt: Date.now(),
    });
  } catch (e) {
    // Silenzioso
    console.log("Scrittura su RTDB non riuscita!")
  }
}

// ── Scrivi su Google Sheets via Worker ──────────────────────────────────────
async function writeToSheets(log: AuthLog) {
  try {
    // Usiamo il Worker solo se è disponibile — non blocchiamo se fallisce
    await authFetch("/api/diagnostics/log", {
      method: "POST",
      body: JSON.stringify({
        sessionId: log.sessionId,
        event: log.event,
        tab: log.tab || "",
        field: log.fieldName || "",
        errorCode: log.errorCode || "",
        browser: `${log.device.browserName} ${log.device.browserVersion}`,
        os: `${log.device.osName} ${log.device.osVersion}`,
        device: log.device.deviceModel,
        viewport: `${log.device.viewportWidth}x${log.device.viewportHeight}`,
        screen: `${log.device.screenWidth}x${log.device.screenHeight}`,
        keyboard: log.device.keyboardProbablyOpen ? "aperta" : "chiusa",
        keyboardHeight: log.device.keyboardEstimatedHeight,
        pwa: log.device.isPWA,
        network: log.device.networkInfo?.type || "unknown",
        timestamp: log.device.timestamp,
        viewportDelta: log.viewportDelta || 0,
      }),
    }).catch(() => {}); // silenzioso se Worker non ha la route
  } catch (e) {
    // Silenzioso
  }
}

// ── Funzione principale: logga su tutti e 3 i sistemi ───────────────────────
export async function logAuthEvent(
  event: AuthLog["event"],
  extra: Partial<Omit<AuthLog, "event" | "device" | "sessionId">> = {}
) {
  const log: AuthLog = {
    event,
    device: getDeviceInfo(),
    sessionId: SESSION_ID,
    ...extra,
  };

console.log("log: ", log);

  // Scrivi in parallelo su tutti e 3, senza bloccare l'UI
  Promise.allSettled([
console.log("scrivo log su Firestore."),
    writeToFirestore(log),
console.log("scrivo log su RTDB."),
    writeToRTDB(log),
console.log("scrivo log su Sheets."),
    writeToSheets(log),
  ]);
}

// ── Hook per monitorare il viewport in tempo reale ───────────────────────────
export function watchViewport(onResize: (delta: number) => void): () => void {
  if (!window.visualViewport) return () => {};

  const initialHeight = window.visualViewport.height;

  const handler = () => {
    const currentHeight = window.visualViewport!.height;
    const delta = Math.round(initialHeight - currentHeight);
    onResize(delta);
  };

  window.visualViewport.addEventListener("resize", handler);
  return () => window.visualViewport!.removeEventListener("resize", handler);
}
