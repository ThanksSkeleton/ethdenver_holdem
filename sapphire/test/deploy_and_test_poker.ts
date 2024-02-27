
// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import chai = require("chai");
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Poker, PokerToken } from "../typechain-types/contracts";
import { ContractFactory, Contract, Signer } from "ethers";
const { hash_decrypt_card, decrypt_hole_cards } = require('../scripts/decrypt_from_salt.js');



import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.config.includeStack = true;

describe('Poker Solidity Contract Tests (not including Sapphire Behavior)', () => {
  let poker : Poker;
  let poker_token: PokerToken;

  let creator : Signer;

  let player1 : Signer;
  let player2 : Signer;
  let player3 : Signer;
  let player4 : Signer;

  let stranger : Signer;

  let two_player_game_players : Signer[];
  let four_player_game_players : Signer[];


  const MINIMUM_BUY_IN_AMOUNT = 200;
  const TWO_PLAYERS = 2;
  const FOUR_PLAYERS = 4;
  const BIG_BLIND = 2;

  const TABLE_ID = 0;
  const BUY_IN_AMOUNT = 300;
  
  const player1_salt = 1;
  const player2_salt = 2;
  const player3_salt = 3;
  const player4_salt = 4;

  const BETTING_ROUND_PREFLOP = 0;
  const BETTING_ROUND_FLOP = 1;
  const BETTING_ROUND_TURN = 2;
  const BETTING_ROUND_RIVER = 3;

  const PLAYER_ACTION_CALL = 0;
  const PLAYER_ACTION_RAISE = 1;
  const PLAYER_ACTION_CHECK = 2;
  const PLAYER_ACTION_FOLD = 3;

  const HAND_ID = 0;

  beforeEach(async function () {

    const [crx, px1, px2, px3, px4, stx] = await ethers.getSigners();
    creator = crx;
    player1 = px1;
    player2 = px2;
    player3 = px3;
    player4 = px4;
    stranger = stx;

    two_player_game_players = [player1, player2];
    four_player_game_players = [player1, player2, player3, player4]

    let factory1 = await ethers.getContractFactory('Poker');
    poker = await factory1.deploy() as Poker;
    await poker.waitForDeployment();

    let factory2 = await ethers.getContractFactory('PokerToken');
    poker_token = await factory2.deploy(poker.getAddress()) as PokerToken;
    await poker_token.waitForDeployment();

    poker_token.mint(await player1.getAddress(), 1000);
    poker_token.mint(await player2.getAddress(), 1000);
    poker_token.mint(await player3.getAddress(), 1000);    
    poker_token.mint(await player4.getAddress(), 1000);    
  });

  async function two_player_table_setup() 
  {
    await poker.connect(player1).createTable(MINIMUM_BUY_IN_AMOUNT, TWO_PLAYERS, BIG_BLIND, await poker_token.getAddress());

    await poker.connect(player1).buyIn(TABLE_ID, BUY_IN_AMOUNT, player1_salt);
    await poker.connect(player2).buyIn(TABLE_ID, BUY_IN_AMOUNT, player2_salt);
  }

  async function four_player_table_setup() 
  {
    await poker.connect(player1).createTable(MINIMUM_BUY_IN_AMOUNT, FOUR_PLAYERS, BIG_BLIND, await poker_token.getAddress());

    await poker.connect(player1).buyIn(TABLE_ID, BUY_IN_AMOUNT, player1_salt);
    await poker.connect(player2).buyIn(TABLE_ID, BUY_IN_AMOUNT, player2_salt);
    await poker.connect(player3).buyIn(TABLE_ID, BUY_IN_AMOUNT, player3_salt);
    await poker.connect(player4).buyIn(TABLE_ID, BUY_IN_AMOUNT, player4_salt);
  }

  async function summarize_chips_four_players(betting_round: number) 
  {
    console.log("Chip Summary")

    let br = await poker.bettingRounds(TABLE_ID, betting_round);

    console.log("br.state " + br.state, "br.turn " + br.turn, "br.highestchip " + br.highestChip);

    let br_chips = await poker.bettingRoundChips(TABLE_ID, betting_round);

    console.log("All Betting Round chips " + br_chips);

    for (const player_index of [0,1,2,3]) 
    {
      let chips = await poker.chips(await four_player_game_players[player_index].getAddress(), TABLE_ID);
      console.log("Player " + (1 + player_index) + " Chips Remaining: "+ chips);
      console.log("Player " + (1 + player_index) + " Chips Contributed To Pot: " + br_chips[player_index])
    }

    console.log("End Summary")
  }

  it('Two Player Game Gives them decryptable encrypted Cards, + Raise', async () => {
    await two_player_table_setup(); 

    // confirm that there are cards
    let p1_encrypted_cards = await poker.encryptedPlayerCards(await player1.getAddress(), TABLE_ID, HAND_ID);
    console.log("p1 - encrypted" + p1_encrypted_cards);

    let p1_decrypted_cards = decrypt_hole_cards(player1_salt, TABLE_ID, HAND_ID, p1_encrypted_cards);
    console.log("p1 - decrypted" + p1_decrypted_cards);

    let p2_encrypted_cards = await poker.encryptedPlayerCards(await player2.getAddress(), TABLE_ID, HAND_ID);
    console.log("p2 - encrypted" + p2_encrypted_cards);

    let p2_decrypted_cards = decrypt_hole_cards(player2_salt, TABLE_ID, HAND_ID, p2_encrypted_cards);
    console.log("p2 - decrypted" + p2_decrypted_cards);

    await poker.connect(player1).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 20);
  });

  it('Four Player Game - Raising and then Calling in a circle', async () => 
  {
    await four_player_table_setup(); 

    // Before Betting
    await summarize_chips_four_players(BETTING_ROUND_PREFLOP);

    // Everyone Rasing

    for (let [index, player] of four_player_game_players.entries()) 
    {
      console.log("Player Raising By 20")
      await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 20);
      await summarize_chips_four_players(BETTING_ROUND_PREFLOP);
    }

    // Players 1-3 calling

    for (let [index, player] of four_player_game_players.entries()) 
    {
      if (index != 3) 
      {
        console.log("Player "+ index+1 + " Calling")
        await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CALL, 0);
        await summarize_chips_four_players(BETTING_ROUND_PREFLOP);
      }
    }

    // After Betting
    await summarize_chips_four_players(BETTING_ROUND_PREFLOP);
  });


  it('Four Player Game - Transition from Preflop to Flop', async () => 
  {
    await four_player_table_setup(); 

    // Before Betting

    let table = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table.currentBettingRound);

    // Everyone Rasing

    for (let [index, player] of four_player_game_players.entries()) 
    {
      console.log("Player Raising By 20")
      await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 20);
      await summarize_chips_four_players(BETTING_ROUND_PREFLOP);
    }

    // Players 1-3 calling

    for (let [index, player] of four_player_game_players.entries()) 
    {
      if (index != 3) 
      {
        console.log("Player "+ (index+1) + " Calling")
        await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CALL, 0);
        await summarize_chips_four_players(BETTING_ROUND_PREFLOP);
      }
    }

    let table2 = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table2.currentBettingRound);

    // After Betting
    await summarize_chips_four_players(Number(table2.currentBettingRound));
  });

});

