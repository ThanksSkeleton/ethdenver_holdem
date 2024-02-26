// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import { ethers } from 'hardhat';

async function main() {
  const poker_mock_factory = await ethers.getContractFactory('Poker');
  const poker_mock = await poker_mock_factory.deploy();
  console.log('Poker deployed to:', await poker_mock.getAddress());

// //   const random_1 = await (await vigil.generateNumber());
// //   console.log('First Random:',random_1)
// //   const random_2 = await (await vigil.generateNumber());
// //   console.log('Second Random:', random_2)

// // const vectors = require('./Deoxys-II-256-128.json');

//   // let key = new Uint8Array(Buffer.from(vectors.Key, 'base64'));
//   // let nonce = new Uint8Array(Buffer.from(vectors.Nonce, 'base64'));
//   // let aad = new Uint8Array(Buffer.from(vectors.AADData, 'base64'));
//   // let msg = new Uint8Array(Buffer.from(vectors.MsgData, 'base64'));

//   // let aead = new deoxysii.AEAD(key, useUnsafeVartime);

//   // for (let i = 0; i < vectors.KnownAnswers.length; i++) {
//   //   const vector = vectors.KnownAnswers[i];

//   //   const m = msg.subarray(0, vector.Length);
//   //   const a = aad.subarray(0, vector.Length);

//   //   let ciphertext = aead.encrypt(nonce, m, a);

//   //   const vecCt = new Uint8Array(Buffer.from(vector.Ciphertext, 'base64'));
//   //   const vecTag = new Uint8Array(Buffer.from(vector.Tag, 'base64'));

//   //   const expectedCipher = new Uint8Array(vecCt.length + vecTag.length);
//   //   expectedCipher.set(vecCt, 0);
//   //   expectedCipher.set(vecTag, vecCt.length);
//   //   assert.deepEqual(ciphertext, expectedCipher, 'Ciphertext + Tag: ' + i);

//   //   let plaintext = aead.decrypt(nonce, ciphertext, a);
//   //   assert.deepEqual(plaintext, m, 'Plaintext: ' + i);


//     // vigil.on('Deoxsys_Encrypt', (encrypted, nonce, event) => {
//     //   console.log(`Deoxsys_Encrypt event triggered`);
//     //   console.log(`Encrypted data: ${encrypted}`);
//     //   console.log(`Nonce: ${nonce}`)

//     //   console.log(`Event details:`, event);
//     // });

//     // async function findSecretCard() {
//     //   // Listen for the Keccak_Encrypt event
//     junk.on('Keccak_Encrypt', (encrypted) => {
//       console.log('Encrypted event detected:', encrypted);
  
//       const secretKey: string = "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0";

//       // Loop through possible cards (0-51) to find the secret card
//       for (let card = 0; card <= 51; card++) {
//         // Generate the keccak256 hash of the concatenated secret key and card
//         console.log("generating keccak hash")
//         const hash = ethers.keccak256(ethers.solidityPacked(['bytes', 'uint8'], [secretKey, card]));
  
//         // Check if the generated hash matches the encrypted data from the event
//         if (hash === ethers.hexlify(encrypted)) {
//           console.log(`Found secret card: ${card}`);
//           return card; // Exiting the function as we found the matching card
//         }
//       }
  
//       console.log('Secret card not found.');
//     });

//     // const cards = await (await vigil.generateCards(6));
//     // console.log('cards: ', cards)

//     console.log('starting hello world encryption: ')
//     const encrypted_tx = await junk.keccak_hello_world();
//     console.log('tx hash for hello world encryption: ', encrypted_tx.hash)
//     // const r = await encrypted_tx.wait();
//     // console.log("full result:", r)
//     // const myEvent = r?.events?.filter((x) => x.event === "Deoxsys_Encrypt")[0];
//     // console.log('event:', myEvent)
}

async function generateTraffic(n: number) {
  const signer = await ethers.provider.getSigner();
  for (let i = 0; i < n; i++) {
    await signer.sendTransaction({
      to: "0x000000000000000000000000000000000000dEaD",
      value: ethers.parseEther("1.0"),
      data: "0x"
    });
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});