const POKER = "0x55096c661b54bDc7F3880586314f7D31d824f4dC";
const TOKEN = "0x94bE4f6Ad3b49F4d2a49CDDD374F9d02fCdC5F53";

var ethers;
var MaxUint256;
import("https://cdn.jsdelivr.net/npm/ethers@6.11.1/+esm").then((mod) => {
    ethers = mod;
    MaxUint256 = ethers.MaxUint256;
});

function NewSalt() {
    return ethers.toQuantity(ethers.randomBytes(32));
}

async function PokerContract(provider) {
    provider = new ethers.BrowserProvider(window.ethereum);

    abi = [
        "function chips(address player, uint256 tableId) public view returns (uint256)",
        "function buyIn(uint256 tableId, uint256 amount, uint256 salt)",
        "function tablePlayers(uint256) public view returns (address[])",
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