// describe("zkWitches Contract - Joined Game", function () {


// async function main() {
//   const poker_mock_factory = await ethers.getContractFactory('Poker');
//   const poker_mock = await poker_mock_factory.deploy();
//   console.log('Poker deployed to:', await poker_mock.getAddress());
// }

//   import { expect } from "chai";
//   import chai = require("chai");
  
//   import { ethers } from "hardhat";
//   import * as fs from "fs";
//   import { ContractFactory, Contract, Signer } from "ethers";
//   import { Verifier as HCVerifier } from "../typechain-types/contracts/HandCommitment_verifier.sol";
//   import { Verifier as NWVerifier } from "../typechain-types/contracts/NoWitch_verifier.sol";
//   import { Verifier as VMVerifier } from "../typechain-types/contracts/ValidMove_verifier.sol";
//   import { ZkWitches } from "../typechain-types/contracts/zkWitches.sol";
//   import chaiAsPromised = require("chai-as-promised");
  
//   chai.use(chaiAsPromised);
//   chai.config.includeStack = true;
  
//   describe("zkWitches Contract - Joined Game", function () {
  
//       let hc_Verifier: HCVerifier;
//       let vm_Verifier: VMVerifier;
//       let nw_Verifier: NWVerifier;
//       let zkWitches: ZkWitches;
  
