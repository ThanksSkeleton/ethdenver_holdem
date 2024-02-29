// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ChatGPT is helping me a lot with this
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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


    enum BettingRound 
    {
        AfterPreflop,
        AfterFlop,
        AfterTurn,
        AfterRiver
    }

    enum TableState {
        Active,  // Waiting for players to take actions
        Inactive, // Waiting for enough Players to start the game
        Showdown  // Waiting for players to submit their showdown hands
    }

    enum PlayerAction {
        Call,
        Raise,
        Check,
        Fold
    }

    event NewTableCreated(uint tableId, Table table);
    event NewBuyIn(uint tableId, address player, uint amount);
    event BettingRoundOver(uint tableId, uint round);
    event TableShowdown(uint tableId);

    struct Table {
        TableState state;
        uint totalHands; // total Hands till now
        BettingRound currentBettingRound; // index of the current round
        uint buyInAmount;
        uint8 maxPlayers;
        address[] players;
        uint pot;
        uint bigBlind;
        IERC20 token; // the token to be used to play in the table
    }

    struct BettingRoundInfo {
        uint turn; // an index on the players array, the player who has the current turn
        uint highestChip; // the current highest chip to be called in the round. 

        bool[] has_folded; // player flag for having folded
        uint[] chips; // the amount of chips each player has put in the round. This will be compared with the highestChip to check if the player has to call again or not.
    }

    enum HandType {
        NoHand,         // No Hand, should be impossible
        HighCard,       // Lowest value hand
        OnePair,        // Two cards of the same value
        TwoPair,        // Two different pairs
        ThreeOfAKind,   // Three cards of the same value
        Straight,       // All five cards in consecutive value order
        Flush,          // All five cards of the same suit, not in sequence
        FullHouse,      // Three of a kind with a pair
        FourOfAKind,    // Four cards of the same value
        StraightFlush  // Five cards in sequence, all of the same suit
    }

    struct ShowdownHand 
    {
        address playerAddress;
        uint h;
        // Remember that the user has to present these in canonical order
        uint8[5] cardIndexes; // There are 2*player_count + 5 total cards, what are the indexes of the 5 chosen cards. 
    }

    struct FullPlayerAction 
    {   
        address player;
        PokerHandValidation.PlayerAction action;
        uint raiseAmount;
        // TODO - Come up with a cryptographic signature scheme where each element of these actions is valid.
        uint signature;
    }

    function HandRecognize(uint handType, uint8[5] memory cards) public pure returns (bool) {
        // TODO: Implement the logic to verify if the hand matches the handType
        // Assume It's truthful for now
        HandType handTypeEnum = HandType(handType);


        return true; // Placeholder return statement
    }

    function DetermineWinners(ShowdownHand[] memory allhands) public pure returns (address[] memory) {
        // rank hands by HandType, then by internal cards (by the specific rule for that handtype)
        
        ShowdownHand[] memory bestHandsByType = BestHandTypes(allhands); // Corrected variable declaration
        if (bestHandsByType.length == 1) { // Corrected conditional syntax
            address[] memory winners = new address[](1); // Correct way to initialize an array with a single address
            winners[0] = bestHandsByType[0].playerAddress; // Assuming .player is the correct field name for the address
            return winners;
        } 
        
        return BestHand_SameTypes(bestHandsByType); 
    }
	
    function BestHandTypes(ShowdownHand[] memory allhands) public pure returns (ShowdownHand[] memory) {
        HandType highestHandType = HandType.HighCard; // Start with the lowest possible value
        uint count = 0;

        // First, find the highest HandType value
        for (uint i = 0; i < allhands.length; i++) {
            if (HandType(allhands[i].h) > highestHandType) {
                highestHandType = HandType(allhands[i].h);
                count = 1; // Reset count for new highest type
            } else if (HandType(allhands[i].h) == highestHandType) {
                count++; // Increment count for matching highest type
            }
        }

        // Then, collect all hands of that HandType
        ShowdownHand[] memory bestHands = new ShowdownHand[](count);
        uint index = 0;
        for (uint i = 0; i < allhands.length; i++) {
            if (HandType(allhands[i].h) == highestHandType) {
                bestHands[index] = allhands[i];
                index++;
            }
        }

        return bestHands;
    }

    function BestHand_SameTypes(ShowdownHand[] memory contender_hands) public pure returns (address[] memory) {
        // TODO: We need to compare multiple hands of the same type.
        // for now just select the first player as a single winner

        address[] memory winner = new address[](1); // Create a new dynamic array with 1 address element
        winner[0] = contender_hands[0].playerAddress; // Assign the first hand's player address to the first element of the winner array
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

        // Method to check if all non-folded players have the same amount of chips
    function pot_is_right(uint[] memory chipsArray, bool[] memory has_folded) public pure returns (bool) {
        uint validChipsValue = 0;
        bool isValidChipsValueSet = false;

        for (uint i = 0; i < chipsArray.length; i++) {
            // Skip the folded players
            if (has_folded[i]) continue;

            // Set validChipsValue for the first non-folded player
            if (!isValidChipsValueSet) {
                validChipsValue = chipsArray[i];
                isValidChipsValueSet = true;
                continue;
            }

            // If any non-folded player has a different chips value, return false
            if (chipsArray[i] != validChipsValue) {
                return false;
            }
        }

        // If all non-folded players have the same chips value, return true
        return true;
    }

  // Gets the next turn
  // loops around
  // skips skippable 
    function nextTurn(uint currentTurn, bool[] memory shouldSkip) public pure returns (uint) {
        uint numPlayers = shouldSkip.length;
        require(currentTurn < numPlayers, "Invalid currentTurn index");

        uint nextIndex = (currentTurn + 1) % numPlayers; // Start from the next index, loop back if at the end
        while(shouldSkip[nextIndex]) {
            if (nextIndex == currentTurn) {
                // If we've looped all the way around, return the currentTurn
                // This means all other indices are skipped
                return currentTurn;
            }
            nextIndex = (nextIndex + 1) % numPlayers; // Move to the next index, loop back if at the end
        }
        
        return nextIndex;   
    }

    // Function to find the first and last active player indices
    // if first == last there is also only one player
    function first_last_active_player(bool[] memory has_folded) public pure returns (uint first_active_player_index, uint last_active_player_index) {
        first_active_player_index = type(uint).max; // Initialize with max value as a flag for no active player found yet
        last_active_player_index = 0;
        bool foundActivePlayer = false; // Flag to check if at least one active player exists

        for (uint i = 0; i < has_folded.length; i++) {
            if (!has_folded[i]) { // If the player has not folded
                // If no active player has been found yet, set the first active player index
                if (!foundActivePlayer) {
                    first_active_player_index = i;
                    foundActivePlayer = true; // Set the flag as active player found
                }
                last_active_player_index = i; // Update the last active player index for every non-folded player found
            }
        }

        // If no active player was found, reset indices to indicate no active players
        if (!foundActivePlayer) {
            first_active_player_index = 0;
            last_active_player_index = 0;
            // Alternatively, could return a specific flag value or throw an error based on your application's requirements
        }

        return (first_active_player_index, last_active_player_index);
    }

    function removeAddresses(address[] memory addresses, bool[] memory shouldBeRemoved) public pure returns (address[] memory) {
        require(addresses.length == shouldBeRemoved.length, "Arrays must be of the same length");

        uint256 count = 0;

        // First, count how many addresses we will have in the new array
        for (uint256 i = 0; i < addresses.length; i++) {
            if (!shouldBeRemoved[i]) {
                count++;
            }
        }

        // Initialize a new array of the determined size
        address[] memory filteredAddresses = new address[](count);
        uint256 j = 0;

        // Fill the new array with addresses that should not be removed
        for (uint256 i = 0; i < addresses.length; i++) {
            if (!shouldBeRemoved[i]) {
                filteredAddresses[j] = addresses[i];
                j++;
            }
        }

        return filteredAddresses;
    }

    function createBoolArray(uint n) public pure returns (bool[] memory) {
        bool[] memory arr = new bool[](n);
        for (uint i = 0; i < n; i++) {
            arr[i] = false;
        }
        return arr;
    }

    function createZeroArray(uint n) public pure returns (uint[] memory) {
        uint[] memory arr = new uint[](n);
        for (uint i = 0; i < n; i++) {
            arr[i] = 0;
        }
        return arr;
    }
        // Encrypted by Hashing
    event EncryptedCardsEvent 
    (
        // So the player can identify if this is relevant
        address player,
        uint tableId,
        uint handNum, 

        // The Actual Encrypted Cards
        bytes hole1_encrypted,
        bytes hole2_encrypted
    );

    event CommunityCardRevealedEvent 
    (
        uint tableId,
        uint handNum, 
        uint communityindex, // 0,1,2 = Flop 3 = Fold 4 = River
        uint communitycard
    );

    // internal secret storage, but unencrypted
    struct PlayerCards {
        uint8 hole1;
        uint8 hole2;
    }

    struct EncryptedCards 
    {
        bytes encryptedHole1;
        bytes encryptedHole2;
    }

    // internal secret storage, but unencrypted
    struct CommunityCards 
    {
        uint8[5] allcards; 
    }

    struct RevealedCommunityCard 
    {
        uint8 card;
        bool valid;
    }
}