<template id="fish_faucet">
<div class="overflow-hidden px-3 py-10 flex justify-around">
  <div class="w-full max-w-xs">
    <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div class="flex items-center justify-between">
        <button v-on:click="create_game()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
          Gimme some fish!
        </button>
      </div>
    </form>
  </div>
</div>
</template>
<script>

var FishFaucetComponent = Vue.component("FishFaucet", {
  template: document.getElementById("fish_faucet").innerHTML,
  delimiters: ["<%", "%>"],
  props: { tableHeight: { default: 300 } },
  data: () => {
    return {
      table_name: "",
      player_count: "4",
      buy_in: "100",
      totalTables: "loading",
      tables: []
    };
  },
  created: async function () {
    console.log("created");
    try {
        await MMSDK.connect();
        this.provider = await MMSDK.getProvider();
        const res = await this.provider.request({
          method: 'eth_requestAccounts',
          params: [],
        });
        this.account = res[0];
        console.log('request accounts', res);
        this.lastResponse = '';
        await this.add_chain();
        this.contract = await PokerContract(this.provider);
        this.totalTables = await this.contract.totalTables();
        for (let i = 0; i < this.totalTables; i++) {
          const table = await this.contract.tables(i);
          this.tables.push({index: i, state: table.state, totalHands: table.totalHands, currentRound: table.currentRound, buyInAmount: table.buyInAmount, maxPlayers: table.maxPlayers, pot: table.pot, bigBlind: table.bigBlind, token: table.token});
        }
      } catch (e) {
        console.log('create ERR', e);
      }      
    },
    methods: {
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
