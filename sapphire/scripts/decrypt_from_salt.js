
function hash_decrypt_card(salt, table_id, handnum, encrypted) {
  for (let card = 0; card <= 51; card++) {
    // Generate the keccak256 hash of the concatenated salt, table_id, handnum, and card
    const hash = ethers.keccak256(ethers.solidityPacked(['uint256', 'uint256', 'uint256', 'uint8'], [salt, table_id, handnum, card]));

    // Check if the generated hash matches the encrypted data
    if (hash === ethers.hexlify(encrypted)) {
      console.log(`Found secret card: ${card}`);
      return card; // Exiting the function as we found the matching card
    }
  }

  // TODO THROW AN EXCEPTION INSTEAD

  console.log('No matching card found.');
  return -1; // Indicate that no matching card was found
}

function decrypt_hole_cards(salt, table_id, handnum, encrypted_cards) {
  // Assuming hash_decrypt_card function is defined in the same scope or imported

  // Decrypt the first hole card
  const decryptedCard1 = hash_decrypt_card(salt, table_id, handnum, encrypted_cards[0]);
  console.log(`Decrypted Card 1: ${decryptedCard1}`);

  // Decrypt the second hole card
  const decryptedCard2 = hash_decrypt_card(salt, table_id, handnum, encrypted_cards[1]);
  console.log(`Decrypted Card 2: ${decryptedCard2}`);

  return {
    card1: decryptedCard1,
    card2: decryptedCard2
  };
}

module.exports = { hash_decrypt_card, decrypt_hole_cards };
