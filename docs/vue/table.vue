<style scoped>
  .wrapper {
    height: 100%;
    background-color: black;
  }

  .tableRoom {
    width: 100%;
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center center;
    background-image: url('../assets/img/poker_table.jpg');
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: black;
  }

  .tableHeader {
    width: 100%;
    text-align: center;
    margin-bottom: 54px;
  }
  .tableHeader h1 {
    font-size: 26px;
    padding-left: 40px;
    text-align: left;
    margin-bottom: -44px;
 4}
  .tableHeader h4 {
    display: block;
    color: white;
    font-size: 42px;
    font-weight: 100;
    margin: 20px 200px;
    border-bottom: 1px solid #fff;
  }
  .tableHeader p {
    display: block;
    text-align: center;
  }

  .rapper {
    padding-bottom: 200px;;
  }
  
  h3, h5 {
    border: none;
    color: white;
  }

  .communityCards {
    width: 500px;
    height: 120px;
    border: 1px double yellow;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 54px;
  }
  .communityCards h5 {
    margin-top: -20px;
    color: yellow;
  }
  .communityCards div {
    display: inline-block; 
  }
  .communityCards div img {
    height: 100px;
  }

  <!-- .opponent, .player { -->
  <!--   width: 200px; -->
  <!--   height: 200px; -->
  <!-- } -->
  .opponent div {
  }
  
  .card {
    text-align: center;
    display: inline-block;
  }
  .card img {
    width: 60px;
    z-index: -4;
    margin-left: 8px;
    border-radius: 8px;
  }

  .cover {
    background-color: #041f01;
    border-radius: 8px;
    padding: 10px;
    z-index: 8;
    height: 40px;
    width: 124px;
    margin-top: -60px;
    position: absolute;
  }
  .cover img {
    height: 48px;  
    border-radius: 6px;
  }
  .cover p {
    display: inline-block;
    margin: 0;
  }

  .controls {
    width: 480px;
    height: 90px;
    margin-bottom: 400px;
  }
  .controls div {
    display: inline-block;
  }
  .controls div img {
    width: 80px;
  }
  .xmtpMsgBox {
    position: fixed;
    bottom: 0;
    padding: 10px;
    border-right: 1px solid white;
    overflow: scroll;
    height: 200px;
    width: 200px;
  }
</style>

<template id="table">
  <div class="wrapper">

      <div class="xmtpMsgBox" style="color: white;" id="xmtpMsg">
        <% xmtpMsg %> 
      </div>

 
    <div class="rapper">

      <div class="tableRoom">
        <div class="tableHeader">
          <h1>Denver Hide'em</h1>
          <h4>Table #<% table.totalHands %></h4>  
          <p>Pot Size: <% table.pot%> FISH</p>
        </div>

        <!-- opponent -->
        <div
          class="opponent"
          v-for="(player, i) in players"
          v-if="player.toLowerCase() != account.toLowerCase()"
        >
          <div class="card" v-for="card in cards">
            <img :src="'./assets/img/cards/eth_back.png'">
          </div>
          <div class="cover">
            <img :src="'https://effigy.im/a/' + player + '.png'">
            <p>
              Player: <% player_names[i] %> (<% player.substring(player.length - 7) %>)
              </br>
              Bet: <% bettingRoundChips[i] %> Fish
              </br>
              Stack: n Fish
            </p>
          </div>
        </div>

        <!-- Community Cards -->
        <div class="communityCards">
          <h5>Community Cards</h5>
          <div class="card" v-for="card in communityCards">
            <img :src="'./assets/img/cards/' + card + '.png'">
          </div>
        </div>

        <!-- You. player -->
        <div class="player">
          <div class="card" v-for="card in cards">
            <img :src="'./assets/img/cards/' + card + '.png'">
          </div>
          <div class="cover">
            <p>
              You: <% player_names[this.player_index] %>
              </br>
              Bet: <% bettingRoundChips[this.player_index] %>
            </p>
          </div>
        </div>

      <div class="controls">
        <!-- <h5> -->
        <!--   <% this.player_index + 1 %>. You (<% this.account %>) -->
        <!-- </h5> -->
        <!-- <p>Chips Bet: <% bettingRoundChips[this.player_index] %></p> -->
        <!-- <div class="card" v-for="card in cards"> -->
        <!--   <img :src="'./assets/img/cards/' + card + '.png'"> -->
        <!-- </div> -->
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

      <div v-if="spinner" class="spinner">
        Waiting for transaction...
      </div>

      <div v-if="error != null" class="">
        <h1>Error</h1>
        <p class="text-lg text-red-500">
          <% error %>
        </p>
        <button v-on:click="error = null">
          Close
        </button>
      </div>
      </div>
    </div>
  </div>
</template>

<script>
var conversations;

  var filter = function(text, length, clamp){
    clamp = clamp || '...';
    var node = document.createElement('div');
    node.innerHTML = text;
    var content = node.textContent;
    return content.length > length ? content.slice(0, length) + clamp : content;
};

Vue.filter('truncate', filter);

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
      player_names: [null, null, null, null, null, null, null, null, null, null, null, null],
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
      xmtpMsg: ""
    };
  },
  created: async function () {
    console.log("created table");
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
      await initClient();
      console.log('creating conversations')
      conversations = await initConversations(this.players);
      console.log(conversations);
    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    update: async function () {
      if (this.updating) return;
      this.updating = true;
      console.log("update");
      if (conversations.length < this.players.length - 1 ) {
        console.log('update logic working');
        console.log(this.players);
        conversations = await initConversations(this.players); // TODO: sorta don't need to do conversations = 
      }
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
          }
          if (this.player_names[i] == null) {
            let name = await this.token.players(this.players[i]);
            if (name != '') {
              this.player_names[i] = ethers.toUtf8String(name);
            }
          }
        }
        
        if (this.cards[0] == "eth_back") {
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

        let valid = true;
        let l = this.communityCards.length;
        while (valid) {
          let card = await this.contract.revealedCommunityCards(this.table_index, this.table.totalHands, this.communityCards.length);
          valid = card.valid;
          if (valid) {
            this.communityCards.push(this.numToCard(Number(card.card)));
          }
        };

        if (this.communityCards.length > l) {
          let hand = Hand.solve(this.cards.concat(this.communityCards));
          console.log('best hand', hand);
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
      const broadcastResult = await broadcastHand(conversations, action, raiseAmount);
      console.log('broadcast res');
      console.log(broadcastResult);
      this.xmtpMsg += broadcastResult;
      console.log('after broadcast');
      let ret = await TryTx(this, this.contract.playHand, [this.table_index, action, raiseAmount]);
      console.log('playHand', ret);
    },
  },
});
</script>
