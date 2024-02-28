// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ChatGPT is helping me a lot with this

library PokerHandValidation { 

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

    enum HandType {
        HighCard,       // Lowest value hand
        OnePair,        // Two cards of the same value
        TwoPair,        // Two different pairs
        ThreeOfAKind,   // Three cards of the same value
        Straight,       // All five cards in consecutive value order
        Flush,          // All five cards of the same suit, not in sequence
        FullHouse,      // Three of a kind with a pair
        FourOfAKind,    // Four cards of the same value
        StraightFlush,  // Five cards in sequence, all of the same suit
        RoyalFlush      // Ten, Jack, Queen, King, Ace, in the same suit
    }

	struct ShowdownHand_HeadToHead 
	{
		address player;		
		HandType handType;
		uint[5] actualCards; // Those same cards (the actual cards) in canonical order
	}

    function handCardsExist(
        uint[7] memory availableCards,
        uint[5] memory cardIndexes,
        uint[5] memory myCards
    ) public pure returns (bool) {
        for (uint i = 0; i < cardIndexes.length; i++) {
            if (availableCards[cardIndexes[i]] != myCards[i]) {
                return false; // If any card does not match, return false
            }
        }
        return true; // If all cards match, return true
    }
	
    function HandRecognize(HandType handType, uint[5] memory cards) public pure returns (bool) {
        // TODO: Implement the logic to verify if the hand matches the handType
        // Assume It's truthful for now
        
        return true; // Placeholder return statement
    }
	
    function DetermineWinners(ShowdownHand_HeadToHead[] memory allhands) public returns (address[] memory) {
        // rank hands by HandType, then by internal cards (by the specific rule for that handtype)
        
        ShowdownHand_HeadToHead[] memory bestHandsByType = BestHandTypes(allhands); // Corrected variable declaration
        if (bestHandsByType.length == 1) { // Corrected conditional syntax
            address[] memory winners = new address[](1); // Correct way to initialize an array with a single address
            winners[0] = bestHandsByType[0].player; // Assuming .player is the correct field name for the address
            return winners;
        } 
        
        return BestHand_SameTypes(bestHandsByType); 
    }
	
    function BestHandTypes(ShowdownHand_HeadToHead[] memory allhands) public pure returns (ShowdownHand_HeadToHead[] memory) {
        HandType highestHandType = HandType.HighCard; // Start with the lowest possible value
        uint count = 0;

        // First, find the highest HandType value
        for (uint i = 0; i < allhands.length; i++) {
            if (allhands[i].handType > highestHandType) {
                highestHandType = allhands[i].handType;
                count = 1; // Reset count for new highest type
            } else if (allhands[i].handType == highestHandType) {
                count++; // Increment count for matching highest type
            }
        }

        // Then, collect all hands of that HandType
        ShowdownHand_HeadToHead[] memory bestHands = new ShowdownHand_HeadToHead[](count);
        uint index = 0;
        for (uint i = 0; i < allhands.length; i++) {
            if (allhands[i].handType == highestHandType) {
                bestHands[index] = allhands[i];
                index++;
            }
        }

        return bestHands;
    }

    function BestHand_SameTypes(ShowdownHand_HeadToHead[] memory contender_hands) public pure returns (address[] memory) {
        // TODO: We need to compare multiple hands of the same type.
        // for now just select the first player as a single winner

        address[] memory winner = new address[](1); // Create a new dynamic array with 1 address element
        winner[0] = contender_hands[0].player; // Assign the first hand's player address to the first element of the winner array
        return winner; // Return the array containing the address
    }

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

}