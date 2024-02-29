
// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import chai = require("chai");
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
// import { BigNumber } from "ethers"; // Assuming you're using ethers.js or a similar library

import { Poker, PokerHandValidation, PokerToken } from "../typechain-types/contracts";
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
  
  let two_player_game_salts = [ player1_salt, player2_salt ]
  let four_player_game_salts = [player1_salt, player2_salt, player3_salt, player4_salt]

  const BETTING_ROUND_PREFLOP = 0;
  const BETTING_ROUND_FLOP = 1;
  const BETTING_ROUND_TURN = 2;
  const BETTING_ROUND_RIVER = 3;

  const PLAYER_ACTION_CALL = 0;
  const PLAYER_ACTION_RAISE = 1;
  const PLAYER_ACTION_CHECK = 2;
  const PLAYER_ACTION_FOLD = 3;

  // todo use enum
  const HAND_TYPE_NO_HAND = 0;
  const HAND_TYPE_HIGH_CARD = 1;
  const HAND_TYPE_ONE_PAIR = 2;
  const HAND_TYPE_TWO_PAIR = 3;
  const HAND_TYPE_THREE_OF_A_KIND = 4;
  const HAND_TYPE_STRAIGHT = 5;
  const HAND_TYPE_FLUSH = 6;
  const HAND_TYPE_FULL_HOUSE = 7;
  const HAND_TYPE_FOUR_OF_A_KIND = 8;
  const HAND_TYPE_STRAIGHT_FLUSH = 9;

  const FIRST_HAND = 0;
  const SECOND_HAND = 1;

  function zip<T, U>(array1: T[], array2: U[]): [T, U][] {
    return array1.map((item, index) => [item, array2[index]]);
  }

  async function get_hole_cards_from_encrypted(player: Signer, salt: number, hand_id: number): Promise<number[]>
  {
    let encrypted_cards = await poker.encryptedPlayerCards(await player.getAddress(), TABLE_ID, hand_id);
    console.log("cards - encrypted" + encrypted_cards);

    let decrypted_cards = decrypt_hole_cards(salt, TABLE_ID, hand_id, encrypted_cards);
    console.log("cards - decrypted" + decrypted_cards);

    return [decrypted_cards.card1, decrypted_cards.card2];
  }

  async function buildMyCards(player: Signer, salt: number, hand: number): Promise<Number[]> {
    let hole_cards = await get_hole_cards_from_encrypted(player, salt, hand); // Destructure the result of bar into bar0 and bar1
    
    const inputs = [0, 1, 2, 3, 4];
    const promiseArray = inputs.map(value => poker.revealedCommunityCards(TABLE_ID, hand, value)); // Create an array of promises
    const tuples = await Promise.all(promiseArray); // Wait for all promises to resolve to tuples
    const cards = tuples.map((r) => Number(r.card)); // Extract only the "card" part from each tuple

    // Combine all values into a single array
    return [hole_cards[0], hole_cards[1], ...cards];
  }

// // Example usage
// const array1 = [1, 2, 3]; // Array of numbers
// const array2 = ['a', 'b', 'c']; // Array of strings

