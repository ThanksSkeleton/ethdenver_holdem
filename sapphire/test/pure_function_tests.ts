
// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import chai = require("chai");
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers } from "hardhat";
  import { Poker, PokerHandValidation, PokerToken } from "../typechain-types/contracts";
  import { ContractFactory, Contract, Signer } from "ethers";
  const { hash_decrypt_card, decrypt_hole_cards } = require('../scripts/decrypt_from_salt.js');
  
  
  
  import chaiAsPromised = require("chai-as-promised");
  
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  
  describe('Simple Pure Function Tests', () => {
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
  
        // copy paste

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
  
        it("All 4 values are the same and nobody has folded", async function () {
            const chips = [100, 100, 100, 100];
            const hasFolded = [false, false, false, false];
            const result = await poker.pot_is_right(chips, hasFolded);
            expect(result).to.be.true;
        });
    
        it("3 values are the same and one is different and nobody has folded", async function () {
            const chips = [100, 100, 200, 100];
            const hasFolded = [false, false, false, false];
            const result = await poker.pot_is_right(chips, hasFolded);
            expect(result).to.be.false;
        });
    
        it("3 values are the same and one is different and the different one has folded", async function () {
            const chips = [100, 100, 200, 100];
            const hasFolded = [false, false, true, false];
            const result = await poker.pot_is_right(chips, hasFolded);
            expect(result).to.be.true;
        });

        it("Normal Sequence Test", async function () {
            const currentTurn = 0;
            const shouldSkip = [false, false, false, false];
            expect(await poker.nextTurn(currentTurn, shouldSkip)).to.equal(1);
        });

        it("End of Array Looping Test", async function () {
            const currentTurn = 3;
            const shouldSkip = [false, false, false, false];
            expect(await poker.nextTurn(currentTurn, shouldSkip)).to.equal(0);
        });

        it("Single Skip Test", async function () {
            const currentTurn = 1;
            const shouldSkip = [false, true, false, false];
            expect(await poker.nextTurn(currentTurn, shouldSkip)).to.equal(2);
        });

        it("Multiple Skips Test", async function () {
            const currentTurn = 0;
            const shouldSkip = [false, true, true, false];
            expect(await poker.nextTurn(currentTurn, shouldSkip)).to.equal(3);
        });

        it("All Players Active Test", async function () {
            const hasFolded = [false, false, false, false];
            const [firstActivePlayerIndex, lastActivePlayerIndex] = await poker.first_last_active_player(hasFolded);
            expect(firstActivePlayerIndex).to.equal(0, "First active player index should be 0");
            expect(lastActivePlayerIndex).to.equal(hasFolded.length - 1, "Last active player index should be last index of the array");
          });
        
          it("Mixed Active and Folded Players Test", async function () {
            const hasFolded = [true, false, false, true, false];
            const [firstActivePlayerIndex, lastActivePlayerIndex] = await poker.first_last_active_player(hasFolded);
            expect(firstActivePlayerIndex).to.equal(1, "First active player index should be 1");
            expect(lastActivePlayerIndex).to.equal(4, "Last active player index should be 4");
          });

          it("Only One Player Left Test", async function () {
            const hasFolded = [true, true, false, true];
            const [firstActivePlayerIndex, lastActivePlayerIndex] = await poker.first_last_active_player(hasFolded);
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
            const result = await poker.removeAddresses(addresses, shouldBeRemoved);
    
            // Asserting that the function result matches the expected output
            expect(result).to.deep.equal(expectedAddresses);
        });
  });