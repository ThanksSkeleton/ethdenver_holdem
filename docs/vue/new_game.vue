<template id="new_game">
  <div class="overflow-hidden px-3 py-10 flex justify-around">
    <div class="w-full max-w-xs">
      <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="player_count">
            Player Count
          </label>
          <input v-model.trim="player_count"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="player_count" type="text" placeholder="Player Count">
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="buy_in">
            Buy In
          </label>
          <input v-model.trim="buy_in"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="buy_in" type="text" placeholder="Buy In Value">
        </div>
        <div class="flex items-center justify-between">
          <button v-on:click="create_game()"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button">
            Create Table
          </button>
          <a class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
            Need help?
          </a>
        </div>
      </form>
    </div>
    <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div class="px-4 sm:px-6 lg:px-8">
        <div class="sm:flex sm:items-center">
          <div class="sm:flex-auto">
            <h1 class="text-base font-semibold leading-6 text-gray-900">Tables</h1>
            <p class="mt-2 text-sm text-gray-700">You've got (<% balance %>) FISH tokens that you can play with on any of
                the open tables.</p>
          </div>
        </div>
        <div class="mt-8 flow-root">
          <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table class="min-w-full divide-y divide-gray-300">
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
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="table in tables">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      <% table.index %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.state %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.totalHands %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.currentRound %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.buyInAmount %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.players.length %> / <% table.maxPlayers %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.pot %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.bigBlind %>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <% table.chips %>
                    </td>
                    <td v-if="table.chips == 0"
                      class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <a v-on:click="join_game(table.index)" href="#" class="text-indigo-600 hover:text-indigo-900">
                        Join Table
                      </a>
                    </td>
                    <td v-if="table.chips > 0"
                      class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <router-link :to="'/table/' + table.index" class="text-indigo-600 hover:text-indigo-900">
                        Go to Table
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
      let totalTables = await this.contract.totalTables();
      for (let i = 0; i < totalTables; i++) {
        const table = await this.contract.tables(i);
        const players = await this.contract.tablePlayers(i);
        let chips = await this.contract.chips(this.account, i);
        this.tables.push({
          index: i, state: table.state,
          totalHands: table.totalHands, currentRound: table.currentRound,
          buyInAmount: table.buyInAmount, maxPlayers: table.maxPlayers, pot: table.pot,
          bigBlind: table.bigBlind, token: table.token,
          chips: chips, players: players
        });
      }
    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    create_game: async function () {
      console.log("create_game");
      try {
        await this.contract.createTable(this.buy_in, this.player_count, 1, TOKEN);
      } catch (e) {
        console.log('request accounts ERR', e);
      }
    },
    join_game: async function (num) {
      console.log("join_game", num);
      let salt = NewSalt();
      localStorage.setItem("salt:" + num, salt);
      let table = this.tables[num];
      try {
        let join_tx;
        let allowance = await this.token.allowance(this.account, POKER);
        if (allowance < table.buyInAmount) {
          let tx = await this.token.approve(POKER, MaxUint256);
          let ok = await tx.wait();
          if (ok) join_tx = await this.contract.buyIn(num, table.buyInAmount, salt);
        } else {
          join_tx = await this.contract.buyIn(num, table.buyInAmount, salt);
        }
        let ret = await join_tx.wait();
        console.log('join_game', ret);
      } catch (e) {
        console.log('join_game ERR', e);
      }
    },
  },
});
</script>
