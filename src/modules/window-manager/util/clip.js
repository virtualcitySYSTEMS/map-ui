
/**
 * @function
 * @memberof module:Window
 *
 * @param {Object} obj
 * @param {number} obj.width - width of the window
 * @param {number} obj.offsetX - x-axis offset of the window
 *
 * @returns {number} final x-axis value
 * @description Clips the x-axis value for a window so it does not run off-screen
 */
function clipX({
  width,
  offsetX = 0,
}) {
  const { innerWidth } = window;

  if (width + offsetX > innerWidth) {
    return innerWidth - width;
  }

  const clippedX = offsetX < 0 ? 0 : offsetX;
  return clippedX;
}


/**
 * @function
 * @memberof module:Window
 *
 * @param {Object} obj
 * @param {number} obj.height - height of the window
 * @param {number} obj.offsetY - y-axis offset of the window
 *
 * @returns {number} final y-axis value
 * @description Clips the y-axis value for a window so it does not run off-screen
 */
function clipY({
  height,
  offsetY = 0,
}) {
  if (offsetY < 48) {
    return 48;
  }
  const { innerHeight } = window;
  if (height + offsetY + 48 > innerHeight) {
    return innerHeight - height;
  }

  const clippedY = offsetY < 0 ? 0 : offsetY;
  return clippedY;
}

export { clipX, clipY };
