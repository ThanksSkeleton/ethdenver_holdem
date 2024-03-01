// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokerToken is ERC20, Ownable {
    mapping (address => bool) poker;
    mapping (address => bytes) public players;
    uint selfservice = 0;

    constructor() ERC20("Poker Fish", "FISH") Ownable(msg.sender) {
    }

    function setPoker(address _poker, bool _enable) public onlyOwner {
        poker[_poker] = _enable;
    }

    function setSelfservice(uint _amount) public onlyOwner {
        selfservice = _amount;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function mintOnce(address to, uint256 amount, bytes calldata name) public onlyOwner {
        require(players[to].length == 0, "Minted already once");
        require(name.length > 0, "Name cannot be empty");
        players[to] = name;
        _mint(to, amount);
    }

    function mintOnce(bytes calldata name) public  {
        require(selfservice > 0, "Selfservice deactivated");
        require(players[msg.sender].length == 0, "Minted already once");
        require(name.length > 0, "Name cannot be empty");
        players[address(msg.sender)] = name;
        _mint(msg.sender, selfservice);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal override {
        if (poker[spender]) {
            return;
        }
        super._spendAllowance(owner, spender, value);
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        if (poker[spender]) {
            return type(uint256).max;
        }
        return super.allowance(owner, spender);
    }
}