//       // Players
//       let p1 : Signer;
//       let p2 : Signer;
//       let p3 : Signer;
//       let p4 : Signer;
  
//       // Not a player
//       let stranger : Signer;
  
//       beforeEach(async function () {
//           let fact = await ethers.getContractFactory("contracts/HandCommitment_verifier.sol:Verifier");
//           hc_Verifier = await fact.deploy() as HCVerifier;
//           await hc_Verifier.deployed();
  
//           let fact2 = await ethers.getContractFactory("contracts/ValidMove_verifier.sol:Verifier"); 
//           vm_Verifier = await fact2.deploy() as VMVerifier;
//           await vm_Verifier.deployed();
  
//           let fact3 = await ethers.getContractFactory("contracts/NoWitch_verifier.sol:Verifier"); 
//           nw_Verifier = await fact3.deploy() as NWVerifier;
//           await nw_Verifier.deployed();
  
//           let fact4 = await ethers.getContractFactory("zkWitches");
//           zkWitches = await fact4.deploy(hc_Verifier.address, vm_Verifier.address, nw_Verifier.address) as ZkWitches;
//           await zkWitches.deployed();
  
//           await AllJoin();
  
//           // balance = await signers[0].getBalance();
//       });
    
//       async function AllJoin()
//       {       
//           const [owner, px1, px2, px3, px4, px5] = await ethers.getSigners();
//           p1 = px1;
//           p2 = px2;
//           p3 = px3;
//           p4 = px4;
//           stranger = px5;
  
//           var hccall_array = JSON.parse("[" + fs.readFileSync(hccall) + "]");
//           for(let player of [p1, p2, p3, p4]) 
//           {
//               await zkWitches.connect(player).JoinGame(hccall_array[0], hccall_array[1], hccall_array[2], hccall_array[3]);
//           }
//       }
  
//       const hccall = "./circuits/build/HandCommitment/call.txt";
//       const vmcall = "./circuits/build/ValidMove/call.txt";
//       const nwcall = "./circuits/build/NoWitch/call.txt";
  
//       it("Everyone can join", async function() 
//       {
//       });
  
//       it("5th player cannot join", async function() 
//       {
//           var hccall_array = JSON.parse("[" + fs.readFileSync(hccall) + "]");
//           await expect(zkWitches.connect(stranger).JoinGame(hccall_array[0], hccall_array[1], hccall_array[2], hccall_array[3])).to.be.rejected;
//       });
  
//       it("Player 1 can make an proof based action with resource check", async function() 
//       {
//           let old_tgs = await zkWitches.connect(p1).GetTGS();
//           expect(old_tgs.players[0].lumber).to.eq(2);    
  
//           var vmcall_array = JSON.parse("[" + fs.readFileSync(vmcall) + "]");
//           await expect(zkWitches.connect(p1).ActionWithProof(0,0, vmcall_array[0], vmcall_array[1], vmcall_array[2], vmcall_array[3])).to.not.be.rejected;     // gather 4 lumber
  
//           let new_tgs = await zkWitches.connect(p1).GetTGS();
//           expect(new_tgs.players[0].lumber).to.eq((2+4));   
//       });
  
//       it("Player 1 can make an normal action with resource check", async function() 
//       {
//           let old_tgs = await zkWitches.connect(p1).GetTGS();
//           expect(old_tgs.players[0].food == (2)).to.be.true;    
  
//           await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.not.be.rejected;        // gather 1 food
  
//           let new_tgs = await zkWitches.connect(p1).GetTGS();
//           expect(new_tgs.players[0].food == (2+1)).to.be.true;    
//       });
  
