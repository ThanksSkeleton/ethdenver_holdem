
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
  
  describe('Poker Hand Validation Tests', () => {
    let poker : Poker;
    let lib : CORE_PHV;
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
  
    it("TODO", async function () {
        
    });

  });