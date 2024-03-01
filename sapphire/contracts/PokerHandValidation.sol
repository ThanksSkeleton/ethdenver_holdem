// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ChatGPT is helping me a lot with this
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

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

    struct FullPlayerAction
    {   
        address player;
        uint action;
        uint raiseAmount;
        // TODO - Come up with a cryptographic signature scheme where each element of these actions is valid.
        uint signature;
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
        uint h;
        // Remember that the user has to present these in canonical order
        uint8[5] cardIndexes; // There are 2*player_count + 5 total cards, what are the indexes of the 5 chosen cards. 
    }

    struct ShowdownHand_Internal
    {
        address playerAddress;
        uint h;
        uint8[5] actualCards; // There are 2*player_count + 5 total cards, what are the indexes of the 5 chosen cards. 
    }

    function hand_valid(uint handTypeInput, uint8[5] memory cards) public pure returns (bool) 
    {        
        HandType handType = HandType(handTypeInput);
        if (handType == HandType.HighCard) {
            return true; 
        } else if (handType == HandType.OnePair) {
            return (getRank(cards[0]) == getRank(cards[1]));
        } else if (handType == HandType.TwoPair) {
            return (getRank(cards[0]) == getRank(cards[1])) && (getRank(cards[2]) == getRank(cards[3]));
        } else if (handType == HandType.ThreeOfAKind) {
            return (getRank(cards[0]) == getRank(cards[1])) && (getRank(cards[0]) == getRank(cards[2]));
        } else if (handType == HandType.Straight) {
            return is_straight(cards);
        } else if (handType == HandType.Flush) {
            return is_flush(cards);
        } else if (handType == HandType.FullHouse) {
            return (getRank(cards[0]) == getRank(cards[1])) && (getRank(cards[0]) != getRank(cards[2]))
            && (getRank(cards[3]) == getRank(cards[4]));
        } else if (handType == HandType.FourOfAKind) {
            // FourOfAKind logic
            return (getRank(cards[0]) == getRank(cards[1])) && (getRank(cards[0]) == getRank(cards[2]))
                   && (getRank(cards[0]) == getRank(cards[3]));
        } else if (handType == HandType.StraightFlush) {
            // StraightFlush logic
            return is_straight(cards) && is_flush(cards);
        } else {
            // NoHand or any other undefined behavior
            return false;
        }
    }

    function DetermineWinners(ShowdownHand_Internal[] memory allhands) public pure returns (address[] memory) {
        // rank hands by HandType, then by internal cards (by the specific rule for that handtype)
        
        ShowdownHand_Internal[] memory winners_by_type = BestHandTypes(allhands); // Corrected variable declaration
        if (winners_by_type.length == 1) { // Corrected conditional syntax
            address[] memory winners = new address[](1); // Correct way to initialize an array with a single address
            winners[0] = winners_by_type[0].playerAddress; // Assuming .player is the correct field name for the address
            return winners;
        } 
        
        return find_winners_same_hand_poker(winners_by_type); 
    }
	
    function BestHandTypes(ShowdownHand_Internal[] memory allhands) public pure returns (ShowdownHand_Internal[] memory) {
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
        ShowdownHand_Internal[] memory bestHands = new ShowdownHand_Internal[](count);
        uint index = 0;
        for (uint i = 0; i < allhands.length; i++) {
            if (HandType(allhands[i].h) == highestHandType) {
                bestHands[index] = allhands[i];
                index++;
            }
        }

        return bestHands;
    }

    function find_winners_same_hand_poker(ShowdownHand_Internal[] memory contender_hands) public pure returns (address[] memory) {
        HandType handType = HandType(contender_hands[0].h);
        uint[] memory relevantIndexes;

        // Determine relevantIndexes based on handType
        if (handType == HandType.HighCard || handType == HandType.OnePair || handType == HandType.ThreeOfAKind ||
            handType == HandType.Straight || handType == HandType.FourOfAKind || handType == HandType.StraightFlush) {
            relevantIndexes = new uint[](1);
            relevantIndexes[0] = 0; // Compare the first index (highest card or significant rank)
        } else if (handType == HandType.TwoPair) {
            relevantIndexes = new uint[](2);
            relevantIndexes[0] = 0; // Compare the higher pair
            relevantIndexes[1] = 2; // Then the lower pair
        } else if (handType == HandType.Flush) {
            relevantIndexes = new uint[](5);
            for (uint i = 0; i < 5; i++) {
                relevantIndexes[i] = i; // Compare all cards
            }
        } else if (handType == HandType.FullHouse) {
            relevantIndexes = new uint[](2);
            relevantIndexes[0] = 0; // Compare the three of a kind
            relevantIndexes[1] = 3; // Then the pair
        }

        // Call find_winners with the determined relevantIndexes
        return find_winners(contender_hands, relevantIndexes);
    }

    // Implementing the find_winners function based on provided specification
    function find_winners(ShowdownHand_Internal[] memory contender_hands, uint[] memory relevantIndexes) public pure returns (address[] memory) {
        bool[] memory isWinner = new bool[](contender_hands.length);
        for (uint i = 0; i < contender_hands.length; i++) {
            isWinner[i] = true; // Initialize all players as potential winners
        }

        for (uint i = 0; i < relevantIndexes.length; i++) {
            uint highestRank = 0;
            for (uint j = 0; j < contender_hands.length; j++) {
                if (isWinner[j]) { // Only consider players still in contention
                    uint8 rank = getRank(contender_hands[j].actualCards[relevantIndexes[i]]);
                    if (rank > highestRank) {
                        highestRank = rank;
                    }
                }
            }

            // Eliminate players who do not have the highest rank at the current index
            for (uint j = 0; j < contender_hands.length; j++) {
                if (isWinner[j] && getRank(contender_hands[j].actualCards[relevantIndexes[i]]) < highestRank) {
                    isWinner[j] = false;
                }
            }
        }

        // Count winners to allocate memory for the return array
        uint winnersCount = 0;
        for (uint i = 0; i < contender_hands.length; i++) {
            if (isWinner[i]) {
                winnersCount++;
            }
        }

        // Collect winner addresses
        address[] memory winners = new address[](winnersCount);
        uint winnerIndex = 0;
        for (uint i = 0; i < contender_hands.length; i++) {
            if (isWinner[i]) {
                winners[winnerIndex] = contender_hands[i].playerAddress;
                winnerIndex++;
            }
        }

        return winners;
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
    function getSuit(uint8 card) public pure returns (uint8) {
        return card / 13;
    }

    // Helper method to extract the rank of a card
    function getRank(uint8 card) public pure returns (uint8) {
        return card % 13;
    }

    // Method to check if all cards in an array have the same suit
    function is_flush(uint8[5] memory cards) public pure returns (bool) {

        console.log("card0:", cards[0]);
        console.log("card1:", cards[1]);
        console.log("card2:", cards[2]);
        console.log("card3:", cards[3]);
        console.log("card4:", cards[4]);

        uint suit = getSuit(cards[0]); 
        return getSuit(cards[1]) == suit && getSuit(cards[2]) == suit && getSuit(cards[3]) == suit && getSuit(cards[4]) == suit;
    }

    function is_straight(uint8[5] memory cards) public pure returns (bool) 
    {
        console.log("card0:", cards[0]);
        console.log("card1:", cards[1]);
        console.log("card2:", cards[2]);
        console.log("card3:", cards[3]);
        console.log("card4:", cards[4]);

        // Check for a regular straight
        bool isRegularStraight = getRank(cards[0]) - 1 == getRank(cards[1]) &&
                                 getRank(cards[1]) - 1 == getRank(cards[2]) &&
                                 getRank(cards[2]) - 1 == getRank(cards[3]) &&
                                 getRank(cards[3]) > 0 && // Handle underflow - if card #4 is a 2, this is not a normal straight anyway
                                 getRank(cards[3]) - 1 == getRank(cards[4]);
        
        // Check for the special case of a 5-high straight: 5 (3), 4 (2), 3 (1), 2 (0), Ace (12)
        bool isAceToFiveStraight = getRank(cards[0]) == 3 && 
                                   getRank(cards[1]) == 2 && 
                                   getRank(cards[2]) == 1 && 
                                   getRank(cards[3]) == 0 && 
                                   getRank(cards[4]) == 12;

        return isRegularStraight || isAceToFiveStraight;
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