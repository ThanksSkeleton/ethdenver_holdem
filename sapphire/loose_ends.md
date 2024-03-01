# Loose Ends for Solidity

## Required for MVP
* HandRecognize - Is a hand with a given handtype as claimed
* BestHand_SameTypes - compare a list of hands with the same handtype

## Extra work - Nice to Have -
* Player Names - Add to PokerToken Contract
* Table Names - Add to Poker Contract
* Kick Players that won't have enough money for the Big blinds at the start of round
* Check that player cannot redundantly join the same table
* "Everything You Need" - Struct and Getter	
* Get rid of Sapphire Randomness - Hash of Salts
* Handle (Total) Ties in Showdown - Multiple Payouts possible
* Dealer Button Rotation (for multiple hands)
* Dealer Button Random Selection when joining table (for fairness in initial positioning)
* Generalized Code Cleanup 
* Generalized Gas Improvment

## Extra work - Hard
* All-In and Side Pots Functionality (challenging)
* Cryptographic Batch Validation
* Re-architecture - Table Factory?