
1. createTable() => GenerateCards()
2. n times buyIn() + private key (ProvideHoleKey)
3. dealCards() => generate_cards()
               => n 

4. playerCards(address player) => Encrypted cards

5. n times - (playHand)
   or 1x turnBatch
    => A) Game End without Showdown (all fold but one)
    => A) Game End with showdown
    => B) Might continue with no new cards
    => C) Might continue dealing new community cards

From pokersol not needed:
- dealCommunityCards()
- dealCards()

New functions:
- closeTable() - slashes sleepy person (after timeout)
- slashCheater() - slashes a cheater 

6. 

Contract Pieces - Cryptographic
1. GenerateCards() - DONE
2. RevealCommunityCards() - DONE 
3. RevealHoleCards
3.1 Subcomponent: PlayerRegister.ProvideHoleKey
3.2 Subcomponent: DeoxsysII Onchain Encrypt with HoleKey
3.3 Subcomponent: DeoxsysII Client Decrypt With HoleKey
3.4 Subcomponent: DeoxsysII Client Localstorage of key

Contract Pieces - Poker Turnbatch
1. Turnbatch Signature Evaluation
2. Turnbatch Execution

Contract Pieces - Poker Evaluation
1. Showdown_GivenHandExists(hand) 
2. Showdown_RankGivenHands

Contract Pieces - Player Registration
- Mint 100 Fish on-demand

Contract Pieces - Tokens and Token Payout
- Fish Token

Contract Integration - Poker.sol
- Integrate all the pieces with Poker.sol
