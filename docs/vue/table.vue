<template id="table">
  <div class="col-md-3 col-sm-3 padding-right-10">
    Here is a table
  </div>
</template>
<script>
var TableComponent = Vue.component("Table", {
  template: document.getElementById("table").innerHTML,
  delimiters: ["<%", "%>"],
  props: { tableHeight: { default: 300 } },
  data: () => {
    return {
      enabled: false,
      account: false,
      balance: "0",
      error: undefined,
    };
  },
  created: function () {
  },
});
</script>
