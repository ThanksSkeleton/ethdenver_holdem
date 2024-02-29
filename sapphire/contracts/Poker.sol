// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

//import "./ActualPokerHandProvider.sol";
import "./StaticPokerHandProvider.sol";
import "./PokerHandValidation.sol";

// Terminology Relationship
// Every cycle where all cards are dealt is called a "Hand". This is sometimes called a ROUND but we will use Hand.
//      I had to fold on that last hand but I will get the next hand at the table
// Each period where all players take betting actions until a new community card is dealt is a "betting round". 
//      Preflop, Flop, Turn, River are the betting rounds
// Each time when a player is expected to make a betting action is a "turn"
//      On my turn I raised.

// PokerMock Flow
// Create Table()
// Players Buy In() - (Callable anytime!)
// START - Table is INACTIVE
// ADMIN DealCards() (these are hole cards). Transitions Table to ACTIVE
// PlayHand()
//      (This will call _finishRound which advances the state machine in the following ways)
//      1. If everyone else has folded, transfer chips to winner and go back to START
//      2. If the pot is right and there are further rounds, advance to the next round
//          2.1 ADMIN is expected to call dealCommunityCards now. But play continues regardless (!!!!)
//      3. If the pot is right and there are no future rounds, move to Showdown and resolve Showdown
//      4. Else simply advance player 
// (Loop Forever)

// Showdown() - Decrypt the unfolded player cards and compare hands. Move back to START

// CHRIS'S NOTES about the ORIGINAL PokerMock Flow:
// The Admin can actually add community cards at any time! Crazy
// It is not restricted by the state machine. We need to add that

// OUR ACTUAL Flow
// Create Table() (Same)
// Players BuyIn(). Perform earlier BuyIn(), 
//      but also, provide a unique salt that will be used for the hand 
//      but also, when Players Is Full, determine start the game and send everyone their hole cards
//          and set the table to active
// PlayHand()
//      (This will call _finishRound which advances the state machine in the following ways)
//      1. If everyone else has folded, transfer chips to winner and go back to START
//      2. If the pot is right and there are further rounds, advance to the next round
//          2.1 Contract reveals the next community card as part of the final action of the betting round
//      3. If the pot is right and there are no future rounds, move to Showdown and resolve Showdown
//      4. Else simply advance player 
// (Loop Forever)

// Showdown() Reveal all unfolded player's cards and compare hands. Payout and Move back to start 

