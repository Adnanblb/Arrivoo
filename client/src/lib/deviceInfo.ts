export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    browser = "Chrome";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    browser = "Safari";
  } else if (ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
  } else if (ua.includes("Opera") || ua.includes("OPR")) {
    browser = "Opera";
  }
  
  return browser;
}

export function getOSInfo() {
  const ua = navigator.userAgent;
  let os = "Unknown";
  
  if (ua.includes("Win")) {
    os = "Windows";
  } else if (ua.includes("Mac")) {
    os = "macOS";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) {
    os = "iOS";
  }
  
  return os;
}

export function getScreenSize() {
  return `${window.screen.width}x${window.screen.height}`;
}

export function getDeviceMetadata() {
  return {
    browser: getBrowserInfo(),
    os: getOSInfo(),
    screenSize: getScreenSize(),
  };
}
