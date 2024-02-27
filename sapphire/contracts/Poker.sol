// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
//import "./ActualPokerHandProvider.sol";
import "./StaticPokerHandProvider.sol";

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

    enum BettingRound 
    {
        AfterPreflop,
        AfterFlop,
        AfterTurn,
        AfterRiver
    }

    enum TableState {
        Active, 
        Inactive, // Awaiting Admin to Deal the Hole Cards
        Showdown 
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
        uint maxPlayers;
        address[] players;
        uint pot;
        uint bigBlind;
        IERC20 token; // the token to be used to play in the table
    }

    struct BettingRoundInfo {
        bool state; // state of the betting round, if this is active or not
        uint turn; // an index on the players array, the player who has the current turn
        address[] players; // players still playing in the round who have not folded
        uint highestChip; // the current highest chip to be called in the round. 
        uint[] chips; // the amount of chips each player has put in the round. This will be compared with the highestChip to check if the player has to call again or not.
    }

    // Alternative 1. use a mapping and player counter
    // Alternative 2. move it out of the struct
    // Alter

    uint public totalTables;
    // id => Table
    mapping(uint => Table) public tables;
    // keeps track of the remaining chips of the player in a table
    // player => tableId => remainingChips
    mapping(address => mapping(uint => uint)) public chips;
    // tableId => bettingRoundNum => BettingRound
    mapping(uint => mapping(BettingRound => BettingRoundInfo)) public bettingRounds;

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
    function createTable(uint _buyInAmount, uint _maxPlayers, uint _bigBlind, address _token) external {
       
       address[] memory empty;
       
        tables[totalTables] =  Table({
            state: TableState.Inactive,
            totalHands: 0,
            currentBettingRound: BettingRound.AfterPreflop,
            buyInAmount: _buyInAmount,
            maxPlayers: _maxPlayers,
            players: empty,
            pot: 0,
            bigBlind: _bigBlind,
            token: IERC20(_token)
        });

        emit NewTableCreated(totalTables, tables[totalTables]);

        totalTables += 1;
    }

    /// @dev returns the list of players on a given table 
    /// @param _tableId the unique id of the table
    function tablePlayers(uint _tableId) public view returns (address[] memory) {
        return tables[_tableId].players;
    }

    function bettingRoundPlayers(uint _tableId, BettingRound bettingRoundNumber) public view returns (address[] memory) 
    {
        return bettingRounds[_tableId][bettingRoundNumber].players;
    }

    function bettingRoundChips(uint _tableId, BettingRound bettingRoundNumber) public view returns (uint[] memory) 
    {
        return bettingRounds[_tableId][bettingRoundNumber].chips;
    }

    /// @dev first the players have to call this method to buy in and enter a table
    /// @param _tableId the unique id of the table
    /// @param _amount The amount of tokens to buy in the table. (must be greater than or equal to the minimum table buy in amount)
    function buyIn(uint _tableId, uint _amount, uint salt) public {
        Table storage table = tables[_tableId];

        require(_amount >= table.buyInAmount, "Not enough buyInAmount");
        require(table.players.length < table.maxPlayers, "Table full");

        // transfer buyIn Amount from player to contract
        require(table.token.transferFrom(msg.sender, address(this), _amount));
        chips[msg.sender][_tableId] += _amount;

        // add player to table
        table.players.push(msg.sender);

        register_player(_tableId, salt);

        emit NewBuyIn(_tableId, msg.sender, _amount);

        if (table.players.length == table.maxPlayers)
        {
            dealCards(_tableId);
        }
    }

    function dealCards(uint _tableId) internal {
        Table storage table = tables[_tableId];
        uint numPlayers = table.players.length;
        require(table.state == TableState.Inactive, "Game already going on");
        table.state = TableState.Active;

        // initiate the first betting round
        BettingRoundInfo storage bettingRound = bettingRounds[_tableId][BettingRound.AfterPreflop];

        bettingRound.state = true;
        bettingRound.players = table.players;
        bettingRound.highestChip = table.bigBlind;
    
        // initiate the small blind and the big blind
        for (uint i=0; i < numPlayers; i++) {
            if (i == (numPlayers-2)) { // the second to last player, which gets the small blind
                // small blinds
                bettingRound.chips.push(table.bigBlind / 2);
                chips[bettingRound.players[i]][_tableId] -= table.bigBlind / 2;
            } else if (i == (numPlayers-1)) { // the last player, which gets the big blind
                // big blinds
                bettingRound.chips.push(table.bigBlind); // update the round array
                chips[bettingRound.players[i]][_tableId] -= table.bigBlind; // reduce the players chips
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

    /// @param _raiseAmount only required in case of raise. Else put zero. This is the amount you are putting in addition to what you have already put in this round
    function playHand(uint _tableId, PlayerAction _action, uint _raiseAmount) external {
        Table storage table = tables[_tableId];
        require(table.state == TableState.Active, "No Active Round");
        
        BettingRoundInfo storage bettingRound = bettingRounds[_tableId][table.currentBettingRound];
        require(bettingRound.players[bettingRound.turn] == msg.sender, "Not your turn");

        if (_action == PlayerAction.Call) {
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
            
        } else if (_action == PlayerAction.Check) {
            // you can only check if all the other values in the round.chips array is zero
            // i.e nobody has put any money till now
            for (uint i =0; i < bettingRound.players.length; i++) {
                if (bettingRound.chips[i] > 0) {
                    require(false, "Check not possible");
                }
            }
        } else if (_action == PlayerAction.Raise) {
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

        } else if (_action == PlayerAction.Fold) {
            // in case of folding
            /// remove the player from the players & chips array for this round
            _remove(bettingRound.turn, bettingRound.players);
            _remove(bettingRound.turn, bettingRound.chips);
        }

        _finishRound(_tableId, table);       
    }

    /// @dev this method will be called by the offchain node with the
    /// keys of each card hash & the card,  dealt in the dealCards function
    /// this method will then verify them with the hashes stored 
    /// evaluate the cards, and send the pot earnings to the winner
    /// @notice only send the keys & cards of the players who are still living
    function showdown(uint _tableId, uint[] memory _keys, PlayerCards[] memory _cards) external onlyOwner {
        Table storage table = tables[_tableId];
        BettingRoundInfo memory bettingRound = bettingRounds[_tableId][BettingRound.AfterRiver];

        require(table.state == TableState.Showdown);

        uint n = bettingRound.players.length;
        require(_keys.length == n && _cards.length == n, "Incorrect arr length");

        // // verify the player hashes
        // for (uint i=0; i<n;i++) {
        //     bytes32 givenHash1 = keccak256(abi.encodePacked(_keys[i], _cards[i].card1));
        //     bytes32 givenHash2 = keccak256(abi.encodePacked(_keys[i], _cards[i].card2));

        //     PlayerCardHashes memory hashes = playerHashes[bettingRound.players[i]][_tableId][table.totalHands];

        //     require(hashes.card1Hash == givenHash1, "incorrect cards");
        //     require(hashes.card2Hash == givenHash2, "incorrect cards");
        // }

        // now choose winner
        address winner;
        uint8 bestRank = 100;
        
        for (uint j=0; j < n;  j++) {
            address player = bettingRound.players[j];
            // PlayerCards memory playerCards = _cards[j];
            // uint8[] memory cCards = communityCards[_tableId];

            uint8 rank = 1;

            if (rank < bestRank) {
                bestRank = rank;
                winner = player;
            }
        }

        // add to the winner's balance
        require(winner != address(0), "Winner is zero address");
        chips[winner][_tableId] += table.pot;
        _reInitiateTable(table, _tableId);
    }

    // This actually may not finish the round...
    // 1. Checks if the game is over due to folds and reinitializes the table
    // 2. Checks if the round has ended:
    // 2.1 Advances the round if this is not the final round
    // 2.2 Showdown if this is the final round
    // 3. Increments the turn if none of the above are true
    function _finishRound(uint _tableId, Table storage _table) internal {
        BettingRoundInfo storage _bettingRound = bettingRounds[_tableId][_table.currentBettingRound];
        // if all of the other players have folded then the remaining player automatically wins
        uint n = _bettingRound.players.length;
        bool allChipsEqual = _allElementsEqual(_bettingRound.chips); // checks if anybody has raised or not
        if (n == 1) {
            // this is the last player left all others have folded
            // so this player is the winner
            // send the pot money to the user
            chips[_bettingRound.players[0]][_tableId] += _table.pot;

            // re initiate the table
            _reInitiateTable(_table, _tableId);
        } else if (
        (allChipsEqual && _bettingRound.highestChip == 0 && _bettingRound.turn == n-1) // Scenario: Everyone has checked
        || 
        (allChipsEqual && _bettingRound.highestChip != 0)) // Pot is right and nonzero
        { 
            if (_table.currentBettingRound == BettingRound.AfterRiver) 
            {
                // TODO WIRE IN SHOWODOWN
                
                _table.state = TableState.Showdown;

                emit TableShowdown(_tableId);
            } else {
                reveal_community_card_based_on_round_that_ended(_tableId,_table.totalHands, _table.currentBettingRound);

                _table.currentBettingRound = BettingRound(uint(_table.currentBettingRound) + 1);

                uint[] memory _chips = new uint[](n);

                // initiate the next round
                bettingRounds[_tableId][_table.currentBettingRound] = BettingRoundInfo({
                    state: true,
                    turn : 0,
                    players: _bettingRound.players, // all living players from the last round
                    highestChip: 0,
                    chips: _chips
                });
            }
        } else {
            // Pot is not right OR Everyone is checking 
            _bettingRound.turn = _updateTurn(_bettingRound.turn, n);
        }
    }

      // updates the turn to the next player
    function _updateTurn(uint _currentTurn, uint _totalLength) internal pure returns (uint) {
        if (_currentTurn == _totalLength -1) {
            return 0;
        }
        return _currentTurn + 1;
    }

    function reveal_community_card_based_on_round_that_ended(uint table_id, uint handNum, BettingRound round) internal 
    {
        if (round == BettingRound.AfterPreflop)
        {
            reveal_community_card(table_id, handNum, 0);
            reveal_community_card(table_id, handNum, 1);
            reveal_community_card(table_id, handNum, 2);
        } 
        else if (round == BettingRound.AfterFlop) 
        {
            reveal_community_card(table_id, handNum, 3);
        } 
        else if (round == BettingRound.AfterRiver) 
        {
            reveal_community_card(table_id, handNum, 4);
        } else {
            // should not be executed in this case!
        }
    }   

    // Reinitiation preps the table for another game with the same players 
    function _reInitiateTable(Table storage _table, uint _tableId) internal {

        _table.state = TableState.Inactive;
        _table.totalHands += 1;
        _table.currentBettingRound = BettingRound.AfterPreflop;
        _table.pot = 0;

        // initiate the first round
        BettingRoundInfo storage round = bettingRounds[_tableId][BettingRound.AfterPreflop];
        round.state = true;
        round.players = _table.players;
        round.highestChip = _table.bigBlind;
    } 

    function _allElementsEqual(uint[] memory arr) internal pure returns (bool val) {
        uint x = arr[0];
        val = true;
        for (uint i=0; i < arr.length; i++) {
            if (arr[i] != x) {
                val = false;
            }
        }
    }

    function _remove(uint index, address[] storage arr) internal {
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }

    function _remove(uint index, uint[] storage arr) internal {
        arr[index] = arr[arr.length - 1];
        arr.pop();
    }
}