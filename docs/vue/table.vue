<style scoped>
  .wrapper {
    height: 100%;
  }

  .tableRoom {
    width: 100%;
    padding-top: 400px;
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    background-image: url('../assets/img/poker_table.jpg');
  }

  .rapper {
    padding-bottom: 200px;;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .outliner {
    border: 1px solid red;
    width: 500px;
    height: 200px;
    overflow: hidden;
  }

  ul {
    width: 200px;
  }
</style>

<template id="table">
  <div class="wrapper">
    <div class="rapper">
      <div class="tableRoom">
        <p>Game Number <% table.totalHands %> - Pot value: <% table.pot%> FISH</p>

        <!-- Player -->
        <ul role="list">
          <li v-for="(player, i) in players" v-if="player.toLowerCase() != account.toLowerCase()">
            <h6>
              <% i + 1 %>. <% player %>
            </h6>
            <p>Admin</p>
            <p>Chips Bet: <% bettingRoundChips[i] %></p>
            <img :src="'https://effigy.im/a/' + player + '.png'">
            <div v-for="card in cards">
              <img :src="'./assets/img/cards/eth_back.png'">
          </li>
        </ul>

        <!-- Community Cards -->
        <div class="outliner">
          <h2>Community Cards</h2>
          <div v-for="card in communityCards">
            <img :src="'./assets/img/cards/' + card + '.png'">
          </div>
        </div>

        <!-- You -->
        <div class="outliner">
          <h2>
            <% this.player_index + 1 %>. You (<% this.account %>)
          </h2>
          <p>Chips Bet: <% bettingRoundChips[this.player_index] %></p>
          <div v-for="card in cards">
            <img :src="'./assets/img/cards/' + card + '.png'">
          </div>
        </div>
      </div>

      <div class="outliner">
        <h2>
          <% this.player_index + 1 %>. You (<% this.account %>)
        </h2>
        <p>Chips Bet: <% bettingRoundChips[this.player_index] %>
        </p>
        <div v-for="card in cards">
          <img :src="'./assets/img/cards/' + card + '.png'">
        </div>
        <div class="flex items-center justify-between my-4">
          <button :disabled='!isMyTurn' v-on:click="playHand(ActionFold, 0)">
            Fold
          </button>
          <button :disabled='!isMyTurn || highestChip > 0' v-on:click="playHand(ActionCheck, 0)">
            Check
          </button>
          <button :disabled='!isMyTurn || highestChip == 0' v-on:click="playHand(ActionCall, 0)">
            Call (<% highestChip - bettingRoundChips[player_index] %>)
          </button>
          <button :disabled='!isMyTurn' v-on:click="playHand(ActionRaise, raiseAmount)">
            Raise
          </button>
          <input
            :disabled='!isMyTurn'
            v-model.trim="raiseAmount"
            id="raiseAmount"
            type="text"
            placeholder="Raise Amount"
          >
        </div>
      </div>
      
      <div v-if="spinner"
        class="fixed top-0 left-0 w-full h-full flex items-center justify-center">
        <div
          class="loader ease-linear rounded-full border-8 border-t-8 h-24 w-64 flex items-center justify-center">
          Waiting for transaction...
        </div>
      </div>
      <div v-if="error != null"
        class="fixed top-0 left-0 w-full h-full flex items-center justify-center">
        <div class="p-8">
          <h1 class="text-2xl font-bold text-red-500">Error</h1>
          <p class="text-lg text-red-500">
            <% error %>
          </p>
          <button v-on:click="error = null"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
    
</template>

<script>
var TableComponent = Vue.component("Table", {
  template: document.getElementById("table").innerHTML,
  delimiters: ["<%", "%>"],
  props: { table_index: { default: 0 } },
  data: () => {
    return {
      communityCards: [],
      player_index: 0,
      highestChip: 0,
      bettingRoundChips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      isMyTurn: false,
      error: null,
      spinner: false,
      raiseAmount: 0,
      account: "loading",
      chips: "loading",
      table: "loading",
      balance: "0",
      table: "loading",
      players: [],
      cards: ["eth_back", "eth_back"],
      ActionCall: 0,
      ActionRaise: 1,
      ActionCheck: 2,
      ActionFold: 3,
      BRAfterPreflop: 0,
      BRAfterFlop: 1,
      BRAfterTurn: 2,
      BRAfterRiver: 3,
      updating: false,
    };
  },
  created: async function () {
    try {
      await Init(this);
      this.balance = await this.token.balanceOf(this.account);
      this.contract.on([null], async (event) => {
        console.log('event', event);
        this.update();
      });
      if (!this.timer) {
        this.timer = window.setInterval(() => {
          console.log('timer');
          this.update();
        }, 10000);
      }

      await this.update();

    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    update: async function () {
      if (this.updating) return;
      this.updating = true;
      console.log("update");
      try {
        this.chips = await this.contract.chips(this.account, this.table_index);
        let table = await this.contract.tables(this.table_index);
        this.table = {
          index: i, state: table.state,
          totalHands: table.totalHands, currentRound: table.currentRound,
          buyInAmount: table.buyInAmount, maxPlayers: table.maxPlayers, pot: table.pot,
          bigBlind: table.bigBlind, token: table.token,
          chips: this.chips
        };
        this.players = await this.contract.tablePlayers(this.table_index);
        console.log('players', this.players);

        for (let i = 0; i < this.players.length; i++) {
          console.log('player', i, this.players[i], this.account);
          if (this.players[i].toLowerCase() == this.account.toLowerCase()) {
            this.player_index = i;
            break;
          }
        }
        
        let cards = await this.contract.encryptedPlayerCards(this.account, this.table_index, this.table.totalHands);
        let salt = await GenerateSalt(this.provider, this.account, this.table_index);
        if (salt == null) {
          this.error = 'salt is null';
          this.updating = false;
          return;
        }
        this.cards = [];
        for (let i = 0; i < cards.length; i++) {
          let card = HashDecryptCard(salt, this.table_index, this.table.totalHands, cards[i]);
          card = this.numToCard(card);
          this.cards.push(card);
        }

        let { turn, highestChip } = await this.contract.bettingRounds(this.table_index, this.table.currentRound);
        console.log("bettingRounds", turn, Number(turn), highestChip)
        this.isMyTurn = this.players[turn].toLowerCase() == this.account.toLowerCase();
        this.highestChip = Number(highestChip);
        console.log('highestChip', this.highestChip);
        let bettingRoundChips = await this.contract.bettingRoundChips(this.table_index, this.table.currentRound);
        if (bettingRoundChips.length == this.players.length) {
          let newBettingRoundChips = [];
          for (let i = 0; i < bettingRoundChips.length; i++) {
            newBettingRoundChips.push(Number(bettingRoundChips[i]));
          }
          this.bettingRoundChips = newBettingRoundChips;
        }
        console.log('bettingRoundChips', this.bettingRoundChips);

        let communityCards = [];
        let valid = true;
        while (valid) {
          let card = await this.contract.revealedCommunityCards(this.table_index, this.table.totalHands, communityCards.length);
          valid = card.valid;
          if (valid) {
            communityCards.push(this.numToCard(Number(card.card)));
          }
        };
        this.communityCards = communityCards;

        if (this.communityCards.length > 0) {
          let hand = Hand.solve(this.cards.concat(this.communityCards));
          console.log('hand', hand);
        }

      } catch (e) {
        console.log('create ERR', e);
      }
      this.updating = false;
    },
    numToCard: function (num) {
      if (num == -1) return "eth_back";

      let suit = Math.floor(num / 13);
      let value = num % 13;
      let suits = ['H', 'D', 'C', 'S'];
      let values = ['2', '3', '4', '5', '6', '7', '8', '9', '0', 'J', 'Q', 'K', 'A'];
      return values[value] + suits[suit];
    },
    playHand: async function (action, raiseAmount) {
      console.log('playHand');
      // let tx = await this.contract.playHand(this.table_index, action, raiseAmount);
      let ret = await TryTx(this, this.contract.playHand, [this.table_index, action, raiseAmount]);
      console.log('playHand', ret);
    },
  },
});
</script>
