pragma solidity ^0.8.9;

import "./PokerHandValidation.sol";

// Utility contract that contains the salts, cards, and mappings (with getters)
contract PokerHandProvider {
       // player address, table,to salt
    mapping(address => mapping(uint => uint)) internal salts;

    // actual encrypted cards don't need to be stored (no mapping)
    // player address, table, hand
    mapping(address => mapping(uint => mapping(uint => PokerHandValidation.EncryptedCards))) public encryptedPlayerCards;

    // playercards are kept, privately (so they can be revealed during showdown)
    // player address, table, hand, to PlayerCards Struct
    mapping(address => mapping(uint => mapping(uint => PokerHandValidation.PlayerCards))) internal playerCards;

    // table, hand, to CommunityCards Struct
    mapping(uint => mapping(uint => PokerHandValidation.CommunityCards)) internal communityCards;

    // table, hand, communityIndex, to CommunityCards Struct
    mapping(uint => mapping(uint => mapping(uint => PokerHandValidation.RevealedCommunityCard))) public revealedCommunityCards;

    // community_index: 0,1,2 = Flop 3 = Fold 4 = River
    function reveal_community_card(uint table_id, uint handNum, uint community_index) internal
    {
        uint card_actual = communityCards[table_id][handNum].allcards[community_index];
        revealedCommunityCards[table_id][handNum][community_index] = PokerHandValidation.RevealedCommunityCard(card_actual, true);
        emit PokerHandValidation.CommunityCardRevealedEvent(table_id, handNum, community_index, card_actual);
    }
}