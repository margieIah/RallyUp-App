// Native stub for WebMap. Metro picks WebMap.web.js when bundling for web,
// and this stub when bundling for native — so @vis.gl/react-google-maps
// (web-only) is never resolved into the native bundle.
export default function WebMap() {
  return null;
}
