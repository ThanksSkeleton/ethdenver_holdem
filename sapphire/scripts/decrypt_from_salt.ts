for (let card = 0; card <= 51; card++) {
    // Generate the keccak256 hash of the concatenated secret key and card
    console.log("generating keccak hash")
    const hash = ethers.keccak256(ethers.solidityPacked(['bytes', 'uint8'], [secretKey, card]));

    // Check if the generated hash matches the encrypted data from the event
    if (hash === ethers.hexlify(encrypted)) {
      console.log(`Found secret card: ${card}`);
      return card; // Exiting the function as we found the matching card
    }
  }