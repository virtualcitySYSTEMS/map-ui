function setScreenSize({ width, height }) {
  Object.defineProperty(
    window,
    'innerWidth',
    { writable: true, configurable: true, value: width },
  );
  Object.defineProperty(
    window,
    'innerHeight',
    { writable: true, configurable: true, value: height },
  );
}

export default setScreenSize;