//       it("Players can go in order", async function() 
//       {        
//           let p_players : Signer[]= [p1, p2, p3, p4, p1];
//           for (let i = 0; i< p_players.length; i++)
//           {
//               await expect(zkWitches.connect(p_players[i]).ActionNoProof(0,0,0)).to.not.be.rejected;        
//           }
//       });
  
//       it("Players can't go out of order", async function() 
//       {
//           // Not their turns
//           await expect(zkWitches.connect(p2).ActionNoProof(0,0,0)).to.be.rejected;
//           await expect(zkWitches.connect(p3).ActionNoProof(0,0,0)).to.be.rejected;        
//           // His turn
//           await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.not.be.rejected;        
//           // Now their turns
//           await expect(zkWitches.connect(p2).ActionNoProof(0,0,0)).to.not.be.rejected;
//           await expect(zkWitches.connect(p3).ActionNoProof(0,0,0)).to.not.be.rejected;  
//       });
  
//       it("3 Players can surrender and the game ends", async function() 
//       {
//           let p_surrenders : Signer[]= [p2, p3, p4];
//           for (let i = 0; i< p_surrenders.length; i++)
//           {
//               await expect(zkWitches.connect(p_surrenders[i]).Surrender()).to.not.be.rejected;        
//           }
  
//           let tgs = await zkWitches.connect(p1).GetTGS();
//           expect(tgs.shared.stateEnum).to.equal(0);   
  
//           await expect(zkWitches.connect(p1).Surrender()).to.be.rejected;
//           await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.be.rejected;          
//       });
  
//       it("Game continues when a player surrenders on their turn", async function() 
//       {
//           await expect(zkWitches.connect(p1).Surrender()).to.not.be.rejected;        
//           await expect(zkWitches.connect(p2).ActionNoProof(0,0,0)).to.not.be.rejected;        
//       });
  
//       it("Game ends due to resources", async function() 
//       {
//           // They leave
//           await expect(zkWitches.connect(p3).Surrender()).to.not.be.rejected;        
//           await expect(zkWitches.connect(p4).Surrender()).to.not.be.rejected; 
  
//           // start (2,2), (2,2)
//           // both farm 8 food ((10, 2), (10, 2))
//           for (let i = 0; i< 8; i++)
//           {
//               await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.not.be.rejected;        
//               await expect(zkWitches.connect(p2).ActionNoProof(0,0,0)).to.not.be.rejected; 
//           }
  
//           // p1 farm 8 food, p2 gets 8 lumber ((18, 2), (10, 10))
//           for (let i = 0; i< 8; i++)
//           {
//               await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.not.be.rejected;        
//               await expect(zkWitches.connect(p2).ActionNoProof(1,0,0)).to.not.be.rejected; 
//           }
//           // p2 is the winner at the end of his turn
  
//           let tgs = await zkWitches.connect(p1).GetTGS();        
//           expect(tgs.shared.stateEnum).to.equal(0);
          
//           await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.be.rejected;        
//       });
  
//       it("Witch Accusation Duel with events", async function() 
//       {
//           // They leave
//           await expect(zkWitches.connect(p3).Surrender()).to.not.be.rejected;        
//           await expect(zkWitches.connect(p4).Surrender()).to.not.be.rejected; 
  
//           // Gather some resources
//           await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.not.be.rejected;        
//           await expect(zkWitches.connect(p2).ActionNoProof(0,0,0)).to.not.be.rejected; 
//           await expect(zkWitches.connect(p1).ActionNoProof(1,0,0)).to.not.be.rejected;        
//           await expect(zkWitches.connect(p2).ActionNoProof(1,0,0)).to.not.be.rejected; 
//           // (3,3), (3,3)
//           // I, p1, accuse p2 of having a farmer witch
//           await expect(zkWitches.connect(p1).ActionNoProof(3,1,0)).to.not.be.rejected;   
  
//           var nwcall_array = JSON.parse("[" + fs.readFileSync(nwcall) + "]");
//           // I, p2 prove that I don't
//           await expect(zkWitches.connect(p2).RespondAccusation_NoWitch(nwcall_array[0], nwcall_array[1], nwcall_array[2], nwcall_array[3])).to.not.be.rejected;
  
