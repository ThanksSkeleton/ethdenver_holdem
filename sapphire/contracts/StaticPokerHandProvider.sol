// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./PokerHandProvider.sol";

contract StaticPokerHandProvider is PokerHandProvider 
{
    function register_player(uint table_id, uint salt) internal
    {
        // anyone can put random junk in here I suppose, even if they're not playing
        // player can overwrite their salt too, salt is used atomically so it doesn't matter
        address player = msg.sender;
        salts[player][table_id] = salt;
    }   

    // deal all cards, 
    // secretly store the community cards and the player cards, 
    // and broadcast the encrypted player cards 
    function populate_cards(uint table_id, uint handNum, address[] memory players) internal {
        uint[] memory cards = generateCards(players.length*2 + 5);
        for (uint player_index = 0; player_index < players.length; player_index++) {
            uint hole_1_index = player_index * 2; 
            uint hole_2_index = player_index * 2 + 1; 

            uint hole_1_card = uint8(cards[hole_1_index]);
            uint hole_2_card = uint8(cards[hole_2_index]);

            // store the cards secretly on chain
            playerCards[players[player_index]][table_id][handNum] = PlayerCards(hole_1_card, hole_1_card);

            uint salt = salts[players[player_index]][table_id];

            bytes memory encrypted_card_1  = abi.encodePacked(keccak256(abi.encodePacked(salt, table_id, handNum, hole_1_card)));
            bytes memory encrypted_card_2 = abi.encodePacked(keccak256(abi.encodePacked(salt, table_id, handNum, hole_2_card)));

            encryptedPlayerCards[players[player_index]][table_id][handNum] = EncryptedCards(encrypted_card_1, encrypted_card_2);

            // encrypt and emit the cards back to the player
            emit EncryptedCardsEvent(players[player_index], table_id, handNum, 
                encrypted_card_1,
                encrypted_card_2
            );
        }

        communityCards[table_id][handNum] = CommunityCards 
        (
           [ 
                cards[2 * players.length],
                cards[2 * players.length+1],
                cards[2 * players.length+2],
                cards[2 * players.length+3],
                cards[2 * players.length+4]
            ]
        );
    }

    function generateCards(uint howMany) private pure returns (uint[] memory) {
        uint[] memory toReturn = new uint[](howMany);
        uint count = 0;
        
        //DUMMY
        while (count < howMany) {
            toReturn[count] = count;
            count++;
        }
        
        return toReturn;
    }

    function contains(uint[] memory array, uint value, uint arrayLength) private pure returns (bool) {
        for (uint i = 0; i < arrayLength; i++) {
            if (array[i] == value) {
                return true;
            }
        }
        return false;
    }
}