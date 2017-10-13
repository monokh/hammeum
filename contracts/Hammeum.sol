pragma solidity ^0.4.4;

import "./base/SafeMath.sol";

contract Hammeum {
	struct Bank {
		uint balance;
		address destination;
		uint transferTime;
		uint recurringInDays;
		bool isValue;
	}

	mapping (address => Bank) banks;

	modifier bankSetup {
		require(banks[msg.sender].isValue);
		_;
	}

	function Hammeum() {

	}

	function setup(address destination, uint transferTime, uint recurringInDays) payable public {
		require(!banks[msg.sender].isValue);
		banks[msg.sender] = Bank(msg.value, destination, transferTime, recurringInDays, true);
	}

	function () payable bankSetup public {
		Bank storage bank = banks[msg.sender];
		bank.balance = SafeMath.add(bank.balance, msg.value);
		if (bank.transferTime < now) {
			require(bank.destination.send(bank.balance));
			bank.balance = 0;
			bank.transferTime = SafeMath.add(bank.transferTime, (bank.recurringInDays * 1 days));
		}
	}

	function setDestination(address destination) bankSetup public {
		banks[msg.sender].destination = destination;
	}
}
