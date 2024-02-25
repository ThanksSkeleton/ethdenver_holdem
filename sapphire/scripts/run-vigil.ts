// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import { ethers } from 'hardhat';

async function main() {
  const Vigil = await ethers.getContractFactory('Vigil');
  const vigil = await Vigil.deploy();
  console.log('Vigil deployed to:', await vigil.getAddress());

//   const random_1 = await (await vigil.generateNumber());
//   console.log('First Random:',random_1)
//   const random_2 = await (await vigil.generateNumber());
//   console.log('Second Random:', random_2)

    const cards = await (await vigil.generateCards(6));
    console.log('cards: ', cards)

}



async function generateTraffic(n: number) {
  const signer = await ethers.provider.getSigner();
  for (let i = 0; i < n; i++) {
    await signer.sendTransaction({
      to: "0x000000000000000000000000000000000000dEaD",
      value: ethers.parseEther("1.0"),
      data: "0x"
    });
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});