// const zippedArray = zip(array1, array2);
// console.log(zippedArray); // Output: [[1, 'a'], [2, 'b'], [3, 'c']]

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

    let factoryLib = await ethers.getContractFactory('PokerHandValidation');
    let lib = await factoryLib.deploy() as PokerHandValidation;
    let lib_deployed = await lib.waitForDeployment();

    let factory1 = await ethers.getContractFactory('Poker', {
      libraries: {
        PokerHandValidation: (await lib_deployed.getAddress()),
      },
    });
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
    console.log("2P SETUP");
    await poker.connect(player1).createTable(MINIMUM_BUY_IN_AMOUNT, TWO_PLAYERS, BIG_BLIND, await poker_token.getAddress());

    await poker.connect(player1).buyIn(TABLE_ID, BUY_IN_AMOUNT, player1_salt);
    await poker.connect(player2).buyIn(TABLE_ID, BUY_IN_AMOUNT, player2_salt);
  }

  async function four_player_table_setup() 
  {
    console.log("4P SETUP");
    await poker.connect(player1).createTable(MINIMUM_BUY_IN_AMOUNT, FOUR_PLAYERS, BIG_BLIND, await poker_token.getAddress());

    await poker.connect(player1).buyIn(TABLE_ID, BUY_IN_AMOUNT, player1_salt);
    await poker.connect(player2).buyIn(TABLE_ID, BUY_IN_AMOUNT, player2_salt);
    await poker.connect(player3).buyIn(TABLE_ID, BUY_IN_AMOUNT, player3_salt);
    await poker.connect(player4).buyIn(TABLE_ID, BUY_IN_AMOUNT, player4_salt);
  }

  async function four_player_advance_to_flop(do_setup : Boolean) 
  {
    if (do_setup) {
      await four_player_table_setup()
    }

    console.log("PREFLOP - EVERYONE RAISES");

    for (let [index, player] of four_player_game_players.entries()) 
    {
      await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 20);
    }

    console.log("PREFLOP - EVERYONE EXCEPT P4 CALLS");

    for (let [index, player] of four_player_game_players.entries()) 
    {
      if (index != 3) 
      {
        await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CALL, 0);
      }
    }
  }

  async function four_player_advance_to_showdown(do_setup: Boolean) 
  {
    await four_player_advance_to_flop(do_setup);

    console.log("FLOP - EVERYONE CHECKS");
    for (let player of four_player_game_players) 
    {
      await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    }

    console.log("TURN - EVERYONE CHECKS");
    for (let player of four_player_game_players) 
    {
      await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    }

    console.log("RIVER - EVERYONE CHECKS");
    for (let player of four_player_game_players) 
    {
      await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    }
  }

  async function four_player_submit_showdown(hand: number) 
  {
    console.log("SHOWDOWN - EVERYONE SUBMITS SHOWDOWN");

    // For the hardcoded cards, we have 
    // [0, 1] [2, 3] [4, 5] [6, 7] --- [8 9 10 11 12]
    // technically - 
    // everyone has a straight flush with the community cards - but ignore for now
    // Player1, Player2, Player3, will submit Flushes combining their hole and community
    // Player4 will submit a Straight Flush combining their hole and community

    let showdown_hand_submissions : [Signer, number, number[]][]= 
    [
      [player1, HAND_TYPE_FLUSH, [4,3,2,1,0]], // Flush 10 9 8 1 0
      [player2, HAND_TYPE_FLUSH, [4,3,2,1,0]], // Flush 10 9 8 3 2
      [player3, HAND_TYPE_FLUSH, [4,3,2,1,0]], // Flush 10 9 8 4 5
      [player4, HAND_TYPE_STRAIGHT_FLUSH, [4,3,2,1,0]], // Straight Flush 10 9 8 7 6  - Winner
    ]

    for (let shs of showdown_hand_submissions) 
    {
      let address = await shs[0].getAddress();
      let hand_type = BigInt(shs[1]);

      let showdownHand : PokerHandValidation.ShowdownHandStruct = {
        playerAddress: address, // Example Ethereum address
        h: BigInt(hand_type), // BigNumberish can be a string for large numbers
        cardIndexes: [
          BigInt(shs[2][0]),
          BigInt(shs[2][1]),
          BigInt(shs[2][2]),
          BigInt(shs[2][3]),
          BigInt(shs[2][4]),
        ],
      };

      await poker.connect(shs[0]).addShowDownHand(TABLE_ID, hand, showdownHand);
    }
  }

  async function four_player_play_entire_game(do_setup: Boolean, hand: number) 
  {
    await four_player_advance_to_showdown(do_setup);
    await four_player_submit_showdown(hand);
  }

  async function summarize_chips_four_players(betting_round: number) 
  {
    console.log("Chip Summary")

    let br = await poker.bettingRounds(TABLE_ID, betting_round);

    console.log("br.turn " + br.turn, "br.highestchip " + br.highestChip);

    let br_chips = await poker.bettingRoundChips(TABLE_ID, betting_round);

    console.log("All Betting Round chips " + br_chips);

    for (const player_index of [0,1,2,3]) 
    {
      let chips = await poker.chips(await four_player_game_players[player_index].getAddress(), TABLE_ID);
      console.log("Player " + (1 + player_index) + " Chips Remaining: "+ chips);
      console.log("Player " + (1 + player_index) + " Chips Contributed To Pot this Betting Round: " + br_chips[player_index])
    }

    console.log("End Summary")
  }

  it('First Player leaves 2p game that has not started', async () => 
  {
    await poker.connect(player1).createTable(MINIMUM_BUY_IN_AMOUNT, TWO_PLAYERS, BIG_BLIND, await poker_token.getAddress());

    await poker.connect(player1).buyIn(TABLE_ID, BUY_IN_AMOUNT, player1_salt);
    await poker.connect(player1).requestToLeave(TABLE_ID);

    let table_players = await poker.tablePlayers(TABLE_ID)
    expect(table_players.length).to.equal(0, "Player left game");
  })


  it('Two Player Game Gives them decryptable encrypted Cards, + Raise', async () => {
    await two_player_table_setup(); 

    // confirm that there are cards
    for (let [player, salt] of zip(two_player_game_players, two_player_game_salts)) 
    {

    }

    let br_chips = await poker.bettingRoundChips(TABLE_ID, 0);
    console.log("All Betting Round chips " + br_chips);

    for (const player_index of [0,1]) 
    {
      let chips = await poker.chips(await two_player_game_players[player_index].getAddress(), TABLE_ID);
      console.log("Player " + (1 + player_index) + " Chips Remaining: "+ chips);
      console.log("Player " + (1 + player_index) + " Chips Contributed To Pot this Betting Round: " + br_chips[player_index])
    }

    let table = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table.currentBettingRound);

    let betting_round = await poker.bettingRounds(TABLE_ID, 0);
    console.log("Current player turn " + betting_round.turn);
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
    await four_player_advance_to_flop(true); 

    console.log("Pot is now: " + (await poker.tables(TABLE_ID)).pot);

    console.log

    for (let i in [0, 1, 2, 3, 4]) 
    {
      let community_card_expected = await poker.revealedCommunityCards(TABLE_ID, FIRST_HAND, i);
      console.log("Community Card #: " + i + " " + community_card_expected[0] + " Valid?: " + community_card_expected[1])
    }
    let table = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table.currentBettingRound);
    console.log("*")

    for (let player of four_player_game_players) 
    {
        await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0)
    }

    for (let i in [0, 1, 2, 3, 4]) 
    {
      let community_card_expected = await poker.revealedCommunityCards(TABLE_ID, FIRST_HAND, i);
      console.log("Community Card #: " + i + " " + community_card_expected[0] + " Valid?: " + community_card_expected[1])
    }
    let table2 = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table2.currentBettingRound);
    console.log("*")

    for (let player of four_player_game_players) 
    {
        await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0)
    }

    for (let i in [0, 1, 2, 3, 4]) 
    {
      let community_card_expected = await poker.revealedCommunityCards(TABLE_ID, FIRST_HAND, i);
      console.log("Community Card #: " + i + " " + community_card_expected[0] + " Valid?: " + community_card_expected[1])
    }
    let table3 = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table3.currentBettingRound);
    console.log("*")

    for (let player of four_player_game_players) 
    {
        await poker.connect(player).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0)
    }

    for (let i in [0, 1, 2, 3, 4]) 
    {
      let community_card_expected = await poker.revealedCommunityCards(TABLE_ID, FIRST_HAND, i);
      console.log("Community Card #: " + i + " " + community_card_expected[0] + " Valid?: " + community_card_expected[1])
    }
    let table4 = await poker.tables(TABLE_ID);
    console.log("Current Betting Round: " + table4.currentBettingRound);
    console.log("*")
  });

  it('Four Player Game - Player 1 Folds', async () => 
  {
    await four_player_table_setup(); 

    // Everyone Rasing

    let br_before = await poker.bettingRounds(TABLE_ID, BETTING_ROUND_PREFLOP);

    console.log("br.turn " + br_before.turn, "br.highestChip " + br_before.highestChip);

    await poker.connect(player1).playHand(TABLE_ID, PLAYER_ACTION_FOLD, 0);
    await poker.connect(player2).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 20);
    await poker.connect(player3).playHand(TABLE_ID, PLAYER_ACTION_CALL, 0);
    await poker.connect(player4).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 20);

    let br_after = await poker.bettingRounds(TABLE_ID, BETTING_ROUND_PREFLOP);

    console.log("br.turn " + br_after.turn, "br.highestChip " + br_after.highestChip);

    expect(br_after.turn).to.equal(1, "after round of betting with player1 fold - active player should have index 1 (player2)");

    await poker.connect(player2).playHand(TABLE_ID, PLAYER_ACTION_CALL, 0);
    await poker.connect(player3).playHand(TABLE_ID, PLAYER_ACTION_CALL, 0);

    // complete the round

    console.log("BR 1 finished")

    let br_after2 = await poker.bettingRounds(TABLE_ID, BETTING_ROUND_PREFLOP);
    console.log("br.turn " + br_after2.turn, "br.highestChip " + br_after2.highestChip);

    // go through the next round skipping p1
    await poker.connect(player2).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    await poker.connect(player3).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    await poker.connect(player4).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);

    console.log("BR 2 finished")

    // go through the next round skipping p1
    await poker.connect(player2).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    await poker.connect(player3).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
    await poker.connect(player4).playHand(TABLE_ID, PLAYER_ACTION_CHECK, 0);
  });

  it('Four Player Game - Showdown Tests', async () => 
  {
    await four_player_advance_to_showdown(true); 

    let pot = (await poker.tables(TABLE_ID)).pot;
    console.log("Pot is: "+ pot);

    for (let [signer, salt] of zip(four_player_game_players, four_player_game_salts)) 
    {
      console.log("Player Cards: " + await buildMyCards(signer, salt, 0));
    }

    // Should fail, nobody can play hands during showdown
    // await poker.connect(player1).playHand(TABLE_ID, PLAYER_ACTION_RAISE, 40);

    await four_player_submit_showdown(FIRST_HAND);

    let table_state = (await poker.tables(TABLE_ID)).state
    console.log("Table state is ", table_state)

    for (let player of four_player_game_players) 
    {
      let player_chips = await poker.chips(await player.getAddress(), TABLE_ID);
      console.log("This Player has " + player_chips + " chips");
    }
  });

  it('Four Player Game - Second Hand Game Tests', async () => 
  {
     await four_player_play_entire_game(true, FIRST_HAND);
     await four_player_play_entire_game(false, SECOND_HAND);
  });


});