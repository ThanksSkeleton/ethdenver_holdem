// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ChatGPT is helping me a lot with this

contract PokerHandValidation {

    // Rank Represenation

    // Ace 0
    // Two 1
    // Three 2
    // Four 3
    // Five 4
    // Six 5
    // Seven 6
    // Eight 7
    // Nine 8
    // Ten 9
    // Jack 10
    // Queen 11
    // King 12

    // Suit Representation

    // Clubs : 0 
    // Diamonds : 1 
    // Hearts: 2
    // Spades: 3

    // so a card is 13*SUIT + RANK

    // So the Ace of spades 39 ( 13 * 3 + 0 )
    // And the Five of Clubs is 4 (13 * 0 + 4)
    // And the Ten of Diamonds is 22 (13 * 1 + 9) 

    // Helper method to extract the suit of a card
    function getSuit(uint card) internal pure returns (uint) {
        return card / 13;
    }

    // Helper method to extract the rank of a card
    function getRank(uint card) internal pure returns (uint) {
        return card % 13;
    }

    // Method to check if all cards in an array have the same rank
    function same_rank(uint[] memory cards) public pure returns (bool) {
        if (cards.length <= 1) return true;
        
        uint rank = getRank(cards[0]);
        for (uint i = 1; i < cards.length; i++) {
            if (getRank(cards[i]) != rank) {
                return false;
            }
        }
        return true;
    }

    // Method to check if all cards in an array have the same suit
    function same_suit(uint[] memory cards) public pure returns (bool) {
        if (cards.length <= 1) return true;

        uint suit = getSuit(cards[0]);
        for (uint i = 1; i < cards.length; i++) {
            if (getSuit(cards[i]) != suit) {
                return false;
            }
        }
        return true;
    }
    
    // Solidity Work
    // User is going to claim they have a poker hand
    // (HAND_TYPE, uint[5] indexes)
    // You get from the table
    // uint[7] cards
    // Step one - Obvious verification -
    //  cards are as described
    //  right number of cards
    //  any other obvious stuff
    // Step 2- Hand Check
    // Make sure the HAND TYPE is correct
    // Every hand needs a canonical ordering and the player needs to give it in canonical ordering
    // Step 3 - Pairwise Ranking
    // Given two hands, which one beats?
    // Step 4 - Multi Ranking 
    // of a list of players, which one is the best

    // Unit tests for all of these
    
    // Client Side Code Work
    // Given a list of 7 cards, identify the indexes that make the best hand
    // (Pre existing library? Linked in discord) 
}