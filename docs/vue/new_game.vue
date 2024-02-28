<style scoped>
  h1 {
    font-size: 32px;
  }
  h2 {
    font-size: 24px;
  }
  .landingTable {
    color: #ffc909;
    background-color: green;
    margin: 25%;
    padding: 20px;
    text-align: center;
    border-radius: 40px;
    border: 10px solid black;
  }
</style>
  
<template id="new_game">

  <div class="landingTable">
    <h1>Denver Hide'em</h1>
            
    <h2>Tables</h2>
    <p>
      You've got (<% balance %>) FISH tokens that you can play with on any of the open tables.
    </p>

    <table>
      <thead>
        <tr>
          <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Num
          </th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">State</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Hands</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Current Round</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Buy In</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Players</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pot</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Big Blind</th>
          <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Chips</th>
          <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
            <span class="sr-only">Edit</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="table in tables">
          <td><% table.index %></td>
          <td><% table.state %></td>
          <td><% table.totalHands %> </td>
          <td><% table.currentRound %></td>
          <td><% table.buyInAmount %></td>
          <td><% table.players.length %> / <% table.maxPlayers %></td>
          <td><% table.pot %></td>
          <td><% table.bigBlind %></td>
          <td><% table.chips %></td>
          <td v-if="table.chips == 0 && table.players.length < table.maxPlayers"
            class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
            <a v-on:click="join_game(table.index)" href="#" class="text-indigo-600 hover:text-indigo-900">
              Join Table
            </a>
          </td>
          <td v-if="table.chips > 0">
            <router-link :to="'/table/' + table.index" class="text-indigo-600 hover:text-indigo-900">
              Go to Table
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>

    <form>
      <label>
        Player Count
      </label>
      <input v-model.trim="player_count"
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="player_count" type="text" placeholder="Player Count">
      <label>
        Buy In
      </label>
      <input v-model.trim="buy_in"
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        id="buy_in" type="text" placeholder="Buy In Value">
      <button v-on:click="create_game()"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        type="button">
        Create Table
      </button>
      <a>
        Need help?
      </a>
    </form>

    <div v-if="spinner"
      class="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div
        class="loader ease-linear rounded-full border-8 border-t-8 bg-gray-200 border-gray-200 h-24 w-64 flex items-center justify-center">
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

var NewGameComponent = Vue.component("NewGame", {
  template: document.getElementById("new_game").innerHTML,
  delimiters: ["<%", "%>"],
  data: () => {
    return {
      spinner: false,
      error: null,
      table_name: "",
      player_count: "4",
      buy_in: "100",
      balance: "loading",
      chips: "loading",
      tables: []
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
      this.contract.on([null], async (event) => {
        console.log('event', event);
        this.update();
      });
      this.secure_contract = await SecretPokerContract(this.provider);

      await this.update();
    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    update: async function () {
      console.log("update");
      try {
        let totalTables = await this.contract.totalTables();
        let tables = [];
        for (let i = 0; i < totalTables; i++) {
          const table = await this.contract.tables(i);
          const players = await this.contract.tablePlayers(i);
          let chips = await this.contract.chips(this.account, i);
          tables.push({
            index: i, state: table.state,
            totalHands: table.totalHands, currentRound: table.currentRound,
            buyInAmount: table.buyInAmount, maxPlayers: table.maxPlayers, pot: table.pot,
            bigBlind: table.bigBlind, token: table.token,
            chips: chips, players: players
          });
        }
        this.tables = tables;
      } catch (e) {
        console.log('create ERR', e);
      }
    },
    create_game: async function () {
      console.log("create_game");
      await TryTx(this, this.contract.createTable, [this.buy_in, this.player_count, 2, TOKEN]);
    },
    join_game: async function (num) {
      console.log("join_game", num);
      let salt = NewSalt();
      localStorage.setItem("salt:" + num, salt);
      let table = this.tables[num];
      try {
        let allowance = await this.token.allowance(this.account, POKER);
        if (allowance < table.buyInAmount) {
          await TryTx(this, this.token.approve, [POKER, MaxUint256]);
        }
        let ret = await TryTx(this, this.secure_contract.buyIn, [num, table.buyInAmount, salt]);
        console.log('join_game', ret);
        router.push({ path: '/table/' + num });
      } catch (e) {
        console.log('join_game ERR', e);
      }
    },
  },
});
</script>