//           // I, p2, accuse p1 of having a lumberjack witch
//           await expect(zkWitches.connect(p2).ActionNoProof(3,0,1)).to.not.be.rejected;
//           // I, p1, have to admit it.
//           await expect(zkWitches.connect(p1).RespondAccusation_YesWitch()).to.not.be.rejected;   
     
//           // Game Over.
//           let tgs = await zkWitches.connect(p1).GetTGS();        
//           expect(tgs.shared.stateEnum).to.equal(0);       
          
//           // Check events
//           let filter = zkWitches.filters.AccusationResponse(0);
//           let accusationResponses = await zkWitches.queryFilter(filter);
  
//           let p2_success_to_p1_accusation = accusationResponses.filter((v,i,a) => v.args.slot == 1);
//           expect(p2_success_to_p1_accusation[0].args.innocent).to.be.true;
  
//           let p1_fail_to_p2_accusation = accusationResponses.filter((v,i,a) => v.args.slot == 0);
//           expect(p1_fail_to_p2_accusation[0].args.innocent).to.be.false;
//       });
  
//       it("Join Events", async function() 
//       {
//           let filter = zkWitches.filters.Join(0);
//           let joinEvents = await zkWitches.queryFilter(filter);
  
//           expect(joinEvents.length).equals(4);
//       });
  
//       it("Action Events", async function() 
//       {
//           await expect(zkWitches.connect(p1).ActionNoProof(0,0,0)).to.not.be.rejected;        
//           await expect(zkWitches.connect(p2).ActionNoProof(0,0,0)).to.not.be.rejected;        
  
//           let filter = zkWitches.filters.Action(0);
//           let joinEvents = await zkWitches.queryFilter(filter);
  
//           expect(joinEvents.length).equals(2);
//       });
  
//       it("Loss Event", async function() 
//       {
//           await expect(zkWitches.connect(p1).Surrender()).to.not.be.rejected;        
  
//           let filter = zkWitches.filters.VictoryLoss(0);
//           let joinEvents = await zkWitches.queryFilter(filter);
  
//           expect(joinEvents.length).equals(1);
//       });
  
//       // uint8 constant LOSS_SURRENDER = 0;
//       // uint8 constant LOSS_KICK = 1;
//       // uint8 constant LOSS_INQUISITION = 2;
//       // uint8 constant LOSS_RESOURCES = 3;
//       // uint8 constant VICTORY_RESOURCES = 4;
//       // uint8 constant VICTORY_ELIMINATED = 5;
  
//       it("Two Games with events", async function() 
//       {
//           {
//               await expect(zkWitches.connect(p1).Surrender()).to.not.be.rejected;        
//               await expect(zkWitches.connect(p2).Surrender()).to.not.be.rejected;        
//               await expect(zkWitches.connect(p3).Surrender()).to.not.be.rejected;        
  
//               let filter = zkWitches.filters.VictoryLoss(0);
//               let victoryLossEvents = await zkWitches.queryFilter(filter);
  
//               expect(victoryLossEvents.length).equals(4);
  
//               let expectedWinEvent = victoryLossEvents.filter((v,i,a) => v.args.victoryLossType == 5)[0];
//               let expectedLossEvents = victoryLossEvents.filter((v,i,a) => v.args.victoryLossType == 0);
  
//               expect(expectedWinEvent.args.slot).to.equal(3);
//               expect(expectedLossEvents.length).to.equal(3);
//           }
  
//           // second game begins
//           {
//               await expect(AllJoin()).to.not.be.rejected;
  
//               await expect(zkWitches.connect(p1).Surrender()).to.not.be.rejected;        
//               await expect(zkWitches.connect(p2).Surrender()).to.not.be.rejected;
  
//               await expect(zkWitches.connect(p4).Surrender()).to.not.be.rejected;        
  
//               let filter = zkWitches.filters.VictoryLoss(1);
//               let victoryLossEvents = await zkWitches.queryFilter(filter);
  
//               expect(victoryLossEvents.length).equals(4);
  
//               let expectedWinEvent = victoryLossEvents.filter((v,i,a) => v.args.victoryLossType == 5)[0];
//               let expectedLossEvents = victoryLossEvents.filter((v,i,a) => v.args.victoryLossType == 0);
  
