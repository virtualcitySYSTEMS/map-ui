// eslint-disable-next-line import/prefer-default-export
export async function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
