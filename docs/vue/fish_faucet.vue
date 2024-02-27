<template id="fish_faucet">
  <div class="overflow-hidden px-3 py-10 flex justify-around">
    <div class="w-full max-w-xs">
      <form class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="address">
            Address
          </label>
          <input v-model.trim="address"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="address" type="text" placeholder="Player Count">
        </div>
        <div class="flex items-center justify-between">
          <button v-on:click="mint()"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button">
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
  data: () => {
    return {
      address: "",
    };
  },
  created: async function () {
    console.log("created");
    try {
      let { provider, account } = await Init();
      this.account = account;
      this.provider = provider;

      this.address = this.account;
      console.log('request accounts', res);
      await AddChain();
      this.token = await TokenContract(this.provider);
    } catch (e) {
      console.log('create ERR', e);
    }
  },
  methods: {
    mint: async function() {
      let tx = await this.token.mint(this.address, 1000);
      console.log('mint', tx);
      console.log('mint=', await tx.wait());
    },
  },
});
</script>
