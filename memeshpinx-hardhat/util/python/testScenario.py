import os
import time
from decimal import Decimal
from typing import NamedTuple

from dotenv import load_dotenv
from eth_typing import Address
from web3 import Web3
from web3.contract import Contract

# Load environment variables
load_dotenv()

# ABI definitions
TOKEN_MANAGER_ABI = [
    {"inputs": [{"name": "symbol", "type": "string"}, {"name": "tokenAddress", "type": "address"}], "name": "registerToken", "type": "function"},
    {"inputs": [{"name": "symbol", "type": "string"}, {"name": "destination", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "sendToken", "type": "function"},
    {"inputs": [], "name": "managerWallet", "outputs": [{"type": "address"}], "type": "function"}
]

ERC20_ABI = [
    {"inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"type": "bool"}], "type": "function"},
    {"inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"type": "uint256"}], "type": "function"},
    {"inputs": [{"name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"type": "uint256"}], "type": "function"},
    {"inputs": [], "name": "decimals", "outputs": [{"type": "uint8"}], "type": "function"}
]

class TokenInfo(NamedTuple):
    symbol: str
    address: str
    initial_supply: int

class TokenOperations:
    def __init__(self, token_manager_address: str, rpc_url: str, private_key: str):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = self.w3.eth.account.from_key(private_key)
        self.token_manager = self.w3.eth.contract(
            address=Web3.to_checksum_address(token_manager_address),
            abi=TOKEN_MANAGER_ABI
        )

    def _build_and_send_transaction(self, transaction, value=0):
        """Helper method to build and send transactions"""
        transaction.update({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 200000,  # You might want to estimate this
            'gasPrice': self.w3.eth.gas_price,
            'value': value,
        })
        
        # Sign the transaction
        signed_txn = self.account.sign_transaction(transaction)
        
        # Send the transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return tx_receipt

    def register_token(self, symbol: str, token_address: str) -> str:
        try:
            print(f"Registering token {symbol} at address {token_address}...")
            
            # Build the transaction
            transaction = self.token_manager.functions.registerToken(
                symbol,
                Web3.to_checksum_address(token_address)
            ).build_transaction({
                'chainId': self.w3.eth.chain_id,
            })
            
            # Send the transaction
            receipt = self._build_and_send_transaction(transaction)
            
            print(f"Token registered. Transaction hash: {receipt['transactionHash'].hex()}")
            return receipt['transactionHash'].hex()
        except Exception as error:
            print(f"Failed to register token {symbol}:", error)
            raise

    def send_token(self, symbol: str, destination: str, amount: int, wait_for_confirmation: bool = True) -> str:
        try:
            print(f"Sending {amount} {symbol} to {destination}...")
            
            transaction = self.token_manager.functions.sendToken(
                symbol,
                Web3.to_checksum_address(destination),
                amount
            ).build_transaction({
                'chainId': self.w3.eth.chain_id,
            })
            
            receipt = self._build_and_send_transaction(transaction)
            
            if wait_for_confirmation:
                print(f"Tokens sent. Transaction hash: {receipt['transactionHash'].hex()}")
            
            return receipt['transactionHash'].hex()
        except Exception as error:
            print(f"Failed to send token {symbol}:", error.args[0]['message'])
            raise

    def approve_token(self, token_address: str, spender_address: str, amount: int, wait_for_confirmation: bool = True) -> str:
        try:
            print(f"Approving {amount} tokens for {spender_address}...")
            token = self.w3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=ERC20_ABI
            )
            
            transaction = token.functions.approve(
                Web3.to_checksum_address(spender_address),
                amount
            ).build_transaction({
                'chainId': self.w3.eth.chain_id,
            })
            
            receipt = self._build_and_send_transaction(transaction)
            
            if wait_for_confirmation:
                print(f"Approval complete. Transaction hash: {receipt['transactionHash'].hex()}")
            
            return receipt['transactionHash'].hex()
        except Exception as error:
            print("Failed to approve tokens:", error)
            raise

    def get_allowance(self, token_address: str, owner_address: str, spender_address: str) -> int:
        token = self.w3.eth.contract(
            address=Web3.to_checksum_address(token_address),
            abi=ERC20_ABI
        )
        return token.functions.allowance(
            Web3.to_checksum_address(owner_address),
            Web3.to_checksum_address(spender_address)
        ).call()

    def get_token_balance(self, token_address: str, address_to_check: str) -> int:
        token = self.w3.eth.contract(
            address=Web3.to_checksum_address(token_address),
            abi=ERC20_ABI
        )
        return token.functions.balanceOf(Web3.to_checksum_address(address_to_check)).call()

    def get_token_decimals(self, token_address: str) -> int:
        token = self.w3.eth.contract(
            address=Web3.to_checksum_address(token_address),
            abi=ERC20_ABI
        )
        return token.functions.decimals().call()

async def run_test_scenario():
    # Configuration
    RPC_URL = os.getenv('RPC_URL', 'http://localhost:8545')
    PRIVATE_KEY = os.getenv('PRIVATE_KEY', 'YOUR_PRIVATE_KEY')
    TOKEN_MANAGER_ADDRESS = '0x9500425f4D0D9e60650332A3AB8bf3F42F63A89E'
    MANAGER_WALLET = '0x21E122B701aFae76085e31faDCfDF16C0E40452b'
    TEST_RECIPIENT = os.getenv('TEST_RECIPIENT', '')

    tokens = [
        TokenInfo('tDOGE', '0x3129Db2b25044Fc2AfCD848eC9bf1fa2E1E085A7', int(1e24)),  # 1M tokens with 18 decimals
        TokenInfo('tPEPE', '0xf8d866693e16BAf0f64337264FF99Eb1F3209253', int(1e24)),
        TokenInfo('tSHIB', '0x85780D4ccC843F01C16389B0C95B8d8916C61611', int(1e24))
    ]

    # Initialize TokenOperations
    token_ops = TokenOperations(TOKEN_MANAGER_ADDRESS, RPC_URL, PRIVATE_KEY)

    try:
        print("Starting Token Test Scenario\n")
        print("=== Initial Setup ===")

        # Test each token
        for token in tokens:
            print(f"\nTesting {token.symbol}:")

            # 1. Check initial balance
            print(f"\nStep 1: Checking initial balance for {token.symbol}")
            initial_balance = token_ops.get_token_balance(token.address, MANAGER_WALLET)
            print(f"Initial balance: {initial_balance / 1e18} {token.symbol}")

            # 2. Check current allowance
            print(f"\nStep 2: Checking current allowance for {token.symbol}")
            current_allowance = token_ops.get_allowance(token.address, MANAGER_WALLET, TOKEN_MANAGER_ADDRESS)
            print(f"Current allowance: {current_allowance / 1e18} {token.symbol}")

            # 3. Approve TokenManager
            if current_allowance == 0:
                print(f"\nStep 3: Approving TokenManager for {token.symbol}")
                approve_tx = token_ops.approve_token(
                    token.address,
                    TOKEN_MANAGER_ADDRESS,
                    2**256 - 1  # MaxUint256
                )
                print(f"Approval transaction: {approve_tx}")
            else:
                print(f"\nStep 3: TokenManager already approved for {token.symbol}")

            # 4. Register token in TokenManager
            print(f"\nStep 4: Registering {token.symbol} in TokenManager")
            try:
                register_tx = token_ops.register_token(token.symbol, token.address)
                print(f"Registration transaction: {register_tx}")
            except Exception as error:
                if "Symbol already registered" in str(error):
                    print(f"{token.symbol} is already registered")
                else:
                    raise

            # 5. Send tokens
            print(f"\nStep 5: Sending {token.symbol} tokens")
            send_amount = int(100e18)  # Send 100 tokens
            try:
                send_tx = token_ops.send_token(token.symbol, TEST_RECIPIENT, send_amount)
                print(f"Send transaction: {send_tx}")

                # Wait for a moment to ensure transaction is processed
                time.sleep(1)

                # 6. Check final balances
                print(f"\nStep 6: Checking final balances for {token.symbol}")
                final_manager_balance = token_ops.get_token_balance(token.address, MANAGER_WALLET)
                final_recipient_balance = token_ops.get_token_balance(token.address, TEST_RECIPIENT)

                print(f"Final manager balance: {final_manager_balance / 1e18} {token.symbol}")
                print(f"Final recipient balance: {final_recipient_balance / 1e18} {token.symbol}")

                # Verify transfer
                if final_recipient_balance >= send_amount:
                    print(f"✅ Transfer successful for {token.symbol}")
                else:
                    print(f"❌ Transfer verification failed for {token.symbol}")

            except Exception as error:
                print(f"Error sending {token.symbol}:", error)

            print("\n" + "=" * 50)

    except Exception as error:
        print("Test scenario failed:", error)

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_test_scenario())