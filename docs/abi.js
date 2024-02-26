const POKER = "0x4c4B3671c42c6E780ec5799A1612d8D5305ff6cd";
const TOKEN = "0x39d61f9540D84D5E6920B06e973CEE19D79FeFbD";

var ethers;
var MaxUint256;
import("https://cdn.jsdelivr.net/npm/ethers@6.11.1/+esm").then((mod) => {
    ethers = mod;
    MaxUint256 = ethers.MaxUint256;
});

async function PokerContract(provider) {
    provider = new ethers.BrowserProvider(window.ethereum);

    abi = [
        "function chips(address player, uint256 tableId) public view returns (uint256)",
        "function buyIn(uint256 tableId, uint256 amount)",
        "function tables(uint256) public view returns (tuple(uint8 state, uint256 totalHands, uint256 currentRound, uint256 buyInAmount, uint256 maxPlayers, uint256 pot, uint256 bigBlind, uint256 token))",
        "function totalTables() public view returns (uint256)",
        "function createTable(uint256 buyInAmount, uint256 maxPlayers, uint256 bigBlind, address token)",
    ];
    const signer = await provider.getSigner();
    return new ethers.Contract(POKER, abi, signer);
}

async function TokenContract(provider) {
    provider = new ethers.BrowserProvider(window.ethereum);

    abi = [
        "function balanceOf(address) public view returns (uint256)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function approve(address spender, uint256 value) returns (bool)",
    ];
    const signer = await provider.getSigner();
    return new ethers.Contract(TOKEN, abi, signer);
}
