const POKER = "0x75140f88b0F4B2fBC6DadC16CC51203ADB07fe36";
const TOKEN = "0x669F46b55C7C2aC145eD57402943405BdF41d7E6";

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
        "function mint(address, uint256)",
        "function balanceOf(address) public view returns (uint256)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function approve(address spender, uint256 value) returns (bool)",
    ];
    const signer = await provider.getSigner();
    return new ethers.Contract(TOKEN, abi, signer);
}

async function AddChain(provider) {
    try {
      const res = await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x5aff',
            chainName: 'Oasis Sapphire Testnet',
            blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev/'],
            nativeCurrency: { symbol: 'TEST', decimals: 18 },
            rpcUrls: ['https://testnet.sapphire.oasis.dev'],
          },
        ],
      });
      console.log('add', res);
    } catch (e) {
      console.log('ADD ERR', e);
    }
}
