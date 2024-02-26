<template id="new_game">
<div class="rounded-t-lg overflow-hidden border-t border-l border-r border-gray-400 px-3 py-10 flex justify-center">
  <div class="w-full max-w-xs">
    <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="table_name">
          Table Name
        </label>
        <input 
          v-model.trim="table_name"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="table_name" type="text" placeholder="Table name">
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="player_count">
          Player Count
        </label>
        <input 
          v-model.trim="player_count"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="player_count" type="text" placeholder="Player Count">
      </div>
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2" for="buy_in">
          Buy In
        </label>
        <input 
          v-model.trim="buy_in"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="buy_in" type="text" placeholder="Buy In Value">
      </div>
      <div class="flex items-center justify-between">
        <button v-on:click="create_game()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
          Create Table
        </button>
        <a class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800" href="#">
          Need help?
        </a>
      </div>
    </form>
  </div>
</div>
</template>
<script>

var NewGameComponent = Vue.component("NewGame", {
  template: document.getElementById("new_game").innerHTML,
  delimiters: ["<%", "%>"],
  props: { tableHeight: { default: 300 } },
  data: () => {
    return {
      table_name: "",
      player_count: "4",
      buy_in: "100",

    };
  },
  created: function () {
  },
  methods: {
    create_game: async function() {
      console.log("create_game");
      this.provider = MMSDK.getProvider();
      try {
        const res = await this.provider.request({
          method: 'eth_requestAccounts',
          params: [],
        });
        this.account = res[0];
        console.log('request accounts', res);
        this.lastResponse = '';
        await this.add_chain();
        let contract = await PokerContract(this.provider);
        await contract.createTable(this.buy_in, this.player_count, 1, TOKEN);
        // this.chainId = this.provider.chainId;
      } catch (e) {
        console.log('request accounts ERR', e);
      }      
    },
    add_chain: async function() {
      try {
        const res = await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x5aff',
              chainName: 'Oasis Sapphire Testnet logoOasis Sapphire Testnet',
              blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev/'],
              nativeCurrency: { symbol: 'TEST', decimals: 18 },
              rpcUrls: ['https://testnet.sapphire.oasis.dev'],
            },
          ],
        });
        console.log('add', res);
        this.lastResponse = res;
      } catch (e) {
        console.log('ADD ERR', e);
      }
    }
  },
});
</script>
