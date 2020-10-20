import React, { Component, createContext } from "react";

import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider,
        options: {
            infuraId: process.env.REACT_APP_INFURA_ID,
        },
    },
};

const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: false,
    providerOptions,
    theme: {
        background: '#ffff',
        main: '#FF3864',
    }
});

export const AppContext = createContext();

class AppContextProvider extends Component {
    state = {
        //web3 needs
        address: "",
        provider: "",
        web3: "",
        chainID: "",
    };

    connectAccount = async () => {
        try {
            web3Modal.clearCachedProvider();

            const provider = await web3Modal.connect();
            const web3 = new Web3(provider);
            const accounts = await web3.eth.getAccounts();
            let chainID = await web3.eth.net.getId();

            provider.on("chainChanged", (chainId) => {
                this.setState({ chainID: chainId });
            });

            provider.on("accountsChanged", (accounts) => {
                window.location.href = "/";
            });

            this.setState(
                {
                    address: accounts[0],
                    provider,
                    web3,
                    chainID,
                },
            );
        } catch (err) {
            console.log(err)
        }
    };

    render() {
        return (
            <AppContext.Provider
                value={{
                    ...this.state,
                    connectAccount: this.connectAccount,
                }}
            >
                {this.props.children}
            </AppContext.Provider>
        );
    }
}

export default AppContextProvider;
