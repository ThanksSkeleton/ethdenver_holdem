<template id="table">
  <div class="overflow-hidden px-3 py-5 flex flex-col justify-around">
    <ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="player in players" v-if="player.toLowerCase() != account.toLowerCase()"
        class="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow">
        <div class="flex w-full items-center justify-between space-x-6 p-6">
          <div class="flex-1 truncate">
            <div class="flex items-center space-x-3">
              <h3 class="truncate text-sm font-medium text-gray-900">Jane Cooper (<% player %>)</h3>
              <span
                class="inline-flex flex-shrink-0 items-center rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Admin</span>
            </div>
            <p class="mt-1 truncate text-sm text-gray-500">Regional Paradigm Technician</p>
          </div>
          <img class="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
            alt="">
        </div>
      </li>
      <!-- More people... -->
    </ul>
    <div class="bg-white shadow-md rounded mx-auto max-w-2xl px-2 py-4 sm:px-3 sm:py-6 lg:max-w-7xl lg:px-8 my-10">
      <h2 class="text-2xl font-bold tracking-tight text-gray-900">You (<% this.account %>)</h2>
      <div class="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        <div v-for="card in cards" class="group relative">
          <div
            class="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-40">
            <img :src="'./assets/img/cards/' + card" alt="Backside"
              class="h-full w-full object-contain object-center lg:h-full lg:w-full">
          </div>
        </div>

        <!-- More products... -->
      </div>
      <div class="flex items-center justify-between my-4">
        <button v-on:click="playHand(ActionFold, 0)"
          class="mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button">
          Fold
        </button>
        <button v-on:click="playHand(ActionCheck, 0)"
          class="mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button">
          Check
        </button>
        <button v-on:click="playHand(ActionCall, 0)"
          class="mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button">
          Call
        </button>
        <button v-on:click="playHand(ActionRaise, raiseAmount)"
          class="mx-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button">
          Raise
        </button>
        <input v-model.trim="raiseAmount"
          class="mx-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          id="raiseAmount" type="text" placeholder="Raise Amount">
      </div>
    </div>
    <div 
      v-if="spinner"
      class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div class="loader ease-linear rounded-full border-8 border-t-8 bg-gray-200 border-gray-200 h-24 w-64 flex items-center justify-center">
        Waiting for transaction...
      </div>
    </div>
    <div v-if="error != null"
      class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg">
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
</template>
<script>
var TableComponent = Vue.component("Table", {
  template: document.getElementById("table").innerHTML,
  delimiters: ["<%", "%>"],
  props: { table_index: { default: 0 } },
  data: () => {
    return {
      error: null,
      spinner: false,
      raiseAmount: 0,
      account: "loading",
      chips: "loading",
      table: "loading",
      balance: "0",
      table: "loading",
      players: [],
      cards: ["eth_back.png", "eth_back.png"],
      ActionCall: 0,
      ActionRaise: 1,
      ActionCheck: 2,
      ActionFold: 3
    };
  },
  created: async function () {
    console.log("created");
    try {
      let { provider, account } = await Init();
      this.account = account;
      this.provider = provider;

      this.token = await TokenContract(this.provider);
      this.balance = await this.token.balanceOf(this.account);
      this.contract = await PokerContract(this.provider);
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
      let cards = await this.contract.encryptedPlayerCards(this.account, this.table_index, this.table.totalHands);
      let salt = localStorage.getItem('salt:' + this.table_index);
      this.cards = [];
      for (let i = 0; i < cards.length; i++) {
        let card = HashDecryptCard(salt, this.table_index, this.table.totalHands, cards[i]);
        card = this.numToCard(card);
        this.cards.push(card);
      }
      console.log('players', this.players);
    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    numToCard: function (num) {
      if (num == -1) return "eth_back.png";

      let suit = Math.floor(num / 13);
      let value = num % 13;
      let suits = ['H', 'D', 'C', 'S'];
      let values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'J', 'Q', 'K', 'A'];
      return values[value] + suits[suit] + ".png";
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
