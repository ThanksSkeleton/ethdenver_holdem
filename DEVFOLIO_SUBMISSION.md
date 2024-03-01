# DEVFOLIO SUBMISSION

## Internal Notes
* This is a draft of what we should actually submit
* Need Images:
** Cover Image
** Up To 5 Pictures
** Logo
* Need Addresses:
** EthStorage http address
** EthStorage web3 address
** Sapphire Testnet Contract Address
* Needs polish
** XMTP
** EthStorage 

## Actual Submission 
### Project Name
Texas Hide-em

### Tagline
On Chain Texas Hold-em Poker, Fully Decentralized 

### What Problem it Solves (Markdown Supported)
Blurb

### Challenges We Solved (Markdown Supported) (Challenges, Hurdles, or Specific Bugs and how we overcame them)
* Migration between frontend build systems / frontend challenges - Cultivated Flexibility and Powered through
* Source of Secret Onchain Randomness - Used Sapphire RandomBits Precompile
* Partially Revealed Cards - Use a homespun hashing technique with player generated keys and brute force on a tiny preimage space
* Hand selection from 7 cards is too complex onchain - Client does hand selection (js), contract does hand confirmation

### Technologies We Used (List)
#### Bounties
* Oasis Sapphire Chain for Confidentiality 
* Oasis Sapphire Random Precompile
* XMTP for client peer to peer messaging
* Metamask SDK for Wallet Connect 
* EthStorage Hosting 
#### NonBounties
* Solidity, Hardhat, Chai 
* Vue

### Links (To Github, Live Testnet Site)
* https://github.com/ThanksSkeleton/ethdenver_holdem
* Link to Site (https://): $ADDRESS
* Link to Site (web3://): $ADDRESS

### Video Demo
TODO

### Cover Image ("Glimpse of Your Project To the World")
TODO

### Pictures (Up to 5)
TODO 

### Logo
TODO 

### Platforms (Radio Button)
* Web

### Track (Radio Button)
* Privacy

### Select Sponsor Bounties (CheckBox):
EthStorage: Build A Decentralized On-Chain Gaming using Web3 and EthStorage
Linea: Unlesh Your Creativity With Metamask SDK
XMTP: Web3 Notifications Alerts For XMTP Users
Oasis Protocol: Build a Dapp on Oasis Sapphire

### Describe Bounties (Textboxes)

#### Oasis Sapphire 
Our contract is deployed at $ADDRESS on the oasis sapphire testnet.
We are using Sapphire as our execution environment and our source of confidentiality, and using the oasis Sapphire precompile as our source of onchain randomness.
Our poker contract secretly deals the cards once the last person joins the table, and through the various state transitions of the poker state machine, values are revealed by being moved into public mappings. 
(Personally secret cards aka hole cards are made public in a hashed form which can be de-hashed (brute forced) on client side.)

#### EthStorage
We are deployed our site at $ADDRESS on the EthStorage Testnet
We have registered web3 URI $ADDRESS and it points to our dapp.

#### Metamask SDK 
We are using the Metamask SDK (web) to provide a wallet connection to our dapp.

#### XMTP
We are using XMTP for players to exchange information in advance of game actions. (Notifications Frame). 