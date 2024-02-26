pragma solidity ^0.8.9;

// Utility contract that contains the salts, cards, and mappings (with getters)
contract PokerHandProvider {
       // player address, table,to salt
    mapping(address => mapping(uint => uint)) internal salts;

    // actual encrypted cards don't need to be stored (no mapping)

    // playercards are kept, privately (so they can be revealed during showdown)
    // player address, table, hand, to PlayerCards Struct
    mapping(address => mapping(uint => mapping(uint => PlayerCards))) internal playerCards;

    // table, hand, to CommunityCards Struct
    mapping(uint => mapping(uint => CommunityCards)) internal communityCards;

    // event Deoxsys_Encrypt(
    //     bytes nonce, 
    //     bytes encrypted
    // );

    // Encrypted by Hashing
    event HoleEncryptedCards 
    (
        // So the player can identify if this is relevant
        address player,
        uint tableId,
        uint handNum, 

        // The Actual Encrypted Cards
        bytes hole1_encrypted,
        bytes hole2_encrypted
    );

    event CommunityCardRevealed 
    (
        uint tableId,
        uint handNum, 
        uint communityindex, // 0,1,2 = Flop 3 = Fold 4 = River
        uint communitycard
    );

    // internal secret storage, but unencrypted
    struct PlayerCards {
        uint hole1;
        uint hole2;
    }

    // internal secret storage, but unencrypted
    struct CommunityCards 
    {
        uint[5] allcards; 
    }

        // community_index: 0,1,2 = Flop 3 = Fold 4 = River
    function reveal_community_card(uint table_id, uint handNum, uint community_index) internal
    {
        emit CommunityCardRevealed(table_id, handNum, community_index, communityCards[table_id][handNum].allcards[community_index]);
    }

    // function get_player_cards(address player, uint table_id, uint handNum) internal returns (PlayerCards memory)  
    // {
    //     return playerCards[player][table_id][handNum];
    // }

    // function get_community_cards(uint table_id, uint handNum) internal returns (CommunityCards memory) 
    // {
    //     return communityCards[table_id][handNum];    
    // }
}