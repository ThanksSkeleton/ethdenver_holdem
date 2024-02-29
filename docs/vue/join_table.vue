<style scoped>
  label, input {
    display: inline;
  }
  button {
    display: block;
  } 
</style>

<template id="join_table">
  <form>
    <label>
      Player Count
    </label>
    <input v-model.trim="player_count"
      id="player_count" type="text" placeholder="Player Count">
    <label>
      Buy In
    </label>
    <input v-model.trim="buy_in"
      id="buy_in" type="text" placeholder="Buy In Value">
    <button v-on:click="create_game()"
      type="button">
      Create Table
    </button>
    <a>
      Need help?
    </a>
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
    console.log("created");
  },
  methods: {
    create_game: async function () {
      console.log("create_game");
      await TryTx(this, this.contract.createTable, [this.buy_in, this.player_count, 2, TOKEN]);
    },
  },
});
</script>
