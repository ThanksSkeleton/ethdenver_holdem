var xmtpClient;

// Get the keys using a valid Signer. Save them somewhere secure.

async function initClient() {
  if (!xmtpClient) { // check for xmtp too?
    console.log('no xmptClient');
    const provider = new ethers.BrowserProvider(window.ethereum); // Corrected provider instantiation
    const signer = await provider.getSigner();
    console.log("xmtp");
    console.log(xmtp);
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
    let conversations = [];

    for (const player of players) {
        // Skip if the player is the xmtpClient itself
        if (player === xmtpClient.address) {
            console.log(`${player} skipping his own address of ${xmtpClient.address}`);
            continue;
        }

        // Check if the xmtpClient can message the player
        // If xmtpClient cannot message the player, create a new conversation
        const conversation = await xmtpClient.conversations.newConversation(player);
        console.log('conversation made');
        // const foo = await conversation.send("hello");
        // console.log(foo);
        conversations.push(conversation);
    }
    listenForMessages();
    console.log(conversations);
    return conversations;
}

// async function initConversations(players) {
//     let conversations = [];

//     for (const player of players) {
//         // Skip if the player is the xmtpClient itself
//         if (player === xmtpClient.address) {
//             console.log(`${player} skipping his own address of ${xmtpClient.address}`);
//             continue;
//         }

//         // Check if the xmtpClient can message the player
//         const canMessage = await xmtpClient.canMessage(player);

//         if (!canMessage) {
//             console.log(`${xmtpClient.address} cannot mesage ${player}`);
//             // If xmtpClient cannot message the player, create a new conversation
//             const conversation = await xmtpClient.conversations.newConversation(player);
//             console.log('conversation made yo');
//             conversations.push(conversation);
//         } else {
//             const existingConversationsWithPlayerss = await Promise.all(
//                 xmtpClient.conversations.list().filter(conversation => {

//                     // for the current player I look at his existing conversations and filter where 
//                     return this.players.includes(conversation.peerAddress);
//                 })
//             );
//             const existingConversationsWithPlayers = await xmtpClient.conversations.list().filter(async conversation => {
//                 return 
//             })
//         }
//         // If canMessage is true, it means a conversation already exists, so no action needed
//     }

//     return conversations;
// }


// async function initConversations(players) {
//     // Ensure xmtpClient is initialized; if not, initialize it (this part seems to be missing or could be handled better)
  
//     const allConversations = await xmtpClient.conversations.list();
//     const conversations = await Promise.all(players.map(async (player) => {
//       console.log(`${xmtpClient.address} is trying to message ${player}.`);
//       const canMessage = await canMessageRecipient(player);
//       if (player !== xmtpClient.address && !canMessage) {
//         console.log(`Cannot message ${player}, initializing the conversation`);
//         return xmtpClient.conversations.newConversation(player);
//       } else {
//         console.log('You can already message the user:', player);
//         const existingConversation = allConversations.find(conversation => conversation.peerAddress === player);
//         return existingConversation; // Directly return the found conversation or null if not found
//       }
//     }));
  
//     console.log('Conversations:', conversations);
//     return conversations.filter(conversation => conversation != null); // Filter out nulls if no existing conversation was found
//   }

// async function initConversations(players) {
//   if (!xmtp) { // TODO: prob remove this should never happen
//     provider = new ethers.BrowserProvider(window.ethereum);
//     signer = await provider.getSigner();
//     xmtp = await xmtpClient.create(signer, { env: "dev" });
//     console.log('xmtp initialized tho i dont expect this to happen', xmtp.address);
//   }

//   const conversations = await Promise.all(players.map(async (player) => {
//     console.log(`${xmtp.address} is trying to message ${player}. `)
//     const canMessage = await canMessageRecipient(player);
//     console.log(`canMessage = ${canMessage}`);
//     if (player !== xmtp.address && !canMessage) {
//       console.log(`${provider} cannot message ${player}, initializing the conversation`);
//       return await xmtp.conversations.newConversation(player);
//     } else {
//         console.log('you can already msg the user');
//         return await Promise.all(
//             xmtp.conversations.list().filter(conversation => {
//                 return this.players.includes(conversation.peerAddress);
//             })
//         )
//     }
//   }));
//   console.log('conversations:');
//   console.log(conversations);
//   return conversations;
// }
