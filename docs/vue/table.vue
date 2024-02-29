<style scoped>
  .tableRoom {
    background: black;
    background-image: url('../assets/img/poker_table.jpg');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
  }

  ul {
    width: 200px;
  }
</style>

<template id="table">
  <div class="tableRoom">
    <p>Game Number <% table.totalHands %> - Pot value: <% table.pot%> FISH</p>
    <ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="(player, i) in players" v-if="player.toLowerCase() != account.toLowerCase()"
        class="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
        <div class="flex w-full items-center justify-between space-x-6 p-6">
          <div class="flex-1 truncate">
            <div class="flex items-center space-x-3">
              <h3 class="truncate text-sm font-medium text-gray-900">
                <% i + 1 %>. <% player %>
              </h3>
              <span
                class="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Admin</span>
            </div>
            <p class="mt-1 truncate text-sm text-gray-500">Chips Bet: <% bettingRoundChips[i] %>
            </p>
          </div>
          <img class="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300" :src="'https://effigy.im/a/' + player + '.png'">
        </div>
        <div class="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          <div v-for="card in cards" class="group relative">
            <div
              class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-10">
              <img :src="'./assets/img/cards/eth_back.png'"
                class="h-full w-full object-contain object-center lg:h-full lg:w-full">
            </div>
          </div>
        </div>
      </li>
    </ul>


    <div class="bg-white shadow-md rounded mx-auto max-w-2xl px-2 py-4 sm:px-3 sm:py-6 lg:max-w-7xl lg:px-8 my-10">
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">Community Cards</h2>
      <div class="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        <div v-for="card in communityCards" class="group relative">
          <div
            class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-20">
            <img :src="'./assets/img/cards/' + card + '.png'"
              class="h-full w-full object-contain object-center lg:h-full lg:w-full">
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white shadow-md rounded mx-auto max-w-2xl px-2 py-4 sm:px-3 sm:py-6 lg:max-w-7xl lg:px-8 my-10">
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">
        <% this.player_index + 1 %>. You (<% this.account %>)
      </h2>
      <p class="mt-1 truncate text-sm text-gray-500">Chips Bet: <% bettingRoundChips[this.player_index] %>
      </p>
      <div class="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        <div v-for="card in cards" class="group relative">
          <div
            class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-40">
            <img :src="'./assets/img/cards/' + card + '.png'"
              class="h-full w-full object-contain object-center lg:h-full lg:w-full">
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="mx-auto max-w-2xl px-2 py-4 sm:px-3 sm:py-6 lg:max-w-7xl lg:px-8 my-10">
    <h2 class="text-2xl font-bold tracking-tight text-gray-900">
      <% this.player_index + 1 %>. You (<% this.account %>)
    </h2>
    <p class="mt-1 truncate text-sm text-gray-500">Chips Bet: <% bettingRoundChips[this.player_index] %>
    </p>
    <div class="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
      <div v-for="card in cards" class="group relative">
        <div
          class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md lg:aspect-none group-hover:opacity-75 lg:h-40">
          <img :src="'./assets/img/cards/' + card"
            class="h-full w-full object-contain object-center lg:h-full lg:w-full">
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between my-4">
      <button :disabled='!isMyTurn' v-on:click="playHand(ActionFold, 0)"
        class="disabled:mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button">
        Fold
      </button>
      <button :disabled='!isMyTurn || highestChip > 0' v-on:click="playHand(ActionCheck, 0)"
        class="disabled:mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button">
        Check
      </button>
      <button :disabled='!isMyTurn || highestChip == 0' v-on:click="playHand(ActionCall, 0)"
        class="whitespace-nowrap disabled:mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button">
        Call (<% highestChip - bettingRoundChips[player_index] %>)
      </button>
      <button :disabled='!isMyTurn' v-on:click="playHand(ActionRaise, raiseAmount)"
        class="disabled:mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button">
        Raise
      </button>
      <input :disabled='!isMyTurn' v-model.trim="raiseAmount"
        class="disabled:mx-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="raiseAmount" type="text" placeholder="Raise Amount">
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
    
</template>

<script>
var xmtpClient;
var conversations; // TODO: no clue if this makes sense tbh
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
    console.log("created table");
    try {
      let { provider, account } = await Init();
      this.account = account;
      this.provider = provider;

      this.token = await TokenContract(this.provider);
      this.balance = await this.token.balanceOf(this.account);
      this.contract = await PokerContract(this.provider);
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
      xmtpClient = await initClient();
      conversations = await initConversations(this.players);
      await xmtpClient.contacts.refreshConsentList();
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
      await broadcastHand(players, action, raiseAmount)
      let ret = await TryTx(this, this.contract.playHand, [this.table_index, action, raiseAmount]);
      console.log('playHand', ret);
    },
  },
});
</script>
