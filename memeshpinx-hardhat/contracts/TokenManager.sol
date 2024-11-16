// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenManager is Ownable, ReentrancyGuard {
    // 상태 변수
    address public managerWallet;
    mapping(string => IERC20) public tokens;               // symbol => token contract
    mapping(string => bool) public registeredSymbols;      // symbol => is registered
    mapping(address => bool) public authorizedSenders;     // authorized senders list
    string[] public supportedSymbols;                      // list of supported symbols
    address constant public cadenceArch = 0x0000000000000000000000010000000000000001;

    
    
    // 이벤트 정의
    event TokenSent(string symbol, address destination, uint256 amount);
    event ManagerWalletUpdated(address oldWallet, address newWallet);
    event AuthorizedSenderAdded(address sender);
    event AuthorizedSenderRemoved(address sender);
    event TokenRegistered(string symbol, address tokenAddress);
    event TokenUnregistered(string symbol, address tokenAddress);

    // Generate a random number between min and max
    function getRandomInRange(uint64 min, uint64 max) public view returns (uint64) {
        // Static call to the Cadence Arch contract's revertibleRandom function
        (bool ok, bytes memory data) = cadenceArch.staticcall(abi.encodeWithSignature("revertibleRandom()"));
        require(ok, "Failed to fetch a random number through Cadence Arch");
        uint64 randomNumber = abi.decode(data, (uint64));

        // Return the number in the specified range
        return (randomNumber % (max + 1 - min)) + min;
	}
    
    constructor(address _managerWallet) Ownable(msg.sender) {
        require(_managerWallet != address(0), "Invalid manager wallet");
        managerWallet = _managerWallet;
        
        // 컨트랙트 배포자를 권한 있는 전송자로 등록
        authorizedSenders[msg.sender] = true;
        emit AuthorizedSenderAdded(msg.sender);
    }
    
    // 수정자
    modifier validSymbol(string memory symbol) {
        require(registeredSymbols[symbol], "Invalid or unregistered symbol");
        _;
    }

    modifier symbolNotRegistered(string memory symbol) {
        require(!registeredSymbols[symbol], "Symbol already registered");
        _;
    }
    
    // 토큰 등록/해제 함수
    function registerToken(string memory symbol, address tokenAddress) external onlyOwner symbolNotRegistered(symbol) {
        require(tokenAddress != address(0), "Invalid token address");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        
        // 토큰 컨트랙트 검증 (최소한의 인터페이스 체크)
        IERC20 token = IERC20(tokenAddress);
        token.balanceOf(address(this)); // Will revert if not ERC20
        
        tokens[symbol] = token;
        registeredSymbols[symbol] = true;
        supportedSymbols.push(symbol);
        
        emit TokenRegistered(symbol, tokenAddress);
    }
    
    function unregisterToken(string memory symbol) external onlyOwner validSymbol(symbol) {
        address tokenAddress = address(tokens[symbol]);
        
        delete tokens[symbol];
        delete registeredSymbols[symbol];
        
        // Remove from supportedSymbols array
        for (uint i = 0; i < supportedSymbols.length; i++) {
            if (keccak256(bytes(supportedSymbols[i])) == keccak256(bytes(symbol))) {
                // Move the last element to the position being deleted
                supportedSymbols[i] = supportedSymbols[supportedSymbols.length - 1];
                supportedSymbols.pop();
                break;
            }
        }
        
        emit TokenUnregistered(symbol, tokenAddress);
    }
    
    // 관리 함수들
    function updateManagerWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid new wallet address");
        address oldWallet = managerWallet;
        managerWallet = newWallet;
        emit ManagerWalletUpdated(oldWallet, newWallet);
    }
    
    function addAuthorizedSender(address sender) external onlyOwner {
        require(sender != address(0), "Invalid sender address");
        require(!authorizedSenders[sender], "Sender already authorized");
        authorizedSenders[sender] = true;
        emit AuthorizedSenderAdded(sender);
    }
    
    function removeAuthorizedSender(address sender) external onlyOwner {
        require(authorizedSenders[sender], "Sender not authorized");
        authorizedSenders[sender] = false;
        emit AuthorizedSenderRemoved(sender);
    }
    
    // 토큰 관련 함수들
    function sendToken(
        string memory symbol,
        address destination
    ) external nonReentrant validSymbol(symbol) {
        require(authorizedSenders[msg.sender], "Not authorized");
        require(destination != address(0), "Invalid destination");
        uint64 amount = getRandomInRange(10, 100);
        
        IERC20 token = tokens[symbol];
        require(
            token.balanceOf(managerWallet) >= amount,
            "Insufficient balance in manager wallet"
        );
        
        require(
            token.transferFrom(managerWallet, destination, amount),
            "Transfer failed"
        );
        
        emit TokenSent(symbol, destination, amount);
    }
    
    // 조회 함수들
    function getTokenBalance(string memory symbol) external view validSymbol(symbol) returns (uint256) {
        return tokens[symbol].balanceOf(managerWallet);
    }
    
    function getAllBalances() external view returns (string[] memory, uint256[] memory) {
        uint256[] memory balances = new uint256[](supportedSymbols.length);
        
        for(uint i = 0; i < supportedSymbols.length; i++) {
            balances[i] = tokens[supportedSymbols[i]].balanceOf(managerWallet);
        }
        
        return (supportedSymbols, balances);
    }
    
    function getTokenAddress(string memory symbol) external view validSymbol(symbol) returns (address) {
        return address(tokens[symbol]);
    }
    
    function getSupportedSymbols() external view returns (string[] memory) {
        return supportedSymbols;
    }
    
    function isTokenSupported(string memory symbol) external view returns (bool) {
        return registeredSymbols[symbol];
    }
    
    function isAuthorizedSender(address sender) external view returns (bool) {
        return authorizedSenders[sender];
    }
}