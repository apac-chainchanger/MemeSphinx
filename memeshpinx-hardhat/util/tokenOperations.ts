import { ethers } from "ethers";

// ABI definitions
const TOKEN_MANAGER_ABI = [
  // 토큰 등록/관리 함수
  "function registerToken(string memory symbol, address tokenAddress) external",
  "function unregisterToken(string memory symbol) external",
  "function updateManagerWallet(address newWallet) external",

  // 권한 관리 함수
  "function addAuthorizedSender(address sender) external",
  "function removeAuthorizedSender(address sender) external",

  // 토큰 전송 함수
  "function sendToken(string memory symbol, address destination) external",

  // 조회 함수
  "function getTokenBalance(string memory symbol) external view returns (uint256)",
  "function getAllBalances() external view returns (string[] memory, uint256[] memory)",
  "function getTokenAddress(string memory symbol) external view returns (address)",
  "function getSupportedSymbols() external view returns (string[] memory)",
  "function isTokenSupported(string memory symbol) external view returns (bool)",
  "function isAuthorizedSender(address sender) external view returns (bool)",
  "function getRandomInRange(uint64 min, uint64 max) public view returns (uint64)",

  // 상태 변수 getter
  "function managerWallet() external view returns (address)",
  "function cadenceArch() external view returns (address)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

export class TokenOperations {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private tokenManager: ethers.Contract;

  constructor(tokenManagerAddress: string, rpcUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.tokenManager = new ethers.Contract(
      tokenManagerAddress,
      TOKEN_MANAGER_ABI,
      this.signer
    );
  }

  /**
   * 토큰 등록
   */
  async registerToken(symbol: string, tokenAddress: string): Promise<string> {
    try {
      console.log(`Registering token ${symbol} at address ${tokenAddress}...`);
      const tx = await this.tokenManager.registerToken(symbol, tokenAddress);
      const receipt = await tx.wait();
      console.log(`Token registered. Transaction hash: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error(`Failed to register token ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 토큰 전송 (수정됨: 랜덤 금액이 컨트랙트에서 결정됨)
   */
  async sendToken(
    symbol: string,
    destination: string,
    waitForConfirmation: boolean = true
  ): Promise<string> {
    try {
      console.log(`Sending tokens of ${symbol} to ${destination}...`);
      const tx = await this.tokenManager.sendToken(symbol, destination);

      if (waitForConfirmation) {
        const receipt = await tx.wait();
        console.log(`Tokens sent. Transaction hash: ${receipt.hash}`);
        return receipt.hash;
      }

      return tx.hash;
    } catch (error) {
      console.error(`Failed to send token ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * ERC20 토큰 승인
   */
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string | bigint,
    waitForConfirmation: boolean = true
  ): Promise<string> {
    try {
      console.log(`Approving ${amount} tokens for ${spenderAddress}...`);
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const tx = await token.approve(spenderAddress, amount);

      if (waitForConfirmation) {
        const receipt = await tx.wait();
        console.log(`Approval complete. Transaction hash: ${receipt.hash}`);
        return receipt.hash;
      }

      return tx.hash;
    } catch (error) {
      console.error("Failed to approve tokens:", error);
      throw error;
    }
  }

  /**
   * 현재 승인된 수량 확인
   */
  async getAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<bigint> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await token.allowance(ownerAddress, spenderAddress);
  }

  /**
   * 토큰 잔액 조회
   */
  async getTokenBalance(
    tokenAddress: string,
    addressToCheck: string
  ): Promise<bigint> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await token.balanceOf(addressToCheck);
  }

  /**
   * 토큰의 소수점 자릿수 조회
   */
  async getTokenDecimals(tokenAddress: string): Promise<number> {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await token.decimals();
  }

  /**
   * 특정 범위 내의 랜덤 값 조회 (새로 추가됨)
   */
  async getRandomInRange(min: number, max: number): Promise<number> {
    return await this.tokenManager.getRandomInRange(min, max);
  }

  async getAllBalances(): Promise<[string[], bigint[]]> {
    return await this.tokenManager.getAllBalances();
  }
}
