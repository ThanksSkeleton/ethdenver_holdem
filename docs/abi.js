const POKER = "0xcf78410DdfC51cC30c79c1DdC117F9941343214a";
const TOKEN = "0x7fB79D023Ab907A7d8ea26aBeC637a917a617B85";

var ethers;
var MaxUint256;
var sapphire;
var Provider;
var Account;
var xmtp;

async function Init() {
  if (!sapphire) {
    sapphire = await import("https://cdn.jsdelivr.net/npm/@oasisprotocol/sapphire-paratime@1.3.2/+esm");
  }
  if (!ethers) {
    ethers = await import("https://cdn.jsdelivr.net/npm/ethers@6.11.1/+esm");
    MaxUint256 = ethers.MaxUint256;
  }

  if (!xmtp) {
    xmtp = await import("https://cdn.jsdelivr.net/npm/@xmtp/xmtp-js@11.3.14/+esm");
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

async function EnsureBaseSalt(provider, account, num) {
  if (localStorage.getItem("baseSalt")) {
    return localStorage.getItem("baseSalt");
  }

  let baseSalt = await provider.request({
    "method": "personal_sign",
    "params": [
      ethers.hexlify(ethers.toUtf8Bytes("base table salt to keep your cards secret")),
      account
    ]
  });
  baseSalt = ethers.keccak256(baseSalt);
  localStorage.setItem("baseSalt", baseSalt);
  return baseSalt;
}

async function GenerateSalt(provider, account, num) {
    let base = await EnsureBaseSalt(provider, account);
    let table = ethers.keccak256(ethers.toUtf8Bytes("table: " + num));
    return ethers.toQuantity(ethers.keccak256(ethers.solidityPacked(['bytes32', 'bytes32'], [base, table])));
}

async function PokerContract(provider) {
    provider = new ethers.BrowserProvider(window.ethereum);

    abi = [
        "function playHand(uint256 tableId, uint8 action, uint256 raiseAmount)",
        "function withdrawChips(uint256 amount, uint256 tableId)",
        "function chips(address player, uint256 tableId) public view returns (uint256)",
        "function buyIn(uint256 tableId, uint256 amount, uint256 salt)",
        "function tablePlayers(uint256) public view returns (address[])",
        "function tables(uint256) public view returns (tuple(uint8 state, uint256 totalHands, uint256 currentRound, uint256 buyInAmount, uint256 maxPlayers, uint256 pot, uint256 bigBlind, uint256 token))",
        "function totalTables() public view returns (uint256)",
        "function createTable(uint256 buyInAmount, uint256 maxPlayers, uint256 bigBlind, address token)",
        "function encryptedPlayerCards(address player, uint256 tableId, uint256 hand) public view returns (bytes, bytes)",
        "function bettingRounds(uint256 tableId, uint8 bettingRound) public view returns (tuple(uint256 turn, uint256 highestChip))",
        "function bettingRoundChips(uint256 tableId, uint8 bettingRound) public view returns (uint256[])",
        "function bettingRoundPlayers(uint256 tableId, uint8 bettingRound) public view returns (address[])",
        "function revealedCommunityCards(uint256 tableId, uint256 hand, uint256 card) public view returns (tuple(uint256 card, bool valid))",
    ];

    let signer = await provider.getSigner();
    return new ethers.Contract(POKER, abi, signer);
}

async function SecretPokerContract(provider, secure) {
    provider = new ethers.BrowserProvider(window.ethereum);

    abi = [
        "function buyIn(uint256 tableId, uint256 amount, uint256 salt)",
    ];
    
    let signer = await provider.getSigner();
    return new ethers.Contract(POKER, abi, sapphire.wrap(signer))
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
    const hash = ethers.keccak256(ethers.solidityPacked(['uint256', 'uint256', 'uint256', 'uint8'], [salt, table_id, handnum, card]));

    // Check if the generated hash matches the encrypted data
    if (hash === ethers.hexlify(encrypted)) {
      console.log(`Found secret card: ${card}`);
      return card; // Exiting the function as we found the matching card
    }
  }

  console.log('No matching card found.');
  return -1; // Indicate that no matching card was found
}

async function TryTx(component, fun, args) {
  let ret;
  try {
    // let simret = await fun.staticCall.apply(fun.staticCallResult, args);
    // console.log('tryTx simret', simret);
    component.spinner = true;
    let tx = await fun.apply(fun, args);
    console.log('tryTx tx', tx);
    ret = await tx.wait();
    console.log('tryTx ret', ret);
    component.update();
  } catch (e) {
    console.log('tryTx ERR', e);
    if (e.reason) {
      component.error = e.reason;
    } else {
      component.error = "Unknown revert reason.";
    }
    console.log('tryTx ERR', e.reason);
  }
  component.spinner = false;
  return ret;
}
