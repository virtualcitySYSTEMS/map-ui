// eslint-disable-next-line import/prefer-default-export
export async function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
