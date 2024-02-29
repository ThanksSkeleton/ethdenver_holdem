<style scoped>

  .wrapper {
    height: 100%;
  }

  .whale {
    <!-- background: center; -->
    <!-- background-size: cover; -->
    width: 100%;
    padding-top: 400px;
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    background-image: url('./assets/img/background.webp');
  }

  .rapper {
    padding-bottom: 200px;;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .landingTable {
    width: 700px;
    background-color: #057B03;
    border-radius: 40px;
    border: 10px solid black;
  }

  .tempForm {
    width: 300px;
  }

  .felt {
    color: #ffc909;
    margin: 20px;
    padding: 40px;
    text-align: center;
    border-radius: 20px;
    border: 1px double #ffc909;
    background: radial-gradient(#05C201, #057B03);
  }
  
  h1 {
    font-family: "Alfa Slab One", serif;
    font-weight: 400;
    font-style: normal;
    font-size: 44px;
    color: #ffc909;
	  -webkit-text-stroke: 2px #ab8134;
	  text-shadow: 2px 2px 6px black;
  }
  
  .alfa-slab one-regular {
    
    font-family: "Alfa Slab One", serif;
    font-weight: 400;
    font-style: normal;
  }
  
  h2 {
    font-family: "Playfair Display", serif;
    font-optical-sizing: auto;
    font-weight: <weight>;
    font-style: normal;
    font-size: 24px;
    letter-spacing: .1rem;
  }
  
  h3 {
    font-family: "Playfair Display", serif;
    font-optical-sizing: auto;
    font-weight: <weight>;
    font-style: normal;
    font-size: 20px;
    letter-spacing: .1rem;
    margin: 20px;
  }
  h3::before, h4::before {
    content: "~ "
  }
  h3::after, h4::after {
    content: " ~"
  }

  p {
    color: white;
    text-align: left;
  }

  table {
    width: 100%;
    table-layout: fixed;
    overflow-wrap: break-word;
  }

  table thead tr {
    border-top: 1px solid #ffc909;
    border-bottom: 1px solid #ffc909;
    margin: 24px;
    padding: 8px;
  }

  th {
    font-family: "Playfair Display", serif;
    font-optical-sizing: auto;
    font-weight: 200;
    font-style: normal;
    font-size: 14px;
    padding: 8px;
  }

  button {
    font-family: "Playfair Display", serif;
    background-color: #195318;
    border: 1px solid #FEE931;
    color: #FEE931;
    padding: 8px 18px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 8px;
    filter: drop-shadow(4px 4px 3px #333);
  }
</style>
  
<template id="new_game">
  <div class="wrapper">
  <div class="whale">
  <div class="rapper">
  <div class="landingTable">
    <div class="felt">
      
      <h1>Denver Hide'em</h1>
              
      <p>
        You've got (<% balance %>) FISH tokens that you can play with on any of the open tables.
      </p>
      
      <h2>Tables</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Table</th>
            <th scope="col">Buy In</th>
            <th scope="col">Pot Size</th>
            <th scope="col">Players</th>
            <th scope="col">Big Blind</th>
            <th scope="col">
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
              <button>
                <a v-on:click="join_game(table.index)" href="#" class="text-indigo-600 hover:text-indigo-900">
                  Join Table
                </a>
              </button>
            </td>
            <td v-if="table.chips > 0">
              <button>
                <router-link :to="'/table/' + table.index">
                  Go to Table
                </router-link>
              </button>
            </td>
          </tr>
        </tbody>
      </table>


      <h3>Or</h3>

      <join_table></join_table>

      <!-- <button>New Table</button> -->

      <h3>About</h3>
      <p>
        Denver Hide'em may look like a typical Texas Hold'em online poker game but the difference here is that this online game is truly privacy preserving, decentralized, random shuffled, unstopable game. Also it dosen't use "real" money but a token called <b>Fish Chips</b> that players use to bet with...
      </p>
      
      <h3>How it works</h3>
      <p>We're able to achive these great acts of privacy buy leveraging the Oasis chain...</p>

      <h3>Who would do such a thing?</h3>
      <p>
        The Decentralized Dealers, that's who...
      </p>
      
      
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