contract Poker is Ownable, StaticPokerHandProvider {

    uint public totalTables;
    // id => Table
    mapping(uint => PokerHandValidation.Table) public tables;
    // keeps track of the remaining chips of the player in a table
    // player => tableId => remainingChips
    mapping(address => mapping(uint => uint)) public chips;
    // tableId => bettingRoundNum => BettingRound
    mapping(uint => mapping(PokerHandValidation.BettingRound => PokerHandValidation.BettingRoundInfo)) public bettingRounds;
    // player => tableId to requestLeave bool
    mapping(address  => mapping(uint => bool)) public requestLeave;
    // player => tableId => handId => ShowdownHand
    mapping(address => mapping(uint => mapping(uint => PokerHandValidation.ShowdownHand))) public showdownHands;

    constructor() Ownable(msg.sender) 
    {
    }

    // Leave the table with some of your chips
    // Can be called at any time!
    function withdrawChips(uint _amount, uint _tableId) external {
        require(chips[msg.sender][_tableId] >= _amount, "Not enough balance");
        chips[msg.sender][_tableId] -= _amount;
        require(tables[_tableId].token.transfer(msg.sender, _amount));
    }

    /// @dev creates a table 
    /// @param _buyInAmount The minimum amount of tokens required to enter the table
    /// @param _maxPlayers The maximum number of players allowed in this table
    /// @param _bigBlind The big blinds for the table
    /// @param _token The token that will be used to bet in this table
    function createTable(uint _buyInAmount, uint8 _maxPlayers, uint _bigBlind, address _token) external {
       
       address[] memory empty;
       
        tables[totalTables] =  PokerHandValidation.Table({
            state: PokerHandValidation.TableState.Inactive,
            totalHands: 0,
            currentBettingRound: PokerHandValidation.BettingRound.AfterPreflop,
            buyInAmount: _buyInAmount,
            maxPlayers: _maxPlayers,
            players: empty,
            pot: 0,
            bigBlind: _bigBlind,
            token: IERC20(_token)
        });

        emit PokerHandValidation.NewTableCreated(totalTables, tables[totalTables]);

        totalTables += 1;
    }

    /// @dev returns the list of players on a given table 
    /// @param _tableId the unique id of the table
    function tablePlayers(uint _tableId) public view returns (address[] memory) 
    {
        return tables[_tableId].players;
    }

    function bettingRoundChips(uint _tableId, PokerHandValidation.BettingRound bettingRoundNumber) public view returns (uint[] memory) 
    {
        return bettingRounds[_tableId][bettingRoundNumber].chips;
    }

    function bettingRoundHasFolded(uint _tableId, PokerHandValidation.BettingRound bettingRoundNumber) public view returns (bool[] memory) 
    {
        return bettingRounds[_tableId][bettingRoundNumber].has_folded;
    }

    /// @dev first the players have to call this method to buy in and enter a table
    /// @param _tableId the unique id of the table
    /// @param _amount The amount of tokens to buy in the table. (must be greater than or equal to the minimum table buy in amount)
    function buyIn(uint _tableId, uint _amount, uint salt) public {
        PokerHandValidation.Table storage table = tables[_tableId];

        require(_amount >= table.buyInAmount, "Not enough buyInAmount");
        require(table.players.length < table.maxPlayers, "Table full");

        // transfer buyIn Amount from player to contract
        require(table.token.transferFrom(msg.sender, address(this), _amount));
        chips[msg.sender][_tableId] += _amount;

        // add player to table
        table.players.push(msg.sender);
        // player is affirmatively choosing to join the table
        requestLeave[msg.sender][_tableId] = false;

        register_player(_tableId, salt);

        emit PokerHandValidation.NewBuyIn(_tableId, msg.sender, _amount);

        if (table.players.length == table.maxPlayers)
        {
            dealCards(_tableId);
        }
    }

    function dealCards(uint _tableId) internal {
        PokerHandValidation.Table storage table = tables[_tableId];
        uint numPlayers = table.players.length;
        require(table.state == PokerHandValidation.TableState.Inactive, "Game already going on");
        table.state = PokerHandValidation.TableState.Active;

        // initiate the first betting round
        PokerHandValidation.BettingRoundInfo storage bettingRound = bettingRounds[_tableId][PokerHandValidation.BettingRound.AfterPreflop];

        bettingRound.highestChip = table.bigBlind;
        bettingRound.has_folded = PokerHandValidation.createBoolArray(numPlayers);
    
        // initiate the small blind and the big blind
        for (uint i=0; i < numPlayers; i++) {
            if (i == (numPlayers-2)) { // the second to last player, which gets the small blind
                // small blinds
                bettingRound.chips.push(table.bigBlind / 2);
                chips[table.players[i]][_tableId] -= table.bigBlind / 2;
            } else if (i == (numPlayers-1)) { // the last player, which gets the big blind
                // big blinds
                bettingRound.chips.push(table.bigBlind); // update the round array
                chips[table.players[i]][_tableId] -= table.bigBlind; // reduce the players chips
            } 
            else 
            {
                // if you are not big or small blinds, push 0
                bettingRound.chips.push(0);
            }
        }

        table.pot += table.bigBlind + (table.bigBlind/2);

        populate_cards(_tableId, table.totalHands, table.players);
    }

    // request to request
    // handled immediately if the game is not active
    // handled automatically at the start of the next round otherwise
    function requestToLeave(uint _tableId) public
    {
        PokerHandValidation.Table storage table = tables[_tableId];
        //You can pointlessly request to leave a table you're not at, doesn't matter        
        requestLeave[msg.sender][_tableId] = true;

        if (table.state == PokerHandValidation.TableState.Active || table.state == PokerHandValidation.TableState.Showdown) 
        {
            // You can't leave during the game
            // Leaves are automatically handled at the start of the next hand
        } else {
            // Pregame you can leave
            table.players = handle_leaving_players(_tableId);
        }
    }

    /// @param _raiseAmount only required in case of raise. Else put zero. This is the amount you are putting in addition to what you have already put in this round
    function playHand(uint _tableId, PokerHandValidation.PlayerAction _action, uint _raiseAmount) external {
        PokerHandValidation.Table storage table = tables[_tableId];
        require(table.state == PokerHandValidation.TableState.Active, "No Active Round");
        
        PokerHandValidation.BettingRoundInfo storage bettingRound = bettingRounds[_tableId][table.currentBettingRound];
        require(table.players[bettingRound.turn] == msg.sender, "Not your turn");

        if (_action == PokerHandValidation.PlayerAction.Call) {
            // in case of calling
            // deduct chips from the users account
            // add those chips to the pot
            // keep the player in the round

            uint callAmount = bettingRound.highestChip - bettingRound.chips[bettingRound.turn];

            // Pattern - take from player chips
            // Mark as contributed for Round
            // add to pot
            chips[msg.sender][_tableId] -= callAmount;
            bettingRound.chips[bettingRound.turn] += callAmount;
            table.pot += callAmount;
            
        } else if (_action == PokerHandValidation.PlayerAction.Check) {
            // you can only check if all the other values in the round.chips array is zero
            // i.e nobody has put any money till now
            for (uint i =0; i < table.players.length; i++) {
                if (bettingRound.chips[i] > 0) {
                    require(false, "Check not possible");
                }
            }
        } else if (_action == PokerHandValidation.PlayerAction.Raise) {
            // in case of raising
            // deduct chips from the player's account
            // add those chips to the pot
            // update the highestChip for the round
            uint proposedAmount = _raiseAmount + bettingRound.highestChip;
            uint myRequiredContribution = proposedAmount - bettingRound.chips[bettingRound.turn];


            // Pattern - take from player chips
            // Mark as contributed for Round
            // add to pot
            chips[msg.sender][_tableId] -= myRequiredContribution;
            bettingRound.chips[bettingRound.turn] += myRequiredContribution;
            table.pot += myRequiredContribution;

            bettingRound.highestChip = proposedAmount;

        } else if (_action == PokerHandValidation.PlayerAction.Fold) {
            bettingRound.has_folded[bettingRound.turn] = true;

            // TODO new fold logic
        }

        _finishRound(_tableId, table);       
    }

    function addShowDownHand(uint _tableId, uint _handId, PokerHandValidation.ShowdownHand memory showdownHand) external {
        // Assume access to a 'tables' mapping storing 'Table' structs by table ID
        PokerHandValidation.Table storage table = tables[_tableId];
        
        // Verify table is in Showdown state
        require(table.state == PokerHandValidation.TableState.Showdown, "Table is not in Showdown state");
        
        // Determine player index and confirm not folded
        uint playerIndex;
        bool isPlayerFound = false;
        for(uint i = 0; i < table.players.length; i++) {
            if (table.players[i] == msg.sender) {
                playerIndex = i;
                isPlayerFound = true;
                break;
            }
        }
        require(isPlayerFound, "Player not found in this table");
        
        PokerHandValidation.BettingRoundInfo storage bettingRoundInfo = bettingRounds[_tableId][PokerHandValidation.BettingRound.AfterRiver];
        require(!bettingRoundInfo.has_folded[playerIndex], "Player has folded and has no showdown");
        
        // Get available cards
        uint8[7] memory availableCards = getAvailableCards(_tableId, _handId, msg.sender);
        
        // Validate cards
        require(PokerHandValidation.handCardsExist(availableCards, showdownHand.cardIndexes, showdownHand.actualCards), "Invalid card submission");
        
        // Validate hand
        //require(PokerHandValidation.HandRecognize(showdownHand.handType, showdownHand.actualCards), "Hand does not match the submitted type");
        require(PokerHandValidation.HandRecognize(), "Hand does not match the submitted type");

        // Store showdown hand
        showdownHands[msg.sender][_tableId][_handId] = showdownHand;
        
        (bool allsubmitted, PokerHandValidation.ShowdownHand[] memory hands) = areAllHandsSubmitted(_tableId, _handId);

        // Check if all hands submitted and trigger Showdown if so
        if (allsubmitted) {
            StartShowdown(hands, _tableId);
        }
    }

    function getAvailableCards(uint _tableId, uint _handId, address playerAddress) private view returns (uint8[7] memory) {
        PokerHandValidation.PlayerCards memory playerCards  = playerCards[playerAddress][_tableId][_handId];
        PokerHandValidation.CommunityCards memory communityCards = communityCards[_tableId][_handId];
        // Implementation to retrieve hole cards and community cards
        // Placeholder logic
        return 
        [
        playerCards.hole1,
        playerCards.hole2,
        communityCards.allcards[0],
        communityCards.allcards[1],
        communityCards.allcards[2],
        communityCards.allcards[3],
        communityCards.allcards[4]
        ]; // Example return statement
    }

function areAllHandsSubmitted(uint _tableId, uint _handId) 
    private view returns (bool allHandsSubmitted, PokerHandValidation.ShowdownHand[] memory filteredShowdownHands) {
    
    PokerHandValidation.Table storage table = tables[_tableId];
    PokerHandValidation.BettingRoundInfo storage bettingRoundInfo = bettingRounds[_tableId][PokerHandValidation.BettingRound.AfterRiver];
    
    uint nonFoldedCount = 0; // Counter for non-folded players
    uint validHandCount = 0; // Counter for valid showdown hands found

    // First pass to count non-folded players and validate if a showdown hand is submitted
    for (uint i = 0; i < table.players.length; i++) {
        if (!bettingRoundInfo.has_folded[i]) { // Player has not folded
            nonFoldedCount++;
            address playerAddress = table.players[i];
            if (showdownHands[playerAddress][_tableId][_handId].h != 0) { // Check if hand has been submitted
                validHandCount++;
            }
        }
    }

    allHandsSubmitted = (validHandCount == nonFoldedCount);
    
    // If not all hands are submitted, return early
    if (!allHandsSubmitted) {
        return (false, filteredShowdownHands); // 'filteredShowdownHands' is empty and will be ignored
    }

    // If all hands are submitted, proceed to construct the array of filtered showdown hands
    filteredShowdownHands = new PokerHandValidation.ShowdownHand[](nonFoldedCount);
    uint index = 0;
    for (uint i = 0; i < table.players.length; i++) {
        if (!bettingRoundInfo.has_folded[i]) {
            address playerAddress = table.players[i];
            if (showdownHands[playerAddress][_tableId][_handId].h != 0) {
                filteredShowdownHands[index++] = showdownHands[playerAddress][_tableId][_handId];
            }
        }
    }
    
    return (true, filteredShowdownHands);
}

    function StartShowdown(PokerHandValidation.ShowdownHand[] memory hands, uint _tableId) internal 
    {
        // Trigger showdown process
        // Placeholder logic

        address winner = PokerHandValidation.DetermineWinners(hands)[0];

        PokerHandValidation.Table memory _table = tables[_tableId];
        chips[winner][_tableId] += _table.pot;

        _reInitiateTable(_tableId);
    }

    // This actually may not finish the round...
    // 1. Checks if the game is over due to folds and reinitializes the table
    // 2. Checks if the round has ended:
    // 2.1 Advances the round if this is not the final round
    // 2.2 Showdown if this is the final round
    // 3. Increments the turn if none of the above are true
    function _finishRound(uint _tableId, PokerHandValidation.Table storage _table) internal {
        PokerHandValidation.BettingRoundInfo storage _bettingRound = bettingRounds[_tableId][_table.currentBettingRound];
        // if all of the other players have folded then the remaining player automatically wins
        bool pot_right = PokerHandValidation.pot_is_right(_bettingRound.chips, _bettingRound.has_folded); // checks if anybody has raised or not
        (uint firstActiveIndex, uint lastActiveIndex) = PokerHandValidation.first_last_active_player(_bettingRound.has_folded);
        if (firstActiveIndex == lastActiveIndex) {
            // this is the last player left all others have folded
            // so this player is the winner
            // send the pot money to the user
            chips[_table.players[lastActiveIndex]][_tableId] += _table.pot;

            // re initiate the table
            _reInitiateTable(_tableId);
        } else if (
        (pot_right && _bettingRound.highestChip == 0 && _bettingRound.turn == lastActiveIndex) // Scenario: Everyone has checked
        || 
        (pot_right && _bettingRound.highestChip != 0)) // Pot is right and nonzero
        { 
            if (_table.currentBettingRound == PokerHandValidation.BettingRound.AfterRiver) 
            {
                // TODO WIRE IN SHOWODOWN
                
                _table.state = PokerHandValidation.TableState.Showdown;

                emit PokerHandValidation.TableShowdown(_tableId);
            } else {
                reveal_community_card_based_on_round_that_ended(_tableId,_table.totalHands, _table.currentBettingRound);

                _table.currentBettingRound = PokerHandValidation.BettingRound(uint(_table.currentBettingRound) + 1);

                // initiate the next round
                bettingRounds[_tableId][_table.currentBettingRound] = PokerHandValidation.BettingRoundInfo({
                    turn : 0,
                    highestChip: 0,

                    chips: PokerHandValidation.createZeroArray(_bettingRound.chips.length),
                    has_folded: _bettingRound.has_folded

                });
            }
        } else {
            // Pot is not right OR Everyone is checking 
            _bettingRound.turn = PokerHandValidation.nextTurn(_bettingRound.turn, _bettingRound.has_folded);
        }
    }

    function reveal_community_card_based_on_round_that_ended(uint table_id, uint handNum, PokerHandValidation.BettingRound round) internal 
    {
        if (round == PokerHandValidation.BettingRound.AfterPreflop)
        {
            reveal_community_card(table_id, handNum, 0);
            reveal_community_card(table_id, handNum, 1);
            reveal_community_card(table_id, handNum, 2);
        } 
        else if (round == PokerHandValidation.BettingRound.AfterFlop) 
        {
            reveal_community_card(table_id, handNum, 3);
        } 
        else if (round == PokerHandValidation.BettingRound.AfterTurn) 
        {
            reveal_community_card(table_id, handNum, 4);
        } else {
            // AfterRiver - no new cards, function should not be executed in this case!
        }
    }   

    // Reinitiation preps the table for another game with the same players 
    function _reInitiateTable(uint _tableId) internal 
    {
        PokerHandValidation.Table storage _table = tables[_tableId];
        _table.state = PokerHandValidation.TableState.Inactive;
        _table.totalHands += 1;
        _table.currentBettingRound = PokerHandValidation.BettingRound.AfterPreflop;
        _table.pot = 0;

        // initiate the first round
        PokerHandValidation.BettingRoundInfo storage round = bettingRounds[_tableId][PokerHandValidation.BettingRound.AfterPreflop];
        round.highestChip = _table.bigBlind;

        _table.players = handle_leaving_players(_tableId);
        
        // TODO - "Move Dealer Button" aka shuffle players

        // if nobody left we can immediately start the next game
        if (_table.players.length == _table.maxPlayers)
        {
            dealCards(_tableId);
        }
    }

    function handle_leaving_players(uint tableId) internal view returns (address[] memory)
    {
        PokerHandValidation.Table storage table = tables[tableId];

        bool[] memory boolsArray = new bool[](table.players.length);

        for (uint i = 0; i < table.players.length; i++) {
            boolsArray[i] = requestLeave[table.players[i]][tableId];
        } 

        return PokerHandValidation.removeAddresses(table.players, boolsArray);
    }
}