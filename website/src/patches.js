import { AntPath } from 'leaflet-ant-path'

// https://github.com/rubenspgcavalcante/leaflet-ant-path/issues/90
AntPath.prototype._calculateAnimationSpeed = function () {
  const { options, _map, _animatedPathId } = this;

  if (options.paused || !_map) {
    return;
  }

  const zoomLevel = Math.max(4, _map.getZoom());
  const animatedPolyElements = document.getElementsByClassName(_animatedPathId);

  //Get the animation duration (in seconds) based on the given delay and the current zoom level
  const animationDuration = 1 + options.delay / 3 / zoomLevel + "s";

  //TODO Use requestAnimationFrame to better support IE
  const animationRules = ["-webkit-", "-moz-", "-ms-", "-o-", ""]
    .map(prefix => `${prefix}animation-duration: ${animationDuration}`)
    .join(";");

  Array.from(animatedPolyElements, el => {
    el.style.cssText = animationRules;
    el.setAttribute("data-animated", "true");
  });
}
