const POKER = "0xA75897a7635d31F6804A6560f3c6fBA64De94D2e";
const TOKEN = "0x7fB79D023Ab907A7d8ea26aBeC637a917a617B85";

var ethers;
var MaxUint256;
var sapphire;
var Provider;
var Account;

async function Init() {
  if (!sapphire) {
    sapphire = await import("https://cdn.jsdelivr.net/npm/@oasisprotocol/sapphire-paratime@1.3.2/+esm");
  }
  if (!ethers) {
    ethers = await import("https://cdn.jsdelivr.net/npm/ethers@6.11.1/+esm");
    MaxUint256 = ethers.MaxUint256;
  }

  if (!Provider) {
    await MMSDK.connect();
    Provider = await MMSDK.getProvider();
    await AddChain(Provider);
  }

  if (!Account) {
    const res = await Provider.request({
      method: 'eth_requestAccounts',
      params: [],
    });
    Account = res[0];
  }

  return { provider: Provider, account: Account };
}

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
        "function encryptedPlayerCards(address player, uint256 tableId, uint256 hand) public view returns (bytes, bytes)",
    ];
    let signer = await provider.getSigner();
    // signer = sapphire.wrap(signer);
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

function HashDecryptCard(salt, table_id, handnum, encrypted) {
  for (let card = 0; card <= 51; card++) {
    // Generate the keccak256 hash of the concatenated salt, table_id, handnum, and card
    // console.log([salt, table_id, handnum, card])
    const hash = ethers.keccak256(ethers.solidityPacked(['uint256', 'uint256', 'uint256', 'uint256'], [salt, table_id, handnum, card]));

    // Check if the generated hash matches the encrypted data
    if (hash === ethers.hexlify(encrypted)) {
      console.log(`Found secret card: ${card}`);
      return card; // Exiting the function as we found the matching card
    }
  }

  console.log('No matching card found.');
  return -1; // Indicate that no matching card was found
}