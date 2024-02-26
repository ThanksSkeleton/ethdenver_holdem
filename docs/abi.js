const POKER = "0x4c4B3671c42c6E780ec5799A1612d8D5305ff6cd";
const TOKEN = "0x39d61f9540D84D5E6920B06e973CEE19D79FeFbD";

var ethers;
import("https://cdn.jsdelivr.net/npm/ethers@6.11.1/+esm").then((mod) => {
    ethers = mod;
});

async function PokerContract(provider) {
    // doCall(web3, pokerMethods[name], POKER, args, callback)
    // let provider = new ethers.BrowserProvider(window.ethereum); 
    // const signer = await provider.getSigner();

    provider = new ethers.BrowserProvider(window.ethereum);

    abi = [
        "function tables(uint256) public view returns (tuple(uint8 state, uint256 totalHands, uint256 currentRound, uint256 buyInAmount, uint256 maxPlayers, uint256 pot, uint256 bigBlind, uint256 token))",
        "function totalTables() public view returns (uint256)",
        "function createTable(uint256 buyInAmount, uint256 maxPlayers, uint256 bigBlind, address token)",
    ];
    const signer = await provider.getSigner();
    return new ethers.Contract(POKER, abi, signer);
}
