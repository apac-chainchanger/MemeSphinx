from decimal import Decimal
from typing import Optional, Union

from eth_typing import Address
from hexbytes import HexBytes
from web3 import Web3

# ABI definitions
TOKEN_MANAGER_ABI = [
    {
        "inputs": [
            {"name": "symbol", "type": "string"},
            {"name": "tokenAddress", "type": "address"}
        ],
        "name": "registerToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "symbol", "type": "string"},
            {"name": "destination", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "sendToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "managerWallet",
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
]

ERC20_ABI = [
    {
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    }
]

class TokenOperations:
    def __init__(self, token_manager_address: str, rpc_url: str, private_key: str):
        """Initialize TokenOperations with provider and signer"""
        self.web3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = self.web3.eth.account.from_key(private_key)
        self.token_manager_address = Web3.to_checksum_address(token_manager_address)
        self.token_manager = self.web3.eth.contract(
            address=self.token_manager_address,
            abi=TOKEN_MANAGER_ABI
        )

    def _build_and_send_tx(self, func, wait_for_confirmation: bool = True) -> str:
        """Helper function to build and send transactions"""
        try:
            tx = func.build_transaction({
                'from': self.account.address,
                'nonce': self.web3.eth.get_transaction_count(self.account.address),
                'gas': 2000000,
                'gasPrice': self.web3.eth.gas_price
            })
            
            signed_tx = self.web3.eth.account.sign_transaction(tx, self.account.key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            if wait_for_confirmation:
                receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
                if receipt['status'] == 1:
                    return HexBytes(receipt['transactionHash']).hex()
                raise Exception("Transaction failed")
            
            return HexBytes(tx_hash).hex()
            
        except Exception as e:
            raise Exception(f"Transaction failed: {str(e)}")

    async def register_token(self, symbol: str, token_address: str) -> str:
        """Register a token in the TokenManager"""
        try:
            print(f"Registering token {symbol} at address {token_address}...")
            token_address = Web3.to_checksum_address(token_address)
            
            tx_hash = self._build_and_send_tx(
                self.token_manager.functions.registerToken(symbol, token_address)
            )
            print(f"Token registered. Transaction hash: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            print(f"Failed to register token {symbol}:", e)
            raise

    async def send_token(
        self,
        symbol: str,
        destination: str,
        amount: Union[str, int],
        wait_for_confirmation: bool = True
    ) -> str:
        """Send tokens through TokenManager"""
        try:
            print(f"Sending {amount} {symbol} to {destination}...")
            destination = Web3.to_checksum_address(destination)
            
            tx_hash = self._build_and_send_tx(
                self.token_manager.functions.sendToken(symbol, destination, amount),
                wait_for_confirmation
            )
            
            if wait_for_confirmation:
                print(f"Tokens sent. Transaction hash: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            print(f"Failed to send token {symbol}:", e)
            raise

    async def approve_token(
        self,
        token_address: str,
        spender_address: str,
        amount: Union[str, int],
        wait_for_confirmation: bool = True
    ) -> str:
        """Approve tokens for spending"""
        try:
            print(f"Approving {amount} tokens for {spender_address}...")
            token_address = Web3.to_checksum_address(token_address)
            spender_address = Web3.to_checksum_address(spender_address)
            
            token = self.web3.eth.contract(address=token_address, abi=ERC20_ABI)
            
            tx_hash = self._build_and_send_tx(
                token.functions.approve(spender_address, amount),
                wait_for_confirmation
            )
            
            if wait_for_confirmation:
                print(f"Approval complete. Transaction hash: {tx_hash}")
            return tx_hash
            
        except Exception as e:
            print("Failed to approve tokens:", e)
            raise

    async def get_allowance(
        self,
        token_address: str,
        owner_address: str,
        spender_address: str
    ) -> int:
        """Get current token allowance"""
        token_address = Web3.to_checksum_address(token_address)
        owner_address = Web3.to_checksum_address(owner_address)
        spender_address = Web3.to_checksum_address(spender_address)
        
        token = self.web3.eth.contract(address=token_address, abi=ERC20_ABI)
        return token.functions.allowance(owner_address, spender_address).call()

    async def get_token_balance(
        self,
        token_address: str,
        address_to_check: str
    ) -> int:
        """Get token balance for an address"""
        token_address = Web3.to_checksum_address(token_address)
        address_to_check = Web3.to_checksum_address(address_to_check)
        
        token = self.web3.eth.contract(address=token_address, abi=ERC20_ABI)
        return token.functions.balanceOf(address_to_check).call()

    async def get_token_decimals(self, token_address: str) -> int:
        """Get token decimals"""
        token_address = Web3.to_checksum_address(token_address)
        token = self.web3.eth.contract(address=token_address, abi=ERC20_ABI)
        return token.functions.decimals().call()