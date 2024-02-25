const MMSDK = new MetaMaskSDK.MetaMaskSDK({
    dappMetadata: {
        name: "Example Pure JS Dapp",
        url: window.location.href,
    },
    // Other options
})
// Because the init process of MetaMask SDK is async.
setTimeout(() => async function () {
    // You can also access via window.ethereum
    const accounts = await MMSDK.connect();
    // console.log(accounts);
    const ethereum = MMSDK.getProvider();
    ethereum.request({ method: 'eth_requestAccounts' });
}, 0);