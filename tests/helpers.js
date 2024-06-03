/**
 * @param {number} [ms=0]
 * @returns {Promise<unknown>}
 */
export async function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 *
 * @param {{top: number, left: number, bottom: number, width: number, right: number, height: number}} targetRect
 * @returns {{target: HTMLDivElement, destroy: ()=>void}}
 */
export function setupMapTarget(targetRect = {}) {
  const vcsContainer = document.createElement('div');
  const panel = document.createElement('div');
  const vcsMainMap = document.createElement('div');
  const target = document.createElement('div');
  vcsMainMap.appendChild(target);
  panel.appendChild(vcsMainMap);
  vcsContainer.appendChild(panel);
  document.body.appendChild(vcsContainer);
  vcsContainer.getBoundingClientRect = () => targetRect;
  return {
    target,
    destroy: () => {
      document.body.removeChild(vcsContainer);
    },
  };
}
