<style scoped>
.wrapper {
  height: 100%;
}

.whale {
  width: 100%;
  padding-top: 400px;
  background-attachment: fixed;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  background-image: url('./assets/img/background.webp');
}

.rapper {
  padding-bottom: 200px;
  ;
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

.balanceBox {
  margin: 20px;
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
  font-size: 52px;
  color: #ffc909;
  margin: 10px;
  -webkit-text-stroke: 2px #ab8134;
  text-shadow: 2px 2px 6px black;
}

h2 {
  font-family: "Playfair Display", serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
  font-size: 24px;
  letter-spacing: .1rem;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ffc909;
  margin: 0 20px;
  margin-top: 20px;
  text-shadow: -1px -1px 1px #555;
  text-align: center;
  -webkit-background-clip: text;
  -moz-background-clip: text;
}

h3 {
  font-family: "Playfair Display", serif;
  font-optical-sizing: auto;
  font-weight: <weight>;
  font-style: normal;
  font-size: 20px;
  letter-spacing: .1rem;
  margin: 20px;
  color: #ffc909;
}

h3::before,
h4::before {
  content: "~ "
}

h3::after,
h4::after {
  content: " ~"
}

p {
  color: white;
  text-align: left;
  font-family: sans-serif;
}

table {
  border-top: 1px solid yellow;
  border-bottom: 1px solid yellow;
  width: 100%;
  table-layout: fixed;
  overflow-wrap: break-word;
}

table thead tr {
  margin: 24px;
  padding: 4px;
  border-bottom: 1px solid yellow;
}

th {
  font-family: "Playfair Display", serif;
  font-optical-sizing: auto;
  font-weight: 200;
  font-style: normal;
  font-size: 14px;
  padding: 8px;
}
table tbody {
  font-family: sans-serif;
  color: #fff;
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
button:disabled {
  background-color: gray;
  cursor: not-allowed;
}
button a {
  color: #FEE931;
  text-decoration: none;
}
</style>
  
<template id="new_game">
  <div class="wrapper">
    <div class="whale">
      <div class="rapper">
        <div class="landingTable">
          <div class="felt">
            
            <img :src="'./assets/img/fishChip.png'">
            <h1>Denver Hide'em</h1>

            <p v-if="balance != 0" class="balanceBox">
              Hey <b><% player_name %></b> you've got (<b><% balance %></b>) FISH tokens that you can play with on any of the open tables.
            </p>
            <div v-if="balance == 0" class="balanceBox">
              <p>
                You've got NO FISH tokens to play with. 
              </p>
              <form>
                <label>Player name</label>
                <input v-model.trim="new_player_name" type="text" id="player_name" placeholder="Player Name">
                <button v-on:click="mint()"
                  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="button">
                  Gimme some fish!
                </button>
              </form>
              <p>
                If you don't have gas tokens yet you can get them <a href="https://faucet.testnet.oasis.dev/">here</a>
              </p>
            </div>

            <h2>Open Tables</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Table</th>
                  <th scope="col">Buy In</th>
                  <th scope="col">Players</th>
                  <th scope="col">Big Blind</th>
                  <th scope="col">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="table in tables" v-if="table.member || (table.players.length < table.maxPlayers)">
                  <td>
                    <% table.index %>
                  </td>
                  <td>
                    <% table.buyInAmount %>
                  </td>
                  <td>
                    <% table.players.length %> / <% table.maxPlayers %>
                  </td>
                  <td>
                    <% table.bigBlind %>
                  </td>
                  <td v-if="!table.member && table.players.length < table.maxPlayers"
                    class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    <button>
                      <a v-on:click="join_game(table.index)" href="#" class="text-indigo-600 hover:text-indigo-900">
                        Join Table
                      </a>
                    </button>
                  </td>
                  <td v-if="table.member">
                    <button>
                      <router-link :to="'/table/' + table.index">
                        See Table
                      </router-link>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>


            <h2>New Game</h2>

            <join_table></join_table>

            <h3>About</h3>
            <p>
              Denver Hide'em may look like a typical Texas Hold'em online poker game but the difference here is that this
              online game is truly privacy preserving, decentralized, random shuffled, unstopable game. Also it dosen't
              use "real" money but a token called <b>Fish Chips</b> that players use to bet with...
            </p>

            <h3>How it works</h3>
            <p>We're able to achive these great acts of privacy buy leveraging the Oasis chain...</p>

            <h3>Who would do such a thing?</h3>
            <p>
              The Decentralized Dealers, a bunch of degen decentralized dudes that like building private, dapps.
            </p>


            <div v-if="spinner != false" class="spinner">
              <div class="lds-circle"><div></div></div>
              <% spinner %>
            </div>

            <div v-if="error != null"
              class="error">
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
      new_player_name: null,
      player_name: null,
      buy_in: "100",
      balance: "loading",
      chips: "loading",
      tables: []
    };
  },
  created: async function () {
    try {
      await Init(this);

      this.contract.on([null], async (event) => {
        console.log('event', event);
        this.update();
      });
      await this.update();
    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    update: async function () {
      console.log("update");
      try {
        let player_name = await this.token.players(this.account);
        if (player_name != '') {
          this.player_name = ethers.toUtf8String(player_name);
        }

        this.balance = await this.token.balanceOf(this.account);

        let totalTables = await this.contract.totalTables();
        let tables = [];
        for (let i = 0; i < totalTables; i++) {
          const table = await this.contract.tables(i);
          const players = await this.contract.tablePlayers(i);

          let member = false;
          for (let j = 0; j < players.length; j++) {
            if (players[j].toLowerCase() == this.account.toLowerCase()) {
              member = true;
              break;
            }
          }

          tables.push({
            index: i, state: table.state,
            totalHands: table.totalHands, currentRound: table.currentRound,
            buyInAmount: table.buyInAmount, maxPlayers: table.maxPlayers, pot: table.pot,
            bigBlind: table.bigBlind, token: table.token,
            players: players, member: member
          });
        }
        this.tables = tables;
      } catch (e) {
        console.log('create ERR', e);
      }
    },
    join_game: async function (num) {
      console.log("join_game", num);
      let salt = await GenerateSalt(this.provider, this.account, num);
      let table = this.tables[num];
      try {
        let allowance = await this.token.allowance(this.account, POKER);
        if (allowance < table.buyInAmount) {
          await TryTx(this, this.token.approve, [POKER, MaxUint256], "Allowing the Poker contract to use your FISH tokens");
        }
        let ret = await TryTx(this, this.secure_contract.buyIn, [num, table.buyInAmount, salt], "Joining the table on-chain");
        console.log('join_game', ret);
        router.push({ path: '/table/' + num });
      } catch (e) {
        console.log('join_game ERR', e);
      }
    },
    mint: async function () {
      if (this.new_player_name == null || this.new_player_name == '') {
        this.error = 'Player name is required';
        return;
      }
      await TryTx(this, this.token.mintOnce, [ethers.toUtf8Bytes(this.new_player_name)], "Minting you some FISH");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  },
});
</script>
