/* eslint-disable no-unused-vars */
import React, { createContext, useState } from "react";

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

const AppContextProvider = (props) => {

    const [address, setAddress] = useState('');
    const [provider, setProvider] = useState('');
    const [web3, setWeb3] = useState('');
    const [chainID, setChainID] = useState('');
    // project details value
    const [projectName, setProjectName] = useState('Lorem Ipsum');
    const [projectDescription, setProjectDescription] = useState('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');
    const [projectAgreement, setProjectAgreement] = useState('https://www.lipsum.com/');
    const [startDate, setStartDate] = useState(new Date().toLocaleDateString());
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString());
    const [safetyValveDate, setSafetyValveDate] = useState(new Date().toLocaleDateString());
    // payment details value
    const [clientAddress, setClientAddress] = useState('0x0');
    const [paymentAddress, setPaymentAddress] = useState('0x0');
    const [paymentDue, setPaymentDue] = useState(0);
    const [paymentToken, setPaymentToken] = useState('DAI');
    const [milestones, setMilestones] = useState(4);
    const [arbitrationProvider, setArbitrationProvider] = useState('Aragon Court');

    const connectAccount = async () => {
        try {
            web3Modal.clearCachedProvider();

            const provider = await web3Modal.connect();
            const web3 = new Web3(provider);
            const accounts = await web3.eth.getAccounts();
            let chainID = await web3.eth.net.getId();

            provider.on("chainChanged", (newChainId) => {
                setChainID(newChainId)
            });

            provider.on("accountsChanged", (accounts) => {
                window.location.href = "/";
            });

            setAddress(accounts[0]);
            setProvider(provider);
            setWeb3(web3);
            setChainID(chainID);

        } catch (err) {
            console.log(err)
        }
    };

    return (
        <AppContext.Provider
            value={{
                address,
                provider,
                web3,
                chainID,
                projectName,
                projectDescription,
                projectAgreement,
                startDate,
                endDate,
                safetyValveDate,
                clientAddress,
                paymentAddress,
                paymentDue,
                paymentToken,
                milestones,
                arbitrationProvider,
                // functions
                connectAccount,
                setProjectName,
                setProjectDescription,
                setProjectAgreement,
                setStartDate,
                setEndDate,
                setSafetyValveDate,
                setClientAddress,
                setPaymentAddress,
                setPaymentDue,
                setPaymentToken,
                setMilestones,
                setArbitrationProvider
            }}
        >
            {props.children}
        </AppContext.Provider>
    );
}

export default AppContextProvider;
