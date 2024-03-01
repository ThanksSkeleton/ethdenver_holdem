
// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import chai = require("chai");
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers } from "hardhat";
  import { Poker, PokerHandValidation as PHV, } from "../typechain-types/contracts/Poker";
  import { PokerToken } from "../typechain-types/contracts/PokerToken"
  import { PokerHandValidation as CORE_PHV } from "../typechain-types/contracts/PokerHandValidation";
  import { ContractFactory, Contract, Signer } from "ethers";
  const { hash_decrypt_card, decrypt_hole_cards } = require('../scripts/decrypt_from_salt.js');
  
  import chaiAsPromised = require("chai-as-promised");
  
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  
  describe('Simple Pure Function Tests', () => {
    let poker : Poker;
    let lib : CORE_PHV;
    let poker_token: PokerToken;
  
    let creator : Signer;
  
    let player1 : Signer;
    let player2 : Signer;
    let player3 : Signer;
    let player4 : Signer;
  
    let PLAYER_1_ADDRESS: string;
    let PLAYER_2_ADDRESS: string;
    let PLAYER_3_ADDRESS: string;

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
  
        // copy paste

      const [crx, px1, px2, px3, px4, stx] = await ethers.getSigners();
      creator = crx;
      player1 = px1;
      player2 = px2;
      player3 = px3;
      player4 = px4;
      stranger = stx;
      
      PLAYER_1_ADDRESS = await player1.getAddress();
      PLAYER_2_ADDRESS = await player2.getAddress();
      PLAYER_3_ADDRESS = await player3.getAddress();

      two_player_game_players = [player1, player2];
      four_player_game_players = [player1, player2, player3, player4]
  
      let factoryLib = await ethers.getContractFactory('PokerHandValidation');
      let lib = await factoryLib.deploy() as CORE_PHV;
      let lib_deployed = await lib.waitForDeployment();
  
      let factory1 = await ethers.getContractFactory('Poker', {
        libraries: {
          PokerHandValidation: (await lib_deployed.getAddress()),
        },
      });
      poker = await factory1.deploy() as Poker;
      await poker.waitForDeployment();
  
      let token_factory = await ethers.getContractFactory('PokerToken');
      poker_token = await token_factory.deploy(poker.getAddress()) as PokerToken;
      await poker_token.waitForDeployment();
      await poker_token.setPoker(await poker.getAddress(), true)
  
      poker_token.mint(await player1.getAddress(), 1000);
      poker_token.mint(await player2.getAddress(), 1000);
      poker_token.mint(await player3.getAddress(), 1000);    
      poker_token.mint(await player4.getAddress(), 1000);    
    });
  
        it("All 4 values are the same and nobody has folded", async function () {
            const chips = [100, 100, 100, 100];
            const hasFolded = [false, false, false, false];
            const result = await lib.pot_is_right(chips, hasFolded);
            expect(result).to.be.true;
        });
    
        it("3 values are the same and one is different and nobody has folded", async function () {
            const chips = [100, 100, 200, 100];
            const hasFolded = [false, false, false, false];
            const result = await lib.pot_is_right(chips, hasFolded);
            expect(result).to.be.false;
        });
    
        it("3 values are the same and one is different and the different one has folded", async function () {
            const chips = [100, 100, 200, 100];
            const hasFolded = [false, false, true, false];
            const result = await lib.pot_is_right(chips, hasFolded);
            expect(result).to.be.true;
        });

        it("Normal Sequence Test", async function () {
            const currentTurn = 0;
            const shouldSkip = [false, false, false, false];
            expect(await lib.nextTurn(currentTurn, shouldSkip)).to.equal(1);
        });

        it("End of Array Looping Test", async function () {
            const currentTurn = 3;
            const shouldSkip = [false, false, false, false];
            expect(await lib.nextTurn(currentTurn, shouldSkip)).to.equal(0);
        });

        it("Single Skip Test", async function () {
            const currentTurn = 1;
            const shouldSkip = [false, true, false, false];
            expect(await lib.nextTurn(currentTurn, shouldSkip)).to.equal(2);
        });

        it("Multiple Skips Test", async function () {
            const currentTurn = 0;
            const shouldSkip = [false, true, true, false];
            expect(await lib.nextTurn(currentTurn, shouldSkip)).to.equal(3);
        });

        it("All Players Active Test", async function () {
            const hasFolded = [false, false, false, false];
            const [firstActivePlayerIndex, lastActivePlayerIndex] = await lib.first_last_active_player(hasFolded);
            expect(firstActivePlayerIndex).to.equal(0, "First active player index should be 0");
            expect(lastActivePlayerIndex).to.equal(hasFolded.length - 1, "Last active player index should be last index of the array");
          });
        
          it("Mixed Active and Folded Players Test", async function () {
            const hasFolded = [true, false, false, true, false];
            const [firstActivePlayerIndex, lastActivePlayerIndex] = await lib.first_last_active_player(hasFolded);
            expect(firstActivePlayerIndex).to.equal(1, "First active player index should be 1");
            expect(lastActivePlayerIndex).to.equal(4, "Last active player index should be 4");
          });

          it("Only One Player Left Test", async function () {
            const hasFolded = [true, true, false, true];
            const [firstActivePlayerIndex, lastActivePlayerIndex] = await lib.first_last_active_player(hasFolded);
            expect(firstActivePlayerIndex).to.equal(2, "First active player index should be 2 for the only active player");
            expect(lastActivePlayerIndex).to.equal(2, "Last active player index should also be 2 for the only active player");
          });

          it("Should return correct array with some addresses removed", async function () {
            // Obtaining addresses using 'getAddress()' method
            const addresses = [
                await player1.getAddress(), 
                await player2.getAddress(), 
                await player3.getAddress(), 
                await player4.getAddress()
            ];
            const shouldBeRemoved = [false, true, false, true]; // Indicating which addresses to remove
    
            // Expected result: an array with the addresses of player1 and player3, as player2 and player4 are marked to be removed
            const expectedAddresses = [await player1.getAddress(), await player3.getAddress()];
    
            // Calling the removeAddresses function with the test data
            const result = await lib.removeAddresses(addresses, shouldBeRemoved);
    
            // Asserting that the function result matches the expected output
            expect(result).to.deep.equal(expectedAddresses);
        });

        it("Should correctly identify a standard straight", async function () {
          // Standard straight: 10-9-8-7-6 (using the second suit, i.e., adding 13 to each rank)
          const cards = [9, 8, 7, 6, 5].map(rank => rank + (1 * 13)); // Second suit, for simplicity
          expect(await lib.is_straight(cards)).to.be.true;
        });
      
        it("Should correctly identify an Ace-to-5 straight", async function () {
          // Ace-to-5 straight: 5-4-3-2-A (Ace as low, using the second suit)
          const cards = [3, 2, 1, 0, 12].map(rank => rank + (1 * 13)); // Second suit, for simplicity
          expect(await lib.is_straight(cards)).to.be.true;
        });
      
        it("Should correctly identify a non-straight hand", async function () {
          // Non-straight: Mixed hand, descending values (using the second suit)
          const cards = [11, 9, 7, 5, 3].map(rank => rank + (1 * 13)); // Second suit, for simplicity
          expect(await lib.is_straight(cards)).to.be.false;
        });

          // Positive test for One Pair
  it("should validate a One Pair hand correctly", async function () {
    const handType = 2; // Assuming One Pair is represented by 2
    const cards = [0, 13, 3, 4, 6]; // Pair of Twos and other different cards
    expect(await lib.hand_valid(handType, cards)).to.be.true;
  });

  // Positive test for Two Pair
  it("should validate a Two Pair hand correctly", async function () {
    const handType = 3; // Assuming Two Pair is represented by 3
    const cards = [0, 13, 4, 17, 7]; // Pairs of Twos and Fives
    expect(await lib.hand_valid(handType, cards)).to.be.true;
  });

  // Positive test for Three of a Kind
  it("should validate a Three of a Kind hand correctly", async function () {
    const handType = 4; // Assuming Three of a Kind is represented by 4
    const cards = [12, 25, 38, 5, 8]; // Three Aces
    expect(await lib.hand_valid(handType, cards)).to.be.true;
  });

  // Positive test for Full House
  it("should validate a Full House hand correctly", async function () {
    const handType = 7; // Assuming Full House is represented by 7
    const cards = [0, 13, 4, 17, 4]; // Full House: Pair of Twos and Three Fives
    expect(await lib.hand_valid(handType, cards)).to.be.true;
  });

  // Positive test for Four of a Kind
  it("should validate a Four of a Kind hand correctly", async function () {
    const handType = 8; // Assuming Four of a Kind is represented by 8
    const cards = [12, 25, 38, 51, 3]; // Four Aces
    expect(await lib.hand_valid(handType, cards)).to.be.true;
  });

  // Negative test for Full House (actually Two Pair)
  it("should not validate a Full House when the hand is actually Two Pair", async function () {
    const handType = 7; // Assuming Full House is represented by 7, but we provide Two Pair
    const cards = [0, 13, 4, 17, 6]; // Two Pair: Twos and Fives, but not a Full House
    expect(await lib.hand_valid(handType, cards)).to.be.false;
  });

  it("A Higher Straight beats a Lower Straight", async function () {
    const players = [PLAYER_1_ADDRESS, PLAYER_2_ADDRESS]; // Use actual addresses here
    const hands = [
      [9, 8, 7, 6, 5], // Higher Straight
      [8, 7, 6, 5, 4], // Lower Straight
    ];
    const handType = 4; // Assuming Straight is represented by 4
    const winners = await lib.find_winners_poker(handType, players, hands);

    expect(winners).to.have.lengthOf(1);
    expect(winners[0]).to.equal(players[0]); // Higher Straight wins
  });

  it("A Higher Full House (10s and 4s) beats a Lower Full House (4s and 10s)", async function () {
    const players = [PLAYER_1_ADDRESS, PLAYER_2_ADDRESS]; // Use actual addresses here
    const hands = [
      [9, 9, 9, 3, 3], // 10s over 4s
      [3, 3, 3, 9, 9], // 4s over 10s
    ];
    const handType = 6; // Assuming FullHouse is represented by 6
    const winners = await lib.find_winners_poker(handType, players, hands);

    expect(winners).to.have.lengthOf(1);
    expect(winners[0]).to.equal(players[0]); // Higher Full House wins
  });

  it("A Pair of the same type is both winners", async function () {
    const players = [PLAYER_1_ADDRESS, PLAYER_2_ADDRESS, PLAYER_3_ADDRESS]; // Use actual addresses here
    const expected_winners = [PLAYER_2_ADDRESS, PLAYER_3_ADDRESS]; // Use actual addresses here

    const hands = [
      [6, 6, 4, 3, 2], // Pair of 7s
      [7, 7, 4, 3, 2], // Pair of 8s
      [7, 7, 4, 3, 2], // Pair of 8s, same as Player 1
    ];
    const handType = 1; // Assuming OnePair is represented by 1
    const winners = await lib.find_winners_poker(handType, players, hands);

    expect(winners).to.have.lengthOf(2);
    expect(winners).to.include.members(expected_winners); // Both are winners
  });

});