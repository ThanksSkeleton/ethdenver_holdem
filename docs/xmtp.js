var xmtpClient;
var conversations;
async function initClient() {
  if (!xmtpClient) { // check for xmtp too?
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    xmtpClient = await xmtp.Client.create(signer, { env: "dev" }); // Create a new XMTP client instance
    console.log("XMTP Client created", xmtpClient.address);
  } else {
    console.log("XMTP Client already initialized");
  }
  return xmtpClient;
}

async function canMessageRecipient(recipient) {
    return await xmtpClient.canMessage(recipient);
}

async function listenForMessages() {
  for await (const message of await xmtpClient.conversations.streamAllMessages()) {
    if (message.senderAddress === xmtpClient.address) {
      // This message was sent from me
      continue;
    }
    console.log(message.content);
  }
}
// TODO: I should batch this so you don't get spammed with msg signing
async function initConversations(players) {
    conversations = [];

    for (const player of players) {
        // Skip if the player is the xmtpClient itself
        if (player === xmtpClient.address) {
            console.log(`${player} skipping his own address of ${xmtpClient.address}`);
            continue;
        }
        if (xmtpClient.canMessage(player)) { // && xmtp.contacts.isAllowed(player)
          console.log(`${xmtpClient.address} can already message ${player}. Not creating a new Conversation`);
        } else {
          const conversation = await xmtpClient.conversations.newConversation(player);
          console.log('conversation made');
          conversations.push(conversation);
        }
    }
    listenForMessages();
    return conversations;
}

const PLAYER_ACTIONS_MAP = {
  0: "CALL",
  1: "RAISE",
  2: "CHECK",
  3: "FOLD"
};

async function broadcastHand(players, action, raiseAmount) {
  await xmtpClient.contacts.refreshConsentList();
  conversations.forEach(async convo => {
    console.log(convo);
    await convo.send(`${xmtpClient.address} ${PLAYER_ACTIONS_MAP[action]} ${raiseAmount}`);
  })
}