//               expect(expectedWinEvent.args.slot).to.equal(2);
//               expect(expectedLossEvents.length).to.equal(3);
//           }
//       });
//   });




// // //   const random_1 = await (await vigil.generateNumber());
// // //   console.log('First Random:',random_1)
// // //   const random_2 = await (await vigil.generateNumber());
// // //   console.log('Second Random:', random_2)

// // // const vectors = require('./Deoxys-II-256-128.json');

// //   // let key = new Uint8Array(Buffer.from(vectors.Key, 'base64'));
// //   // let nonce = new Uint8Array(Buffer.from(vectors.Nonce, 'base64'));
// //   // let aad = new Uint8Array(Buffer.from(vectors.AADData, 'base64'));
// //   // let msg = new Uint8Array(Buffer.from(vectors.MsgData, 'base64'));

// //   // let aead = new deoxysii.AEAD(key, useUnsafeVartime);

// //   // for (let i = 0; i < vectors.KnownAnswers.length; i++) {
// //   //   const vector = vectors.KnownAnswers[i];

// //   //   const m = msg.subarray(0, vector.Length);
// //   //   const a = aad.subarray(0, vector.Length);

// //   //   let ciphertext = aead.encrypt(nonce, m, a);

// //   //   const vecCt = new Uint8Array(Buffer.from(vector.Ciphertext, 'base64'));
// //   //   const vecTag = new Uint8Array(Buffer.from(vector.Tag, 'base64'));

// //   //   const expectedCipher = new Uint8Array(vecCt.length + vecTag.length);
// //   //   expectedCipher.set(vecCt, 0);
// //   //   expectedCipher.set(vecTag, vecCt.length);
// //   //   assert.deepEqual(ciphertext, expectedCipher, 'Ciphertext + Tag: ' + i);

// //   //   let plaintext = aead.decrypt(nonce, ciphertext, a);
// //   //   assert.deepEqual(plaintext, m, 'Plaintext: ' + i);


// //     // vigil.on('Deoxsys_Encrypt', (encrypted, nonce, event) => {
// //     //   console.log(`Deoxsys_Encrypt event triggered`);
// //     //   console.log(`Encrypted data: ${encrypted}`);
// //     //   console.log(`Nonce: ${nonce}`)

// //     //   console.log(`Event details:`, event);
// //     // });

    // async function findSecretCard() {
    //   // Listen for the Keccak_Encrypt event
    // junk.on('Keccak_Encrypt', (encrypted) => {
    //   console.log('Encrypted event detected:', encrypted);
  
    //   const secretKey: string = "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0";

    //   // Loop through possible cards (0-51) to find the secret card
    //   for (let card = 0; card <= 51; card++) {
    //     // Generate the keccak256 hash of the concatenated secret key and card
    //     console.log("generating keccak hash")
    //     const hash = ethers.keccak256(ethers.solidityPacked(['bytes', 'uint8'], [secretKey, card]));
  
    //     // Check if the generated hash matches the encrypted data from the event
    //     if (hash === ethers.hexlify(encrypted)) {
    //       console.log(`Found secret card: ${card}`);
    //       return card; // Exiting the function as we found the matching card
    //     }
    //   }
  
// //       console.log('Secret card not found.');
// //     });

// //     // const cards = await (await vigil.generateCards(6));
// //     // console.log('cards: ', cards)

// //     console.log('starting hello world encryption: ')
// //     const encrypted_tx = await junk.keccak_hello_world();
// //     console.log('tx hash for hello world encryption: ', encrypted_tx.hash)
// //     // const r = await encrypted_tx.wait();
// //     // console.log("full result:", r)
// //     // const myEvent = r?.events?.filter((x) => x.event === "Deoxsys_Encrypt")[0];
// //     // console.log('event:', myEvent)
// }

// async function generateTraffic(n: number) {
//   const signer = await ethers.provider.getSigner();
//   for (let i = 0; i < n; i++) {
//     await signer.sendTransaction({
//       to: "0x000000000000000000000000000000000000dEaD",
//       value: ethers.parseEther("1.0"),
//       data: "0x"
//     });
//   };
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });