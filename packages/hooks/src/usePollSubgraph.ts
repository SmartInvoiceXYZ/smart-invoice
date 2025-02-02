const usePollSubgraph = ({
  label,
  fetchHelper,
  checkResult,
  interval = 1000,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchHelper: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkResult: (value: any) => boolean;
  interval?: number;
}) => {
  const waitForResult = async () =>
    new Promise(resolve => {
      const checkResultHandler = async () => {
        try {
          const result = await fetchHelper();

          if (result && checkResult(result)) {
            // eslint-disable-next-line no-use-before-define
            clearInterval(intervalId);
            resolve(result);
          }
          // eslint-disable-next-line no-console
          console.log(label);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(e);
        }
      };

      const intervalId = setInterval(checkResultHandler, interval);
      checkResultHandler(); // Check immediately

      setTimeout(() => {
        clearInterval(intervalId);
        resolve(null); // Resolve with null or handle the timeout case
      }, 20000);
    });

  return waitForResult;
};

export default usePollSubgraph;
