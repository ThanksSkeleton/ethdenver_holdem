// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract Sapphire_Junk {

    // Selecting Cards
    // Generate https://api.docs.oasis.io/sol/sapphire-contracts/index.html


    // salts are used to encrypt the cards
    // player address, table, hand, to salt
    mapping(address => mapping(uint => mapping(uint => uint))) private salts;

    // actual encrypted cards don't need to be stored (no mapping)

    // playercards are kept, privately (so they can be revealed during showdown)
    // player address, table, hand, to PlayerCards Struct
    mapping(address => mapping(uint => mapping(uint => PlayerCards))) private playerCards;

    // table, hand, to CommunityCards Struct
    mapping(uint => mapping(uint => CommunityCards)) private communityCards;

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

    // function deoxsys_hello_world() public returns (bytes memory)
    // {
    //     bytes32 key = "hello" ;
    //     bytes32 nonce = keccak256(abi.encodePacked(block.timestamp, msg.sender));
    //     bytes memory text = "secret_text_whale_hello";
    //     bytes memory ad = "";
    //     bytes memory encrypted =  Sapphire.encrypt(key, nonce, text, ad);
    //     emit Deoxsys_Encrypt(abi.encodePacked(nonce), encrypted);
    //     return encrypted;
    // }

    // function keccak_hello_world() public returns (bytes memory)
    // {
    //     uint table = 1;
    //     uint8 hand_round = 1; // i.e the fifth distict hand that has ever been played at the table
    //     uint8 card = 32;
    //     bytes32 secretKey = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0;
    //     bytes memory encrypted = abi.encodePacked(keccak256(abi.encodePacked(secretKey, table, hand_round, card)));
    //     emit Keccak_Encrypt( encrypted);
    //     return encrypted;
    // }


    // // Encrypted Get Psudeocode and Notes

    // // How do do without metamask popups
    // function get_secret(address user,  ESDCA_Signature signature) view returns (uint[] memory) 
    // {
    //     // Confirm that user is the signer
    //     return communityCards_Private[1]
    // }

    // //
    // function get_secret() view return {
    //     // Confirm that user is the signer
    //     if message.sender is correct {

    //     }
    //     return communityCards_Private[1]
    // }
    // }

    function register_player(uint table_id, uint handNum, uint salt) internal
    {
        // anyone can put random junk in here I suppose, even if they're not playing
        // player can overwrite their salt too, salt is used atomically so it doesn't matter
        address player = msg.sender;
        salts[player][table_id][handNum] = salt;
    }   

    // deal all cards, 
    // secretly store the community cards and the player cards, 
    // and broadcast the encrypted player cards 
    function populate_cards(uint table_id, uint handNum, address[] memory players) internal {
        uint[] memory cards = generateCards(players.length);
        for (uint player_index = 0; player_index < players.length; player_index++) {
            uint hole_1_index = player_index * 2; 
            uint hole_2_index = player_index * 2 + 1; 

            uint hole_1_card = uint8(cards[hole_1_index]);
            uint hole_2_card = uint8(cards[hole_2_index]);

            // store the cards secretly on chain
            playerCards[players[player_index]][table_id][handNum] = PlayerCards(hole_1_card, hole_1_card);

            uint salt = salts[players[player_index]][table_id][handNum];

            // encrypt and emit the cards back to the player
            emit HoleEncryptedCards(players[player_index], table_id, handNum, 
                abi.encodePacked(keccak256(abi.encodePacked(salt, table_id, handNum, hole_1_card))),
                abi.encodePacked(keccak256(abi.encodePacked(salt, table_id, handNum, hole_2_card)))
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

    // community_index: 0,1,2 = Flop 3 = Fold 4 = River
    function reveal_community_card(uint table_id, uint handNum, uint community_index) internal
    {
        emit CommunityCardRevealed(table_id, handNum, community_index, communityCards[table_id][handNum].allcards[community_index]);
    }

    function get_player_cards(address player, uint table_id, uint handNum) internal returns (PlayerCards memory)  
    {
        return playerCards[player][table_id][handNum];
    }

    function get_community_cards(uint table_id, uint handNum) internal returns (CommunityCards memory) 
    {
        return communityCards[table_id][handNum];    
    }


    function generateCards(uint howMany) public view returns (uint[] memory) {
        uint[] memory toReturn = new uint[](howMany);
        uint count = 0;
        
        // TODO - THIS WHILE LOOP IS A LITTLE UGLY. 
        // BUT GENERATING AND REJECTING WAS EASY AND OBVIOUSLY CORRECT
        // GOT A BETTER WAY? LET'S DO IT
        while (count < howMany) {
            uint candidate = uint8(Sapphire.randomBytes(1, "")[0]);
            if (candidate < 52 && !contains(toReturn, candidate, count)) {
                toReturn[count] = candidate;
                count++;
            }
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

    // struct SecretMetadata {
    //     address creator;
    //     string name;
    //     /// @notice How long (in seconds) the secret should remain so past the creator's last update.
    //     uint256 longevity;
    // }

    // event SecretCreated(
    //     address indexed creator,
    //     string indexed name,
    //     uint256 index
    // );
    // event SecretRevealed(
    //     address indexed creator,
    //     string indexed name,
    //     uint256 index
    // );

    // SecretMetadata[] public _metas;
    // bytes[] private _secrets;
    // /// @dev The unix timestamp at which the address was last seen.
    // mapping(address => uint256) public _lastSeen;

    // function createSecret(
    //     string calldata name,
    //     uint256 longevity,
    //     bytes calldata secret
    // ) external {
    //     _updateLastSeen();
    //     _metas.push(
    //         SecretMetadata({
    //             creator: msg.sender,
    //             name: name,
    //             longevity: longevity
    //         })
    //     );
    //     _secrets.push(secret);
    //     emit SecretCreated(msg.sender, name, _metas.length - 1);
    // }

    // /// @notice Reveals the secret at the specified index.
    // function revealSecret(uint256 index) external returns (bytes memory) {
    //     require(index < _metas.length, "no such secret");
    //     address creator = _metas[index].creator;
    //     uint256 expiry = _lastSeen[creator] + _metas[index].longevity;
    //     require(block.timestamp >= expiry, "not expired");
    //     emit SecretRevealed(creator, _metas[index].name, index);
    //     return _secrets[index];
    // }

    // /// @notice Returns the time (in seconds since the epoch) at which the owner was last seen, or zero if never seen.
    // function getLastSeen(address owner) external view returns (uint256) {
    //     return _lastSeen[owner];
    // }

    // function getMetas(uint256 offset, uint256 count)
    //     external
    //     view
    //     returns (SecretMetadata[] memory)
    // {
    //     if (offset >= _metas.length) return new SecretMetadata[](0);
    //     uint256 c = offset + count <= _metas.length
    //         ? count
    //         : _metas.length - offset;
    //     SecretMetadata[] memory metas = new SecretMetadata[](c);
    //     for (uint256 i = 0; i < c; ++i) {
    //         metas[i] = _metas[offset + i];
    //     }
    //     return metas;
    // }

    // function refreshSecrets() external {
    //     _updateLastSeen();
    // }

    // function _updateLastSeen() internal {
    //     _lastSeen[msg.sender] = block.timestamp;
    // }
}