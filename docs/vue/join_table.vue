<style scoped>
  .formFrame {
    border-top: 1px solid yellow;
    border-bottom: 1px solid yellow;
    padding: 20px 0;
  }
  label, input {
    display: inline;
    padding: 8px;
  }

  input {
    width: 80px;
    border-radius: 8px;
    margin-right: 12px;
  }
  button {
    display: inline;
    font-family: "Playfair Display", serif;
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
    background-color: #195318;
  } 

</style>

<template id="join_table">
  <form>
  <div class="formFrame">
    <label>
      Player Count
    </label>
    <input
      v-model.trim="player_count"
      id="player_count" type="text" placeholder="Player Count"
    >
    <label>
      Buy In
    </label>
    <input
      v-model.trim="buy_in"
      id="buy_in"
      type="text"
      placeholder="Buy In Value"
    >
    <button v-on:click="create_game()"
      type="button">
      Create Table
    </button>
  </div>
  </form>
</template>
<script>

var JoinTableComponent = Vue.component("join_table", {
  template: document.getElementById("join_table").innerHTML,
  delimiters: ["<%", "%>"],
  data: () => {
    return {
        player_count: "4",
        buy_in: "100",
    };
  },
  created: async function () {
    await Init(this);
  },
  methods: {
    create_game: async function () {
      await TryTx(this.$parent, this.contract.createTable, [this.buy_in, this.player_count, 2, TOKEN]);
    },
  },
});
</script>
