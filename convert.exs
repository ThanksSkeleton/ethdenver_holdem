#!/usr/bin/env elixir

rows = File.read!("eth_denver.csv")
  |> String.split("\n", trim: true)
  |> tl()
  |> Enum.map(fn row ->
    case String.split(row, ",", trim: true) do
      [] -> ""
      ["0x" <> addr] -> "      players[address(uint160(0x00#{addr}))] = true;"
      ["0x" <> addr, name] -> "      players[address(uint160(0x00#{addr}))] = true;\n      names[address(uint160(0x00#{addr}))] = hex\"#{Base.encode16(name)}\";"
    end
  end)

contract = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract ETHDenver {
    mapping (address => bool) public players;
    mapping (address => bytes) public names;

    constructor() {
#{Enum.join(rows, "\n")}
    }
}

"""

File.write!("sapphire/contracts/ETHDenver.sol", contract)
