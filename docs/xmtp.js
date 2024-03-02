var xmtpClient;
var conversations = [];
let keys;
// import { loadKeys, storeKeys } from "./helpers";

// this doesn't work due to our vue project structure and the weird way we were forced into doing imports.

// async function initClientWithKeyStorage() {
//   xmtpClient = await xmtp.Client;
//   keys = loadKeys(Account);
//   console.log(keys);
//   if (!keys) {
//     const provider = new ethers.BrowserProvider(window.ethereum);
//     const signer = await provider.getSigner();
//     keys = await xmtpClient.getKeys(signer, {
//       ...clientOptions,
//       // we don't need to publish the contact here since it
//       // will happen when we create the client later
//       skipContactPublishing: true,
//       // we can skip persistence on the keystore for this short-lived
//       // instance
//       persistConversations: false,
//     });
//     storeKeys(Account, keys);
//   }
//   const client = await xmtpClient.create(null, {
//     ...clientOptions,
//     privateKeyOverride: keys,
//   });
// }
async function initClient() {
  if (!xmtpClient) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    xmtpClient = await xmtp.Client.create(signer, { env: "dev" }); // Create a new XMTP client instance
    console.log("XMTP Client created", xmtpClient.address);
  } else {
    console.log("XMTP Client already initialized");
  }
}

async function listenForMessages() {
  console.log('listening to messages');
  for await (const message of await xmtpClient.conversations.streamAllMessages()) {
    if (message.senderAddress === xmtpClient.address) {
      console.log(`dont listen to yourself. sender: ${message.senderAddress} xmtpClient: ${xmtpClient.address}`);
      // This message was sent from me
      continue;
    }
    console.log('listening in for loop')
    console.log(message.content);
    this.xmtpMsg += message.content;
  }
}
async function initConversations(players) {
    for (const player of players) {
        // Skip if the player is the xmtpClient itself
        if (player === xmtpClient.address) {
            console.log(`${player} skipping his own address of ${xmtpClient.address}`);
            continue;
        }
        const conversation = await xmtpClient.conversations.newConversation(player);
        console.log(`conversation made with ${player}`);
        console.log(conversation);
        conversations.push(conversation);      
        console.log(conversations); 
    }
    listenForMessages();
    return conversations;
}

const PLAYER_ACTIONS_MAP = {
  0: "called",
  1: "raised",
  2: "checked",
  3: "folded"
};

async function broadcastHand(conversations, action, raiseAmount) {
  console.log('conversations');
  console.log(conversations);
  // await xmtpClient.contacts.refreshConsentList();
  let message = `${xmtpClient.address} ${PLAYER_ACTIONS_MAP[action]} `;
  // not check nor fold
  if (action !== 2 && action !== 3) {
    message += raiseAmount;
  }
  conversations.map((convo) => {
    convo.send(message);
  })
  return message;
}

async function sendChat(msg) {
  conversations.map((convo) => {
    convo.send(msg);
  })
}