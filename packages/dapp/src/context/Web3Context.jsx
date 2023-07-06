import { ethers } from 'ethers';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Web3 from 'web3';

import { SUPPORTED_NETWORKS } from '../utils/constants';
import { logError } from '../utils/helpers';

export const Web3Context = createContext();
export const useWeb3 = () => useContext(Web3Context);

export const Web3ContextProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [{ account, provider, chainId }, setWeb3] = useState({});

  const setWeb3Provider = async (prov, initialCall = false) => {
    if (!prov) return;
    if (prov) {
      const web3Provider = new Web3(prov);
      const gotProvider = new ethers.providers.Web3Provider(
        web3Provider.currentProvider,
      );
      const gotChainId = Number(prov.chain.id);
      if (initialCall) {
        const signer = gotProvider.getSigner();
        const gotAccount = await signer.getAddress();

        setWeb3({
          provider: gotProvider,
          chainId: gotChainId,
          account: gotAccount,
        });
      } else {
        setWeb3(_provider => ({
          ..._provider,
          provider: gotProvider,
          chainId: gotChainId,
        }));
      }
    }
  };

  useEffect(() => {
    if (SUPPORTED_NETWORKS.indexOf(chainId) === -1) {
      // TODO show error alert that invalid network is connected
      logError(
        `Network with Chain Id: ${chainId} is not one of the supported networks. Supported networks are: ${SUPPORTED_NETWORKS.join(
          ', ',
        )}`,
      );
    }
  }, [chainId]);

  const connectWeb3 = useCallback(async provider => {
    console.log('connectWeb3 function called! provider:  ', provider);
    if (!provider) return;
    try {
      setLoading(true);

      await setWeb3Provider(provider, true);

      // todo: test with gnosis safe
      const isGnosisSafe = !!provider.safe;
      console.log('isGnosisSafe: ', isGnosisSafe, provider.safe);

      // if (!isGnosisSafe) {
      // provider.on('accountsChanged', accounts => {
      //   setWeb3(_provider => ({
      //     ..._provider,
      //     account: accounts[0],
      //   }));
      // });
      // provider.on('chainChanged', () => {
      //   setWeb3Provider(provider);
      // });
      // }
      // setWeb3(({
      //   ...provider,
      // }));
    } catch (web3ModalError) {
      logError({ web3ModalError });
      throw web3ModalError;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    // web3Modal.clearCachedProvider();
    setWeb3({});
  }, []);

  // useEffect(() => {
  //   if (window.ethereum) {
  //     window.ethereum.autoRefreshOnNetworkChange = false;
  //   }
  //   (async function load() {
  //     if ((await web3Modal.canAutoConnect()) || web3Modal.cachedProvider) {
  //       connectWeb3();
  //     } else {
  //       setLoading(false);
  //     }
  //   })();
  // }, [connectWeb3]);

  return (
    <Web3Context.Provider
      value={{
        loading,
        account,
        provider,
        chainId,
        connectAccount: connectWeb3,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
